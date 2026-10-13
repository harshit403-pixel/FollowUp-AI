import type { z } from "zod";
import { env } from "../../config/env";
import { ActivityLog } from "../../models/ActivityLog";
import { ContactAttempt } from "../../models/ContactAttempt";
import { FollowUpPlan } from "../../models/FollowUpPlan";
import { FollowUpTask } from "../../models/FollowUpTask";
import { Patient } from "../../models/Patient";
import { findTasks, toTaskDTO } from "../../repositories/taskRepository";
import type { DraftInput, noteBody } from "../../schemas/followUp";
import type { AuthUser } from "../../types/express";
import { ApiError } from "../../utils/ApiError";
import { todayInTz } from "../../utils/dates";
import { logActivity } from "../activityService";

const actorOf = (u: AuthUser) => ({ id: u.id, name: u.name });

/** Chronological order: dated items ascending, undated items last (stable). */
function sortChronologically<T extends { suggestedDate: string | null }>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const da = a.item.suggestedDate;
      const db = b.item.suggestedDate;
      if (da && db) return da < db ? -1 : da > db ? 1 : a.i - b.i;
      if (da) return -1;
      if (db) return 1;
      return a.i - b.i;
    })
    .map((x) => x.item);
}

export async function createPlan(patientId: string, instructions: string, actor: AuthUser) {
  const patient = await Patient.findById(patientId).lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  const plan = await FollowUpPlan.create({
    patient: patient._id,
    originalInstructions: instructions,
    createdBy: actorOf(actor),
  });
  await logActivity({
    plan: plan._id,
    patient: patient._id,
    action: "plan_created",
    detail: "Original clinician instructions recorded",
    actor,
  });
  return { id: String(plan._id), status: plan.status };
}

/**
 * Store a draft (staff-authored or, in Phase 5, AI-generated and Zod-validated).
 * Drafts can be edited until the plan is approved.
 */
export async function saveDraft(
  planId: string,
  draft: DraftInput,
  actor: AuthUser,
  meta?: { source: "ai" | "manual"; model?: string; generatedAt?: Date },
) {
  const plan = await FollowUpPlan.findById(planId);
  if (!plan) throw ApiError.notFound("Plan not found");
  if (plan.status === "approved") {
    throw ApiError.conflict("This plan is already approved and can no longer be edited");
  }
  const previous = plan.draft;
  plan.draft = {
    summary: draft.summary,
    clinicianFollowUpDate: draft.clinicianFollowUpDate,
    items: sortChronologically(draft.items),
    flags: draft.flags,
    source: meta?.source ?? previous?.source ?? "manual",
    model: meta?.model ?? previous?.model ?? "",
    generatedAt: meta?.generatedAt ?? previous?.generatedAt ?? null,
  } as typeof plan.draft;
  plan.status = "draft_ready";
  await plan.save();
  await logActivity({
    plan: plan._id,
    patient: plan.patient,
    action: meta?.source === "ai" ? "draft_generated" : "draft_edited",
    detail: `${draft.items.length} task(s), ${draft.flags.length} flag(s)`,
    actor,
  });
  return getPlanDetail(planId);
}

