import { env } from "../../config/env";
import { findTasks, toTaskDTO } from "../../repositories/taskRepository";
import { todayInTz } from "../../utils/dates";

export async function getCalendar(month: string) {
  const today = todayInTz(env.APP_TIMEZONE);
  // YYYY-MM-DD strings compare lexicographically, so this range is exact.
  const [monthTasks, unscheduled] = await Promise.all([
    findTasks({ scheduledDate: { $gte: `${month}-01`, $lte: `${month}-31` } }),
    // Tasks with no confirmed date are never placed on the grid.
    findTasks({ scheduledDate: null, completedAt: null, closedAt: null }),
  ]);

  const tasks = monthTasks.map((t) => toTaskDTO(t, today));
  const counts: Record<string, number> = {
    Upcoming: 0,
    "Due Today": 0,
    Overdue: 0,
    Completed: 0,
    "Needs Review": 0,
    Closed: 0,
  };
  for (const t of tasks) counts[t.status]++;

  return {
    month,
    today,
    tasks,
    needsScheduling: unscheduled.map((t) => toTaskDTO(t, today)),
    counts,
  };
}
