import { Schema, model, type InferSchemaType } from "mongoose";

const actor = new Schema({ id: String, name: String }, { _id: false });

// Status (Upcoming / Due Today / Overdue / ...) is derived from these fields in utils/taskStatus.ts.
const taskSchema = new Schema(
  {
    plan: { type: Schema.Types.ObjectId, ref: "FollowUpPlan", required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    order: { type: Number, default: 0 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    sourceInstruction: { type: String, required: true },
    scheduledDate: { type: String, default: null, index: true }, // YYYY-MM-DD or null until confirmed
    needsReview: { type: Boolean, default: false },
    reviewNote: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    completedBy: { type: actor, default: null },
    closedAt: { type: Date, default: null },
    closedBy: { type: actor, default: null },
    closeReason: { type: String, default: "" },
    staffNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export type FollowUpTaskDoc = InferSchemaType<typeof taskSchema>;
export const FollowUpTask = model("FollowUpTask", taskSchema);
