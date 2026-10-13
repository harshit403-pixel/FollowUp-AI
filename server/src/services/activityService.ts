import type { Types } from "mongoose";
import { ActivityLog } from "../models/ActivityLog";
import type { AuthUser } from "../types/express";

interface LogInput {
  plan?: Types.ObjectId | string | null;
  task?: Types.ObjectId | string | null;
  patient?: Types.ObjectId | string | null;
  action: string;
  detail?: string;
  actor: Pick<AuthUser, "id" | "name">;
}

export async function logActivity(input: LogInput): Promise<void> {
  await ActivityLog.create({
    plan: input.plan ?? undefined,
    task: input.task ?? null,
    patient: input.patient ?? undefined,
    action: input.action,
    detail: input.detail ?? "",
    actor: { id: input.actor.id, name: input.actor.name },
  });
}
