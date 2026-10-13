import { Schema, model, type InferSchemaType } from "mongoose";

const actor = new Schema({ id: String, name: String }, { _id: false });

const draftItem = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    sourceInstruction: { type: String, required: true },
    suggestedDate: { type: String, default: null }, // YYYY-MM-DD, only if supported by source
    needsReview: { type: Boolean, default: false },
    reviewNote: { type: String, default: "" },
  },
  { _id: false },
);

const draft = new Schema(
  {
    summary: { type: String, required: true },
    clinicianFollowUpDate: { type: String, default: null },
    items: { type: [draftItem], default: [] },
    flags: {
      type: [
        new Schema(
          {
            type: {
              type: String,
              enum: ["missing_date", "ambiguous", "unsupported_assumption", "other"],
              required: true,
            },
            message: { type: String, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    source: { type: String, enum: ["ai", "manual"], default: "manual" },
    model: { type: String, default: "" },
    generatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const planSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    // Immutable: the clinician's words are never edited after creation.
    originalInstructions: { type: String, required: true, immutable: true },
    status: {
      type: String,
      enum: ["awaiting_generation", "draft_ready", "approved"],
      default: "awaiting_generation",
      index: true,
    },
    draft: { type: draft, default: null },
    approvedVersions: {
      type: [
        new Schema(
          {
            version: { type: Number, required: true },
            approvedAt: { type: Date, required: true },
            approvedBy: { type: actor, required: true },
            snapshot: { type: draft, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    notes: {
      type: [new Schema({ text: String, by: actor, at: Date }, { _id: true })],
      default: [],
    },
    createdBy: { type: actor, required: true },
  },
  { timestamps: true },
);

export type FollowUpPlanDoc = InferSchemaType<typeof planSchema>;
export const FollowUpPlan = model("FollowUpPlan", planSchema);
