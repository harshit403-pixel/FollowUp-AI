import { Schema, model, type InferSchemaType } from "mongoose";

// Synthetic demo patients only.
const patientSchema = new Schema(
  {
    mrn: { type: String, required: true, unique: true, trim: true }, // synthetic identifier
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, default: null }, // YYYY-MM-DD
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

patientSchema.index({ fullName: "text", mrn: "text" });

export type PatientDoc = InferSchemaType<typeof patientSchema>;
export const Patient = model("Patient", patientSchema);
