import { env } from "../../config/env";
import { draftSchema, type DraftInput } from "../../schemas/followUp";
import { ApiError } from "../../utils/ApiError";

const responseSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    clinicianFollowUpDate: { type: "STRING", nullable: true },
    items: { type: "ARRAY", items: { type: "OBJECT", properties: {
      title: { type: "STRING" }, description: { type: "STRING" }, sourceInstruction: { type: "STRING" },
      suggestedDate: { type: "STRING", nullable: true }, needsReview: { type: "BOOLEAN" }, reviewNote: { type: "STRING" }
    }, required: ["title", "description", "sourceInstruction", "suggestedDate", "needsReview", "reviewNote"] } },
    flags: { type: "ARRAY", items: { type: "OBJECT", properties: { type: { type: "STRING", enum: ["missing_date", "ambiguous", "unsupported_assumption", "other"] }, message: { type: "STRING" } }, required: ["type", "message"] } }
  }, required: ["summary", "clinicianFollowUpDate", "items", "flags"]
};

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value ? value : null;
}

function sourceHasExactDate(date: string, instructions: string): boolean {
  const exactDates: string[] = instructions.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  if (exactDates.includes(date)) return true;

  // Accept unambiguous written dates such as "2 November 2026" and "November 2, 2026".
  const [year, month, day] = date.split("-").map(Number);
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthName = months[month - 1];
  const escapedMonth = monthName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const dayText = String(day);
  const dayPadded = String(day).padStart(2, "0");
  const writtenFormats = [
    new RegExp(`\\b${dayText}(?:st|nd|rd|th)?\\s+${escapedMonth}\\s+${year}\\b`, "i"),
    new RegExp(`\\b${escapedMonth}\\s+${dayText}(?:st|nd|rd|th)?,?\\s+${year}\\b`, "i"),
    new RegExp(`\\b${dayPadded}\\s+${escapedMonth}\\s+${year}\\b`, "i"),
  ];
  return writtenFormats.some((pattern) => pattern.test(instructions));
}

function normalizeAndValidate(raw: unknown, instructions: string): DraftInput {
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Gemini response did not match the required plan schema");
  const source = instructions.toLowerCase();
  const draft = parsed.data;

  // A clinician follow-up date is retained only when it is explicitly stated in the source.
  const followUpDate = parseDate(draft.clinicianFollowUpDate);
  const followUpText = instructions.match(/follow.?up.{0,80}/i)?.[0] ?? "";
  draft.clinicianFollowUpDate =
    followUpDate && sourceHasExactDate(followUpDate, followUpText) ? followUpDate : null;

  let unsupportedSource = false;
  let calculatedDatesNeedReview = false;
  draft.items = draft.items.map((item) => {
    const date = parseDate(item.suggestedDate);
    const exactSourceDate = !!date && sourceHasExactDate(date, item.sourceInstruction);
    const sourceExcerptIsVerbatim =
      item.sourceInstruction.trim().length > 0 &&
      source.includes(item.sourceInstruction.trim().toLowerCase());

    if (!sourceExcerptIsVerbatim) unsupportedSource = true;

    // A date derived from explicit relative timing (for example, "within 48 hours
    // of discharge") may be prefilled, but must be clearly marked for staff review.
    // Dates with no explicit source date or supported relative rule are not trusted.
    const hasRelativeTiming =
      /\b(within|in|after|before|prior to|day\s*\d+|two weeks|three weeks|one week|48 hours|24 hours|hours|days|weeks)\b/i
        .test(item.sourceInstruction);
    const keepDerivedDate = !!date && !exactSourceDate && item.needsReview && hasRelativeTiming;

    if (keepDerivedDate) calculatedDatesNeedReview = true;

    return {
      ...item,
      suggestedDate: exactSourceDate || keepDerivedDate ? date : null,
      needsReview: item.needsReview || !exactSourceDate || !sourceExcerptIsVerbatim,
      reviewNote: !sourceExcerptIsVerbatim
        ? "Verify this task against the original clinician instructions; its source excerpt could not be verified verbatim."
        : exactSourceDate
          ? item.reviewNote
          : keepDerivedDate
            ? (item.reviewNote || "AI-calculated from relative timing; verify or edit this date before approval.")
            : (item.reviewNote || "Date requires clinician confirmation"),
      sourceInstruction: item.sourceInstruction.trim(),
    };
  });

  if (draft.items.some((item) => !item.suggestedDate) && !draft.flags.some((f) => f.type === "missing_date")) {
    draft.flags.push({
      type: "missing_date",
      message: "One or more tasks have no supported calendar date. Confirm timing before approval.",
    });
  }
  if (calculatedDatesNeedReview && !draft.flags.some((f) => f.type === "ambiguous")) {
    draft.flags.push({
      type: "ambiguous",
      message: "One or more dates were calculated from relative timing. Review or edit these suggested dates before approval.",
    });
  }
  if (unsupportedSource) {
    draft.flags.push({
      type: "unsupported_assumption",
      message: "At least one AI-generated task could not be linked to an exact source excerpt. Verify or remove it before approval.",
    });
  }
  return draftSchema.parse(draft);
}

export async function generateGeminiDraft(instructions: string, patient: { fullName: string; mrn: string }): Promise<{ draft: DraftInput; model: string }> {
  if (!env.GEMINI_API_KEY) throw ApiError.badRequest("Gemini is not configured. Add GEMINI_API_KEY to server/.env and restart the server.");
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You are a healthcare administration assistant, not a clinician. Convert the supplied clinician instructions into a reviewable administrative follow-up plan. Never diagnose, triage, prescribe, invent care tasks, medication advice, dosages, preparation steps, appointments, dates, or deadlines. Create tasks only for actions explicitly present in the instructions. If the instructions request a 20-day plan, organize only explicitly supported actions within that 20-day horizon; do not invent one task per day. Return dates in YYYY-MM-DD format. Populate a date when it is explicitly stated OR when a clear relative timing rule can be calculated from an explicit anchor date in the instructions (for example, "within 48 hours of discharge" when the discharge date is provided). Mark every calculated date needsReview=true and explain that it is an AI-calculated suggestion that staff must verify or edit. Never calculate from an unstated anchor, never use today's date as a substitute, and never invent a deadline. If timing cannot be calculated from a stated anchor, use suggestedDate=null and mark it for confirmation. Every task's sourceInstruction must be a short verbatim excerpt from the supplied instructions. If timing, ownership, or meaning is unclear, flag it for human review. Return an empty items array only if no actionable task can safely be extracted. The output is a DRAFT and must never imply approval.\nPatient context (identifier only): ${patient.fullName} (${patient.mrn})\n\nORIGINAL CLINICIAN INSTRUCTIONS (immutable source):\n${instructions}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseSchema } }),
        signal: AbortSignal.timeout(45000),
      });
      const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || `Gemini request failed (${response.status})`);
      const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
      if (!text) throw new Error("Gemini returned an empty response");
      const raw = JSON.parse(text) as unknown;
      return { draft: normalizeAndValidate(raw, instructions), model };
    } catch (error) {
      lastError = error;
    }
  }
  console.error("Gemini plan generation failed:", lastError);
  throw ApiError.badRequest("AI could not produce a valid plan. Check the instructions and API key, then try again. No draft was saved.");
}
