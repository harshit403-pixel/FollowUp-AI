"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AgendaView } from "@/components/calendar/AgendaView";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { TaskList } from "@/components/follow-ups/TaskList";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { formatLongDate, formatMonth, monthOf, shiftMonth } from "@/lib/dates";
import { STATUS_STYLES } from "@/lib/status";
import { getCalendar } from "@/services/taskService";
import { TASK_STATUSES } from "@/types";

function browserToday(): string {
  return new Intl.DateTimeFormat("en-CA").format(new Date()); // YYYY-MM-DD in the browser's timezone
}

export default function CalendarPage() {
  const [month, setMonth] = useState(() => monthOf(browserToday()));
  const [view, setView] = useState<"month" | "agenda">("month");
  const [picked, setPicked] = useState<string | null>(null);

  const { data: raw, error, loading, reload } = useAsync(() => getCalendar(month), [month]);
  // Ignore stale data from a previously viewed month while the new month loads.
  const data = raw && raw.month === month ? raw : null;

  // Default the day panel to today when viewing the current month.
  const selected = picked && monthOf(picked) === month ? picked : data && monthOf(data.today) === month ? data.today : null;
  const dayTasks = data && selected ? data.tasks.filter((t) => t.scheduledDate === selected) : [];

  const goto = (m: string) => {
    setMonth(m);
    setPicked(null);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Calendar" subtitle="Approved follow-up tasks on their confirmed dates" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" aria-label="Previous month" onClick={() => goto(shiftMonth(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-lg font-semibold text-ink-950" aria-live="polite">
            {formatMonth(month)}
          </h2>
          <Button variant="secondary" size="sm" aria-label="Next month" onClick={() => goto(shiftMonth(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => goto(monthOf(data?.today ?? browserToday()))}>
            Today
          </Button>
        </div>
        <div role="group" aria-label="Calendar view" className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5">
          {(["month", "agenda"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                view === v ? "bg-teal-700 text-white" : "text-ink-600 hover:bg-ink-50",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Status legend">
        {TASK_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span className={cn("h-2 w-2 rounded-full", STATUS_STYLES[s].dot)} aria-hidden />
            {s}
            {data && <span className="font-semibold tabular-nums text-ink-800">{data.counts[s]}</span>}
          </span>
        ))}
        <span className="text-xs text-ink-400">(counts for this month)</span>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={reload} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {loading && !data ? (
            <Skeleton className="h-[560px] w-full" />
          ) : data && view === "month" ? (
            <MonthGrid month={month} today={data.today} tasks={data.tasks} selectedDate={selected} onSelect={setPicked} />
          ) : (
            data && <AgendaView tasks={data.tasks} today={data.today} onChanged={reload} />
          )}
        </div>

        <aside className="space-y-6">
          {view === "month" && (
            <Card>
              <CardHeader title={selected ? formatLongDate(selected) : "Select a date"} subtitle="Tasks on this day" />
              {!selected ? (
                <EmptyState title="Pick a day on the calendar" />
              ) : dayTasks.length === 0 ? (
                <EmptyState title="No tasks on this day" />
              ) : (
                <TaskList tasks={dayTasks} showPatient onChanged={reload} />
              )}
            </Card>
          )}

          <Card>
            <CardHeader
              title="Needs scheduling"
              subtitle="No confirmed date. Not placed on the calendar until a date is confirmed."
            />
            {loading && !data ? (
              <SkeletonRows rows={2} />
            ) : data && data.needsScheduling.length === 0 ? (
              <EmptyState title="Everything has a confirmed date" />
            ) : (
              data && <TaskList tasks={data.needsScheduling} showPatient onChanged={reload} />
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
