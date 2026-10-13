"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskFinder } from "@/components/dashboard/TaskFinder";
import { TaskList } from "@/components/follow-ups/TaskList";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { formatLongDate } from "@/lib/dates";
import { getDashboard } from "@/services/taskService";
import type { TaskStatus } from "@/types";

export default function DashboardPage() {
  const { data, error, loading, reload } = useAsync(getDashboard, []);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    reload();
    setRefreshKey((k) => k + 1);
  }, [reload]);

  const pick = (s: TaskStatus) => {
    setStatus(s);
    document.getElementById("task-finder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        subtitle={data ? formatLongDate(data.today) : "Follow-up overview"}
        actions={
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            Open calendar
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={reload} />
        </div>
      )}

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {loading && !data
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)
          : data && (
              <>
                <StatCard label="Due today" value={data.counts.dueToday} accent="text-amber-600" onSelect={() => pick("Due Today")} />
                <StatCard label="Overdue" value={data.counts.overdue} accent="text-rose-600" onSelect={() => pick("Overdue")} />
                <StatCard label="Needs review" value={data.counts.needsReview} accent="text-violet-600" onSelect={() => pick("Needs Review")} />
                <StatCard label="Upcoming" value={data.counts.upcoming} accent="text-sky-600" onSelect={() => pick("Upcoming")} />
                <StatCard label="Completed" value={data.counts.completed} accent="text-emerald-600" onSelect={() => pick("Completed")} />
                <StatCard label="Plans awaiting approval" value={data.counts.plansAwaitingApproval} accent="text-ink-800" />
              </>
            )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Today’s checklist" subtitle="Tasks scheduled for today" />
          {loading && !data ? (
            <SkeletonRows rows={3} />
          ) : data && data.todayTasks.length === 0 ? (
            <EmptyState title="Nothing scheduled for today" />
          ) : (
            data && <TaskList tasks={data.todayTasks} showPatient onChanged={refresh} />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Patients requiring attention" subtitle="Overdue, unscheduled or not yet reached" />
          {loading && !data ? <SkeletonRows rows={3} /> : data && <AttentionList patients={data.patientsRequiringAttention} />}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Overdue" subtitle="Stays here until completed or closed by a coordinator" />
          {loading && !data ? (
            <SkeletonRows rows={2} />
          ) : data && data.overdueTasks.length === 0 ? (
            <EmptyState title="No overdue tasks" />
          ) : (
            data && <TaskList tasks={data.overdueTasks} showPatient onChanged={refresh} />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Upcoming follow-ups" subtitle="Next scheduled tasks" />
          {loading && !data ? (
            <SkeletonRows rows={2} />
          ) : data && data.upcomingTasks.length === 0 ? (
            <EmptyState title="No upcoming tasks" />
          ) : (
            data && <TaskList tasks={data.upcomingTasks} showPatient onChanged={refresh} />
          )}
        </Card>
      </div>

      <div className="mt-6">
        <TaskFinder status={status} onStatusChange={setStatus} refreshKey={refreshKey} onChanged={refresh} />
      </div>
    </div>
  );
}
