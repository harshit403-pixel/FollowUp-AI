import type { Types } from "mongoose";
import { FollowUpTask } from "../models/FollowUpTask";
import { computeStatus, type TaskStatus } from "../utils/taskStatus";

export type Filter = Record<string, unknown>;

const open: Filter = { completedAt: null, closedAt: null };

/** Translate a derived status into a MongoDB filter (mirrors computeStatus). */
export function statusFilter(status: TaskStatus, today: string): Filter {
  switch (status) {
    case "Completed":
      return { completedAt: { $ne: null } };
    case "Closed":
      return { completedAt: null, closedAt: { $ne: null } };
    case "Needs Review":
      return { ...open, $or: [{ needsReview: true }, { scheduledDate: null }] };
    case "Overdue":
      return { ...open, needsReview: false, scheduledDate: { $lt: today } };
    case "Due Today":
      return { ...open, needsReview: false, scheduledDate: today };
    case "Upcoming":
      return { ...open, needsReview: false, scheduledDate: { $gt: today } };
  }
}

interface PatientRef {
  _id: Types.ObjectId;
  fullName: string;
  mrn: string;
}

export interface TaskRecord {
  _id: Types.ObjectId;
  plan: Types.ObjectId;
  patient: Types.ObjectId | PatientRef;
  order: number;
  title: string;
  description: string;
  sourceInstruction: string;
  scheduledDate: string | null;
  needsReview: boolean;
  reviewNote: string;
  completedAt: Date | null;
  completedBy: { id?: string | null; name?: string | null } | null;
  closedAt: Date | null;
  closeReason: string;
  staffNote: string;
}

export async function findTasks(filter: Filter, limit?: number): Promise<TaskRecord[]> {
  let q = FollowUpTask.find(filter)
    .populate("patient", "fullName mrn")
    .sort({ scheduledDate: 1, order: 1 });
  if (limit) q = q.limit(limit);
  return (await q.lean()) as unknown as TaskRecord[];
}

export function toTaskDTO(t: TaskRecord, today: string) {
  const populated = typeof t.patient === "object" && "fullName" in t.patient ? t.patient : null;
  return {
    id: String(t._id),
    planId: String(t.plan),
    patientId: String(populated ? populated._id : t.patient),
    patientName: populated?.fullName ?? null,
    patientMrn: populated?.mrn ?? null,
    title: t.title,
    description: t.description,
    sourceInstruction: t.sourceInstruction,
    scheduledDate: t.scheduledDate ?? null,
    needsReview: t.needsReview,
    reviewNote: t.reviewNote,
    completedAt: t.completedAt ?? null,
    completedBy: t.completedBy?.name ?? null,
    closedAt: t.closedAt ?? null,
    closeReason: t.closeReason,
    staffNote: t.staffNote,
    status: computeStatus(
      {
        scheduledDate: t.scheduledDate ?? null,
        needsReview: t.needsReview,
        completedAt: t.completedAt ?? null,
        closedAt: t.closedAt ?? null,
      },
      today,
    ),
  };
}

export type TaskDTO = ReturnType<typeof toTaskDTO>;
