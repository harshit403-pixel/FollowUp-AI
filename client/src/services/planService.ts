import { api } from "@/lib/api";
import type { Draft, PlanDetail } from "@/types";

export const createPlan = (patientId: string, instructions: string) =>
  api<{ id: string }>("/follow-up-plans", { method: "POST", body: { patientId, instructions } });

export const getPlan = (id: string) => api<PlanDetail>(`/follow-up-plans/${id}`);

export const generateDraft = (id: string) =>
  api<PlanDetail>(`/follow-up-plans/${id}/generate`, { method: "POST" });

export const saveDraft = (
  id: string,
  draft: Pick<Draft, "summary" | "clinicianFollowUpDate" | "items" | "flags">,
) => api<PlanDetail>(`/follow-up-plans/${id}/draft`, { method: "PUT", body: draft });

export const approvePlan = (id: string, acknowledgeFlags: boolean) =>
  api<PlanDetail>(`/follow-up-plans/${id}/approve`, { method: "POST", body: { acknowledgeFlags } });

export const addNote = (id: string, text: string) =>
  api<PlanDetail>(`/follow-up-plans/${id}/notes`, { method: "POST", body: { text } });
