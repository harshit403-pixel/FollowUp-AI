import { api } from "@/lib/api";
import type { ContactAttempt, PatientDetail, PatientSummary } from "@/types";

export const listPatients = (q?: string) =>
  api<{ patients: PatientSummary[] }>("/patients", { query: { q } }).then((r) => r.patients);

export const getPatient = (id: string) => api<PatientDetail>(`/patients/${id}`);

export const createPatient = (body: {
  mrn: string;
  fullName: string;
  dateOfBirth?: string | null;
  phone?: string;
  email?: string;
}) => api<{ id: string; portalToken: string }>("/patients", { method: "POST", body });

export const addContactAttempt = (
  patientId: string,
  body: {
    planId?: string;
    method: ContactAttempt["method"];
    outcome: ContactAttempt["outcome"];
    note?: string;
  },
) => api<{ id: string }>(`/patients/${patientId}/contact-attempts`, { method: "POST", body });
