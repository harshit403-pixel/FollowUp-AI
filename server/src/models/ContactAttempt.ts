import { Schema, model, type InferSchemaType } from "mongoose";

// Records a staff member's attempt to reach a patient. The app never contacts patients itself.
const contactSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "FollowUpPlan", default: null },
    method: { type: String, enum: ["phone", "sms", "email", "in_person"], default: "phone" },
    outcome: {
      type: String,
      enum: ["reached", "no_answer", "left_message", "unreachable"],
      required: true,
    },
    note: { type: String, default: "" },
    by: { type: new Schema({ id: String, name: String }, { _id: false }), required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ContactAttemptDoc = InferSchemaType<typeof contactSchema>;
export const ContactAttempt = model("ContactAttempt", contactSchema);
