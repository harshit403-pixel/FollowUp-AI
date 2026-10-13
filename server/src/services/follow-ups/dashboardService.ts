import { env } from "../../config/env";
import { FollowUpPlan } from "../../models/FollowUpPlan";
import { FollowUpTask } from "../../models/FollowUpTask";
import { Patient } from "../../models/Patient";
import { findTasks, statusFilter, toTaskDTO } from "../../repositories/taskRepository";
import { todayInTz } from "../../utils/dates";
import { buildSummaries } from "../patientService";

export async function getDashboard() {
  const today = todayInTz(env.APP_TIMEZONE);

  const [dueToday, overdue, needsReview, completed, upcoming, awaitingApproval] = await Promise.all([
    FollowUpTask.countDocuments(statusFilter("Due Today", today)),
    FollowUpTask.countDocuments(statusFilter("Overdue", today)),
    FollowUpTask.countDocuments(statusFilter("Needs Review", today)),
    FollowUpTask.countDocuments(statusFilter("Completed", today)),
    FollowUpTask.countDocuments(statusFilter("Upcoming", today)),
    FollowUpPlan.countDocuments({ status: { $in: ["awaiting_generation", "draft_ready"] } }),
  ]);

  const [todayTasks, overdueTasks, upcomingTasks, patients] = await Promise.all([
    // Today's checklist includes already-completed items so ticks stay visible.
    findTasks({ scheduledDate: today, closedAt: null }),
    findTasks(statusFilter("Overdue", today), 10),
    findTasks(statusFilter("Upcoming", today), 10),
    Patient.find().limit(500).lean(),
  ]);

  const summaries = await buildSummaries(
    patients.map((p) => ({ ...p, createdAt: p.createdAt })),
    today,
  );
  const needsAttention = summaries
    .filter((s) => s.attentionReasons.length > 0)
    .sort((a, b) => b.counts.overdue - a.counts.overdue || b.attentionReasons.length - a.attentionReasons.length)
    .slice(0, 10);

  return {
    today,
    counts: { dueToday, overdue, needsReview, completed, upcoming, plansAwaitingApproval: awaitingApproval },
    todayTasks: todayTasks.map((t) => toTaskDTO(t, today)),
    overdueTasks: overdueTasks.map((t) => toTaskDTO(t, today)),
    upcomingTasks: upcomingTasks.map((t) => toTaskDTO(t, today)),
    patientsRequiringAttention: needsAttention,
  };
}
