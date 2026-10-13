import { Schema, model, type InferSchemaType } from "mongoose";

const activitySchema = new Schema(
  {
    plan: { type: Schema.Types.ObjectId, ref: "FollowUpPlan", index: true },
    task: { type: Schema.Types.ObjectId, ref: "FollowUpTask", default: null },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", index: true },
    action: { type: String, required: true },
    detail: { type: String, default: "" },
    actor: { type: new Schema({ id: String, name: String }, { _id: false }), required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ActivityLogDoc = InferSchemaType<typeof activitySchema>;
export const ActivityLog = model("ActivityLog", activitySchema);
