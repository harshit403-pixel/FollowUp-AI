import { z } from "zod";
import { dateString, objectId } from "./common";

export const createPatientBody = z.object({
  mrn: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(1).max(120),
  dateOfBirth: dateString.nullable().optional(),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email().max(200).or(z.literal("")).optional().default(""),
});

export const listPatientsQuery = z.object({
  q: z.string().trim().max(100).optional(),
});

export const contactAttemptBody = z.object({
  planId: objectId.optional(),
  method: z.enum(["phone", "sms", "email", "in_person"]).default("phone"),
  outcome: z.enum(["reached", "no_answer", "left_message", "unreachable"]),
  note: z.string().trim().max(1000).optional().default(""),
});
