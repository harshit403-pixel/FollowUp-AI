import { env } from "../../config/env";
import { FollowUpTask } from "../../models/FollowUpTask";
import { Patient } from "../../models/Patient";
import {
  findTasks,
  statusFilter,
  toTaskDTO,
  type Filter,
} from "../../repositories/taskRepository";
import type { z } from "zod";
import type { listTasksQuery, updateTaskBody } from "../../schemas/followUp";
import type { AuthUser } from "../../types/express";
import { ApiError } from "../../utils/ApiError";
import { todayInTz } from "../../utils/dates";
import { escapeRegex } from "../../utils/regex";
import { logActivity } from "../activityService";

export async function listTasks(query: z.infer<typeof listTasksQuery>) {
  const today = todayInTz(env.APP_TIMEZONE);
  const and: Filter[] = [];
  if (query.status) and.push(statusFilter(query.status, today));
  if (query.patientId) and.push({ patient: query.patientId });
  if (query.planId) and.push({ plan: query.planId });
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    const patients = await Patient.find({ $or: [{ fullName: rx }, { mrn: rx }] }, "_id").lean();
    and.push({ $or: [{ title: rx }, { patient: { $in: patients.map((p) => p._id) } }] });
  }
  const tasks = await findTasks(and.length ? { $and: and } : {});
  return tasks.map((t) => toTaskDTO(t, today));
}

export async function updateTask(
  id: string,
  body: z.infer<typeof updateTaskBody>,
  actor: AuthUser,
) {
  const today = todayInTz(env.APP_TIMEZONE);
  const task = await FollowUpTask.findById(id);
  if (!task) throw ApiError.notFound("Task not found");

  const who = { id: actor.id, name: actor.name };
  const log = (action: string, detail = "") =>
    logActivity({ plan: task.plan, task: task._id, patient: task.patient, action, detail, actor: who });
  const events: Array<[string, string]> = [];

  if (body.close) {
    if (actor.role !== "coordinator") throw ApiError.forbidden("Only a coordinator can close a task");
    if (task.completedAt) throw ApiError.conflict("Task is already completed");
    if (task.closedAt) throw ApiError.conflict("Task is already closed");
    task.closedAt = new Date();
    task.closedBy = who;
    task.closeReason = body.closeReason ?? "";
    events.push(["task_closed", `${task.title}: ${task.closeReason}`]);
  }

  if (body.scheduledDate !== undefined) {
    if (task.completedAt || task.closedAt) {
      throw ApiError.conflict("Cannot reschedule a completed or closed task");
    }
    task.scheduledDate = body.scheduledDate;
    task.needsReview = false;
    task.reviewNote = "";
    events.push(["date_confirmed", `${task.title}: ${body.scheduledDate}`]);
  }

  if (body.completed !== undefined) {
    if (body.completed) {
      if (task.closedAt) throw ApiError.conflict("Task is closed");
      if (!task.completedAt) {
        task.completedAt = new Date();
        task.completedBy = who;
        events.push(["task_completed", task.title]);
      }
    } else if (task.completedAt) {
      task.completedAt = null;
      task.completedBy = null;
      events.push(["task_reopened", task.title]);
    }
  }

  if (body.staffNote !== undefined && body.staffNote !== task.staffNote) {
    task.staffNote = body.staffNote;
    events.push(["task_note_updated", task.title]);
  }

  await task.save();
  for (const [action, detail] of events) await log(action, detail);

  const [dto] = (await findTasks({ _id: task._id })).map((t) => toTaskDTO(t, today));
  return dto;
}
