export type Role = "staff" | "coordinator";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
}

export type TaskStatus =
  | "Upcoming"
  | "Due Today"
  | "Overdue"
  | "Completed"
  | "Needs Review"
  | "Closed";

export const TASK_STATUSES: TaskStatus[] = [
  "Due Today",
  "Overdue",
  "Needs Review",
  "Upcoming",
  "Completed",
  "Closed",
];

export interface Task {
  id: string;
  planId: string;
  patientId: string;
  patientName: string | null;
  patientMrn: string | null;
  title: string;
  description: string;
  sourceInstruction: string;
  scheduledDate: string | null;
  needsReview: boolean;
  reviewNote: string;
  completedAt: string | null;
  completedBy: string | null;
  closedAt: string | null;
  closeReason: string;
  staffNote: string;
  status: TaskStatus;
}

export interface TaskPatch {
  completed?: boolean;
  staffNote?: string;
  scheduledDate?: string;
  close?: boolean;
  closeReason?: string;
}

export interface DraftItem {
  title: string;
  description: string;
  sourceInstruction: string;
  suggestedDate: string | null;
  needsReview: boolean;
  reviewNote: string;
}

export interface DraftFlag {
  type: "missing_date" | "ambiguous" | "unsupported_assumption" | "other";
  message: string;
}

export interface Draft {
  summary: string;
  clinicianFollowUpDate: string | null;
  items: DraftItem[];
  flags: DraftFlag[];
  source: "ai" | "manual";
  model: string;
  generatedAt: string | null;
}

export type PlanStatus = "awaiting_generation" | "draft_ready" | "approved";

export interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  actor: string | null;
  at: string;
}

export type ContactOutcome = "reached" | "no_answer" | "left_message" | "unreachable";
export type ContactMethod = "phone" | "sms" | "email" | "in_person";

export interface ContactAttempt {
  id: string;
  planId?: string | null;
  method: ContactMethod;
  outcome: ContactOutcome;
  note: string;
  by: string | null;
  at: string;
}

export interface PlanDetail {
  id: string;
  status: PlanStatus;
  originalInstructions: string;
  draft: Draft | null;
  approvedVersions: { version: number; approvedAt: string; approvedBy: string | null }[];
  notes: { id: string; text: string; by: string | null; at: string }[];
  createdBy: string | null;
  createdAt: string;
  patient: {
    id: string;
    mrn: string;
    fullName: string;
    dateOfBirth: string | null;
    phone: string;
    email: string;
  } | null;
  tasks: Task[];
  progress: { completed: number; total: number; closed: number };
  contactAttempts: ContactAttempt[];
  activity: ActivityEntry[];
}

export interface PatientSummary {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string | null;
  phone: string;
  email: string;
  latestPlan: { id: string; status: PlanStatus } | null;
  progress: { completed: number; total: number };
  counts: {
    overdue: number;
    dueToday: number;
    needsReview: number;
    upcoming: number;
    completed: number;
    closed: number;
    total: number;
  };
  lastContact: { outcome: ContactOutcome; at: string } | null;
  attentionReasons: string[];
}

export interface PatientDetail extends PatientSummary {
  plans: { id: string; status: PlanStatus; createdAt: string }[];
  contactAttempts: ContactAttempt[];
}

export interface DashboardData {
  today: string;
  counts: {
    dueToday: number;
    overdue: number;
    needsReview: number;
    completed: number;
    upcoming: number;
    plansAwaitingApproval: number;
  };
  todayTasks: Task[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  patientsRequiringAttention: PatientSummary[];
}

export interface CalendarData {
  month: string;
  today: string;
  tasks: Task[];
  needsScheduling: Task[];
  counts: Record<TaskStatus, number>;
}
