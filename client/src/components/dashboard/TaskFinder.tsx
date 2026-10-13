"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { TaskList } from "@/components/follow-ups/TaskList";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { listTasks } from "@/services/taskService";
import { TASK_STATUSES, type TaskStatus } from "@/types";

export function TaskFinder({
  status,
  onStatusChange,
  refreshKey,
  onChanged,
}: {
  status: TaskStatus | null;
  onStatusChange: (s: TaskStatus | null) => void;
  refreshKey: number;
  onChanged: () => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading, reload } = useAsync(
    () => listTasks({ status: status ?? undefined, q: debounced || undefined }),
    [status, debounced, refreshKey],
  );

  return (
    <Card id="task-finder">
      <CardHeader title="Find tasks" subtitle="Search by patient, MRN or task, and filter by status." />
      <div className="space-y-3 border-b border-ink-100 px-5 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patients or tasks"
            aria-label="Search patients or tasks"
            className="w-full rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm placeholder:text-ink-400"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {[null, ...TASK_STATUSES].map((s) => (
            <button
              key={s ?? "all"}
              type="button"
              aria-pressed={status === s}
              onClick={() => onStatusChange(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                status === s
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
              )}
            >
              {s ?? "All"}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="p-4">
          <ErrorBanner message={error} onRetry={reload} />
        </div>
      )}
      {loading && !data ? (
        <SkeletonRows rows={3} />
      ) : data && data.length === 0 ? (
        <EmptyState title="No tasks match" hint="Try a different search or status." />
      ) : (
        data && (
          <TaskList
            tasks={data.slice(0, 50)}
            showPatient
            onChanged={onChanged}
          />
        )
      )}
      {data && data.length > 50 && (
        <p className="border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
          Showing 50 of {data.length}. Narrow the search to see the rest.
        </p>
      )}
    </Card>
  );
}
