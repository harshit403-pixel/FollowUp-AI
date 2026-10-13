export type TaskStatus =
  | "Upcoming"
  | "Due Today"
  | "Overdue"
  | "Completed"
  | "Needs Review"
  | "Closed";

export interface StatusInput {
  scheduledDate: string | null;
  needsReview: boolean;
  completedAt: Date | null;
  closedAt: Date | null;
}

/**
 * Task status is derived, never stored, so it cannot drift from the data.
 * Only completedAt, closedAt, needsReview and scheduledDate are persisted.
 */
export function computeStatus(task: StatusInput, today: string): TaskStatus {
  if (task.completedAt) return "Completed";
  if (task.closedAt) return "Closed";
  if (task.needsReview || !task.scheduledDate) return "Needs Review";
  if (task.scheduledDate < today) return "Overdue";
  if (task.scheduledDate === today) return "Due Today";
  return "Upcoming";
}
