import { TaskList } from "@/components/follow-ups/TaskList";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { formatLongDate } from "@/lib/dates";
import type { Task } from "@/types";

export function AgendaView({
  tasks,
  today,
  onChanged,
}: {
  tasks: Task[];
  today: string;
  onChanged: () => void;
}) {
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.scheduledDate) continue;
    groups.set(t.scheduledDate, [...(groups.get(t.scheduledDate) ?? []), t]);
  }
  const dates = [...groups.keys()].sort();

  if (dates.length === 0) {
    return (
      <Card>
        <EmptyState title="No scheduled tasks this month" />
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {dates.map((date) => (
        <Card key={date}>
          <h3 className="border-b border-ink-100 px-4 py-2.5 text-sm font-semibold text-ink-800">
            {formatLongDate(date)}
            {date === today && (
              <span className="ml-2 rounded-full bg-teal-700 px-2 py-0.5 text-xs font-medium text-white">Today</span>
            )}
          </h3>
          <TaskList tasks={groups.get(date) ?? []} showPatient onChanged={onChanged} />
        </Card>
      ))}
    </div>
  );
}
