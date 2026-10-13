import { z } from "zod";
import { isValidDateString, isValidMonth } from "../utils/dates";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const idParam = z.object({ id: objectId });

export const dateString = z
  .string()
  .refine(isValidDateString, "Must be a valid date in YYYY-MM-DD format");

export const monthString = z.string().refine(isValidMonth, "Must be in YYYY-MM format");