export async function approvePlan(planId: string, actor: AuthUser, acknowledgeFlags: boolean) {
  const plan = await FollowUpPlan.findById(planId).lean();
  if (!plan) throw ApiError.notFound("Plan not found");
  if (plan.status === "approved") throw ApiError.conflict("Plan is already approved");
  if (plan.status !== "draft_ready" || !plan.draft) {
    throw ApiError.conflict("There is no draft to approve yet");
  }
  const draft = plan.draft;
  if (draft.items.length === 0) throw ApiError.badRequest("The draft has no tasks to approve");
  if (draft.flags.length > 0 && !acknowledgeFlags) {
    throw ApiError.conflict(
      `The draft has ${draft.flags.length} open flag(s). Review them and confirm to approve.`,
    );
  }

  // Atomic claim so a double-click cannot approve (and create tasks) twice.
  const claimed = await FollowUpPlan.findOneAndUpdate(
    { _id: planId, status: "draft_ready" },
    {
      $set: { status: "approved" },
      $push: {
        approvedVersions: {
          version: plan.approvedVersions.length + 1,
          approvedAt: new Date(),
          approvedBy: actorOf(actor),
          snapshot: draft,
        },
      },
    },
    { new: true },
  );
  if (!claimed) throw ApiError.conflict("Plan was already approved");

  try {
    await FollowUpTask.insertMany(
      draft.items.map((item, order) => ({
        plan: plan._id,
        patient: plan.patient,
        order,
        title: item.title,
        description: item.description,
        sourceInstruction: item.sourceInstruction,
        scheduledDate: item.suggestedDate ?? null,
        // No confirmed date means the task goes to "Needs Scheduling", never onto a guessed day.
        needsReview: item.needsReview || !item.suggestedDate,
        reviewNote:
          item.reviewNote || (item.suggestedDate ? "" : "Date requires clinician confirmation"),
      })),
    );
  } catch (err) {
    await FollowUpPlan.updateOne(
      { _id: planId },
      { $set: { status: "draft_ready" }, $pop: { approvedVersions: 1 } },
    );
    throw err;
  }

  await logActivity({
    plan: plan._id,
    patient: plan.patient,
    action: "plan_approved",
    detail: `Version ${plan.approvedVersions.length + 1}, ${draft.items.length} task(s) activated`,
    actor,
  });
  return getPlanDetail(planId);
}

export async function addNote(planId: string, body: z.infer<typeof noteBody>, actor: AuthUser) {
  const plan = await FollowUpPlan.findById(planId);
  if (!plan) throw ApiError.notFound("Plan not found");
  plan.notes.push({ text: body.text, by: actorOf(actor), at: new Date() });
  await plan.save();
  await logActivity({ plan: plan._id, patient: plan.patient, action: "note_added", actor });
  return getPlanDetail(planId);
}

export async function getPlanDetail(planId: string) {
  const plan = await FollowUpPlan.findById(planId).lean();
  if (!plan) throw ApiError.notFound("Plan not found");
  const today = todayInTz(env.APP_TIMEZONE);

  const [patient, taskRecords, contacts, activity] = await Promise.all([
    Patient.findById(plan.patient).lean(),
    findTasks({ plan: plan._id }),
    ContactAttempt.find({ patient: plan.patient }).sort({ createdAt: -1 }).limit(50).lean(),
    ActivityLog.find({ plan: plan._id }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const tasks = taskRecords.map((t) => toTaskDTO(t, today));
  const closed = tasks.filter((t) => t.status === "Closed").length;
  const completed = tasks.filter((t) => t.status === "Completed").length;

  return {
    id: String(plan._id),
    status: plan.status,
    originalInstructions: plan.originalInstructions,
    draft: plan.draft ?? null,
    approvedVersions: plan.approvedVersions.map((v) => ({
      version: v.version,
      approvedAt: v.approvedAt,
      approvedBy: v.approvedBy?.name ?? null,
    })),
    notes: plan.notes.map((n) => ({
      id: String(n._id),
      text: n.text,
      by: n.by?.name ?? null,
      at: n.at,
    })),
    createdBy: plan.createdBy?.name ?? null,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    patient: patient && {
      id: String(patient._id),
      mrn: patient.mrn,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email,
    },
    tasks,
    progress: { completed, total: tasks.length - closed, closed },
    contactAttempts: contacts.map((c) => ({
      id: String(c._id),
      method: c.method,
      outcome: c.outcome,
      note: c.note,
      by: c.by?.name ?? null,
      at: c.createdAt,
    })),
    activity: activity.map((a) => ({
      id: String(a._id),
      action: a.action,
      detail: a.detail,
      actor: a.actor?.name ?? null,
      at: a.createdAt,
    })),
  };
}
