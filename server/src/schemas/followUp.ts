import { z } from "zod";
import { dateString, monthString, objectId } from "./common";

export const createPlanBody = z.object({
  patientId: objectId,
  instructions: z.string().trim().min(10, "Instructions are too short").max(10000),
});

/**
 * Shape of a follow-up draft. Used both to validate staff edits and
 * (in Phase 5) to validate Gemini output before anything is saved.
 */
export const draftItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  // Verbatim excerpt of the clinician instructions this task comes from.
  sourceInstruction: z.string().trim().min(1).max(2000),
  suggestedDate: dateString.nullable().default(null),
  needsReview: z.boolean().default(false),
  reviewNote: z.string().trim().max(500).default(""),
});

export const draftFlagSchema = z.object({
  type: z.enum(["missing_date", "ambiguous", "unsupported_assumption", "other"]),
  message: z.string().trim().min(1).max(500),
});

export const draftSchema = z.object({
  summary: z.string().trim().min(1).max(2000),
  clinicianFollowUpDate: dateString.nullable().default(null),
  items: z.array(draftItemSchema).max(50),
  flags: z.array(draftFlagSchema).max(50).default([]),
});

export type DraftInput = z.infer<typeof draftSchema>;

export const approveBody = z.object({
  // Staff must explicitly acknowledge outstanding AI/ambiguity flags before approving.
  acknowledgeFlags: z.boolean().default(false),
});

export const noteBody = z.object({ text: z.string().trim().min(1).max(2000) });

export const listTasksQuery = z.object({
  status: z
    .enum(["Upcoming", "Due Today", "Overdue", "Completed", "Needs Review", "Closed"])
    .optional(),
  patientId: objectId.optional(),
  planId: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});

export const updateTaskBody = z
  .object({
    completed: z.boolean(),
    staffNote: z.string().trim().max(1000),
    // Staff may confirm a date for a task that lacked one. Null is not allowed.
    scheduledDate: dateString,
    close: z.boolean(),
    closeReason: z.string().trim().min(3).max(500),
  })
  .partial()
  .refine((b) => Object.keys(b).length > 0, "No changes supplied")
  .refine((b) => !b.close || !!b.closeReason, {
    message: "A reason is required to close a task",
    path: ["closeReason"],
  });

export const calendarQuery = z.object({ month: monthString });
