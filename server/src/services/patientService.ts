import type { Types } from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import type { z } from "zod";
import { env } from "../config/env";
import { ContactAttempt } from "../models/ContactAttempt";
import { FollowUpPlan } from "../models/FollowUpPlan";
import { FollowUpTask } from "../models/FollowUpTask";
import { Patient } from "../models/Patient";
import type { contactAttemptBody, createPatientBody } from "../schemas/patient";
import type { AuthUser } from "../types/express";
import { ApiError } from "../utils/ApiError";
import { todayInTz } from "../utils/dates";
import { escapeRegex } from "../utils/regex";
import { computeStatus } from "../utils/taskStatus";
import { logActivity } from "./activityService";

interface PatientLean {
  _id: Types.ObjectId;
  mrn: string;
  fullName: string;
  dateOfBirth?: string | null;
  phone?: string;
  email?: string;
  createdAt: Date;
}

const OUTCOME_LABEL: Record<string, string> = {
  no_answer: "No answer on last contact attempt",
  left_message: "Message left, patient not yet reached",
  unreachable: "Patient unreachable",
};

/** Per-patient progress, task counts and "needs attention" reasons, all derived from stored records. */
export async function buildSummaries(patients: PatientLean[], today: string) {
  const ids = patients.map((p) => p._id);
  const [plans, tasks, contacts] = await Promise.all([
    FollowUpPlan.find({ patient: { $in: ids } }, "patient status createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    FollowUpTask.find(
      { patient: { $in: ids } },
      "patient scheduledDate needsReview completedAt closedAt",
    ).lean(),
    ContactAttempt.find({ patient: { $in: ids } }, "patient outcome createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return patients.map((p) => {
    const key = String(p._id);
    const latestPlan = plans.find((pl) => String(pl.patient) === key) ?? null;
    const lastContact = contacts.find((c) => String(c.patient) === key) ?? null;
    const counts = { overdue: 0, dueToday: 0, needsReview: 0, upcoming: 0, completed: 0, closed: 0, total: 0 };
    for (const t of tasks.filter((t) => String(t.patient) === key)) {
      counts.total++;
      const s = computeStatus(
        {
          scheduledDate: t.scheduledDate ?? null,
          needsReview: t.needsReview,
          completedAt: t.completedAt ?? null,
          closedAt: t.closedAt ?? null,
        },
        today,
      );
      if (s === "Overdue") counts.overdue++;
      else if (s === "Due Today") counts.dueToday++;
      else if (s === "Needs Review") counts.needsReview++;
      else if (s === "Upcoming") counts.upcoming++;
      else if (s === "Completed") counts.completed++;
      else counts.closed++;
    }

    const attentionReasons: string[] = [];
    if (counts.overdue) attentionReasons.push(`${counts.overdue} overdue task(s)`);
    if (counts.needsReview) attentionReasons.push(`${counts.needsReview} task(s) need scheduling or review`);
    if (latestPlan?.status === "awaiting_generation") attentionReasons.push("Instructions awaiting a draft plan");
    if (latestPlan?.status === "draft_ready") attentionReasons.push("Draft plan awaiting approval");
    if (lastContact && lastContact.outcome !== "reached") {
      attentionReasons.push(OUTCOME_LABEL[lastContact.outcome] ?? "Patient not yet reached");
    }

    return {
      id: key,
      mrn: p.mrn,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth ?? null,
      phone: p.phone ?? "",
      email: p.email ?? "",
      latestPlan: latestPlan ? { id: String(latestPlan._id), status: latestPlan.status } : null,
      progress: { completed: counts.completed, total: counts.total - counts.closed },
      counts,
      lastContact: lastContact ? { outcome: lastContact.outcome, at: lastContact.createdAt } : null,
      attentionReasons,
    };
  });
}

export async function createPatient(body: z.infer<typeof createPatientBody>) {
  const portalToken = randomBytes(32).toString("base64url");
  const portalTokenHash = createHash("sha256").update(portalToken).digest("hex");
  const patient = await Patient.create({ ...body, portalTokenHash });
  return { id: String(patient._id), mrn: patient.mrn, fullName: patient.fullName, portalToken };
}

export async function listPatients(q?: string) {
  const filter = q
    ? { $or: [{ fullName: new RegExp(escapeRegex(q), "i") }, { mrn: new RegExp(escapeRegex(q), "i") }] }
    : {};
  const patients = (await Patient.find(filter).sort({ createdAt: -1 }).limit(200).lean()) as PatientLean[];
  return buildSummaries(patients, todayInTz(env.APP_TIMEZONE));
}

export async function getPatientDetail(id: string) {
  const patient = (await Patient.findById(id).lean()) as PatientLean | null;
  if (!patient) throw ApiError.notFound("Patient not found");
  const today = todayInTz(env.APP_TIMEZONE);
  const [[summary], plans, contacts] = await Promise.all([
    buildSummaries([patient], today),
    FollowUpPlan.find({ patient: patient._id }, "status createdAt").sort({ createdAt: -1 }).lean(),
    ContactAttempt.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  return {
    ...summary,
    plans: plans.map((p) => ({ id: String(p._id), status: p.status, createdAt: p.createdAt })),
    contactAttempts: contacts.map((c) => ({
      id: String(c._id),
      planId: c.plan ? String(c.plan) : null,
      method: c.method,
      outcome: c.outcome,
      note: c.note,
      by: c.by?.name ?? null,
      at: c.createdAt,
    })),
  };
}

export async function addContactAttempt(
  patientId: string,
  body: z.infer<typeof contactAttemptBody>,
  actor: AuthUser,
) {
  const patient = await Patient.findById(patientId, "_id").lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  if (body.planId) {
    const plan = await FollowUpPlan.exists({ _id: body.planId, patient: patientId });
    if (!plan) throw ApiError.badRequest("That plan does not belong to this patient");
  }
  const attempt = await ContactAttempt.create({
    patient: patientId,
    plan: body.planId ?? null,
    method: body.method,
    outcome: body.outcome,
    note: body.note,
    by: { id: actor.id, name: actor.name },
  });
  await logActivity({
    plan: body.planId,
    patient: patientId,
    action: "contact_attempt",
    detail: `${body.method}: ${body.outcome}`,
    actor,
  });
  return { id: String(attempt._id) };
}


/** Public, read-only patient portal. Access is granted only by a high-entropy, unguessable share token. */
export async function getPatientPortal(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const patient = await Patient.findOne({ portalTokenHash: tokenHash }).select("+portalTokenHash").lean();
  if (!patient) throw ApiError.notFound("This patient portal link is invalid or has been revoked");
  const plan = await FollowUpPlan.findOne({ patient: patient._id, status: "approved" }).sort({ updatedAt: -1 }).lean();
  if (!plan) return { patient: { fullName: patient.fullName, mrn: patient.mrn }, plan: null, tasks: [] };
  const tasks = await FollowUpTask.find({ plan: plan._id, closedAt: null }).sort({ scheduledDate: 1, order: 1 }).lean();
  const today = todayInTz(env.APP_TIMEZONE);
  return {
    patient: { fullName: patient.fullName, mrn: patient.mrn },
    plan: { summary: plan.draft?.summary ?? "", clinicianFollowUpDate: plan.draft?.clinicianFollowUpDate ?? null },
    tasks: tasks.map((task) => ({
      id: String(task._id), title: task.title, description: task.description,
      scheduledDate: task.scheduledDate ?? null,
      status: computeStatus({ scheduledDate: task.scheduledDate ?? null, needsReview: task.needsReview, completedAt: task.completedAt ?? null, closedAt: task.closedAt ?? null }, today),
      completedAt: task.completedAt ?? null,
      needsReview: task.needsReview,
    })),
  };
}
