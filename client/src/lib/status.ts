import type { ContactOutcome, PlanStatus, TaskStatus } from "@/types";

// Each status is shown with a text label as well as colour, so colour is never the only signal.
export const STATUS_STYLES: Record<TaskStatus, { badge: string; chip: string; dot: string }> = {
  Completed: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800 line-through decoration-emerald-400",
    dot: "bg-emerald-500",
  },
  Upcoming: {
    badge: "bg-sky-50 text-sky-800 ring-sky-200",
    chip: "border-sky-200 bg-sky-50 text-sky-900",
    dot: "bg-sky-500",
  },
  "Due Today": {
    badge: "bg-amber-50 text-amber-900 ring-amber-300",
    chip: "border-amber-300 bg-amber-100 text-amber-900",
    dot: "bg-amber-500",
  },
  Overdue: {
    badge: "bg-red-50 text-red-800 ring-red-200",
    chip: "border-red-300 bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
  "Needs Review": {
    badge: "bg-violet-50 text-violet-800 ring-violet-200",
    chip: "border-violet-200 bg-violet-50 text-violet-900",
    dot: "bg-violet-500",
  },
  Closed: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    chip: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  awaiting_generation: "Awaiting draft",
  draft_ready: "Draft awaiting approval",
  approved: "Approved",
};

// Keys must match the server's contact outcomes. Order drives the dropdown.
export const OUTCOME_LABELS: Record<ContactOutcome, string> = {
  reached: "Reached",
  no_answer: "No answer",
  left_message: "Left message",
  unreachable: "Unreachable",
};

// Keys must match `action` values written by the server's ActivityLog.
export const ACTION_LABELS: Record<string, string> = {
  plan_created: "Instructions recorded",
  draft_generated: "AI draft generated",
  draft_edited: "Draft edited",
  plan_approved: "Plan approved",
  task_completed: "Task completed",
  task_reopened: "Task reopened",
  task_closed: "Task closed",
  date_confirmed: "Date confirmed",
  task_note_updated: "Task note updated",
  note_added: "Staff note added",
  contact_attempt: "Contact attempt logged",
};
