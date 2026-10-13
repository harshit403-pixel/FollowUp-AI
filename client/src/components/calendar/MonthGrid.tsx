import { cn } from "@/lib/cn";
import { WEEKDAYS, dayNumber, formatLongDate, monthGrid } from "@/lib/dates";
import { STATUS_STYLES } from "@/lib/status";
import type { Task } from "@/types";

const MAX_CHIPS = 3;

export function MonthGrid({
  month,
  today,
  tasks,
  selectedDate,
  onSelect,
}: {
  month: string;
  today: string;
  tasks: Task[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const byDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.scheduledDate) continue; // undated tasks never appear on the grid
    byDate.set(t.scheduledDate, [...(byDate.get(t.scheduledDate) ?? []), t]);
  }

  return (
    <div role="group" aria-label="Month calendar" className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      <div className="grid grid-cols-7 border-b border-ink-200 bg-ink-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-ink-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid(month).map(({ date, inMonth }) => {
          const items = byDate.get(date) ?? [];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${formatLongDate(date)}, ${items.length} task${items.length === 1 ? "" : "s"}`}
              onClick={() => onSelect(date)}
              className={cn(
                "flex min-h-[64px] flex-col items-stretch gap-1 border-b border-r border-ink-100 p-1.5 text-left transition-colors hover:bg-teal-50/60 sm:min-h-[104px]",
                !inMonth && "bg-ink-50/60 text-ink-400",
                isSelected && "bg-teal-50 ring-2 ring-inset ring-teal-600",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center self-start rounded-full text-xs font-medium",
                  isToday ? "bg-teal-700 text-white" : inMonth ? "text-ink-800" : "text-ink-400",
                )}
              >
                {dayNumber(date)}
              </span>

              {/* Small screens: colored dots */}
              <span className="flex flex-wrap gap-1 sm:hidden" aria-hidden>
                {items.slice(0, 4).map((t) => (
                  <span key={t.id} className={cn("h-1.5 w-1.5 rounded-full", STATUS_STYLES[t.status].dot)} />
                ))}
              </span>

              {/* Larger screens: labeled chips */}
              <span className="hidden flex-col gap-1 sm:flex">
                {items.slice(0, MAX_CHIPS).map((t) => (
                  <span
                    key={t.id}
                    className={cn("truncate rounded border px-1.5 py-0.5 text-[11px] font-medium", STATUS_STYLES[t.status].chip)}
                  >
                    {t.title}
                  </span>
                ))}
                {items.length > MAX_CHIPS && (
                  <span className="px-1 text-[11px] font-medium text-ink-500">+{items.length - MAX_CHIPS} more</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
