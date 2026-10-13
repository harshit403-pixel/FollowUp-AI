"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CreatePlanDialog } from "@/components/follow-ups/CreatePlanDialog";
import { NotesPanel } from "@/components/follow-ups/NotesPanel";
import { PlanPanel } from "@/components/follow-ups/PlanPanel";
import { TaskList } from "@/components/follow-ups/TaskList";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityTimeline } from "@/components/patients/ActivityTimeline";
import { ContactPanel } from "@/components/patients/ContactPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { Select } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { formatDate, formatDateTime } from "@/lib/dates";
import { PLAN_STATUS_LABELS } from "@/lib/status";
import { getPatient } from "@/services/patientService";
import { getPlan } from "@/services/planService";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patient = useAsync(() => getPatient(id), [id]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Default to the newest plan once the patient loads.
  const latestPlanId = patient.data?.plans[0]?.id ?? null;
  useEffect(() => {
    setPlanId((current) => (current && patient.data?.plans.some((p) => p.id === current) ? current : latestPlanId));
  }, [latestPlanId, patient.data]);

  const plan = useAsync(() => (planId ? getPlan(planId) : Promise.resolve(null)), [planId]);
  const planData = plan.data && plan.data.id === planId ? plan.data : null;

  const refresh = useCallback(() => {
    patient.reload();
    plan.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.reload, plan.reload]);

  if (patient.loading && !patient.data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (patient.error || !patient.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorBanner message={patient.error ?? "Patient not found"} onRetry={patient.reload} />
      </div>
    );
  }

  const p = patient.data;
  const scheduled = planData?.tasks.filter((t) => t.scheduledDate) ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All patients
      </Link>
      <PageHeader
        title={p.fullName}
        subtitle={`${p.mrn}${p.dateOfBirth ? ` · DOB ${formatDate(p.dateOfBirth)}` : ""}${p.phone ? ` · ${p.phone}` : ""} · synthetic demo patient`}
        actions={
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New plan
          </Button>
        }
      />

      {p.plans.length > 1 && (
        <div className="mb-4 max-w-sm">
          <label htmlFor="plan-select" className="mb-1 block text-sm font-medium text-ink-800">
            Follow-up plan
          </label>
          <Select id="plan-select" value={planId ?? ""} onChange={(e) => setPlanId(e.target.value)}>
            {p.plans.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {formatDateTime(pl.createdAt)} · {PLAN_STATUS_LABELS[pl.status]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {p.plans.length === 0 ? (
        <Card>
          <EmptyState
            title="No follow-up plan yet"
            hint="Enter the clinician’s instructions to start a plan."
            action={<Button onClick={() => setCreating(true)}>Add clinician instructions</Button>}
          />
        </Card>
      ) : plan.error ? (
        <ErrorBanner message={plan.error} onRetry={plan.reload} />
      ) : !planData ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {planData.status === "approved" && (
              <Card>
                <CardHeader title="Checklist" subtitle="Changes are saved immediately" />
                <div className="border-b border-ink-100 px-5 py-4">
                  <ProgressBar completed={planData.progress.completed} total={planData.progress.total} />
                  {(planData.progress.closed ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-ink-500">{planData.progress.closed} closed task(s) not counted.</p>
                  )}
                </div>
                <TaskList tasks={planData.tasks} detailed onChanged={refresh} />
              </Card>
            )}

            <PlanPanel plan={planData} onChanged={refresh} />

            {planData.status === "approved" && (
              <Card>
                <CardHeader
                  title="Calendar events"
                  subtitle="Tasks with confirmed dates"
                  action={
                    <Link href="/calendar" className="text-sm font-medium text-teal-800 hover:underline">
                      Open calendar
                    </Link>
                  }
                />
                {scheduled.length === 0 ? (
                  <EmptyState title="No confirmed dates yet" hint="Tasks without dates are listed under Needs scheduling on the calendar page." />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {scheduled.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900">{t.title}</p>
                          <p className="text-xs text-ink-500">{formatDate(t.scheduledDate)}</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <ContactPanel patientId={p.id} planId={planData.id} attempts={p.contactAttempts} onChanged={refresh} />
            <NotesPanel plan={planData} onChanged={refresh} />
            <ActivityTimeline entries={planData.activity} />
          </div>
        </div>
      )}

      <CreatePlanDialog
        open={creating}
        patientId={p.id}
        onClose={() => setCreating(false)}
        onCreated={(newId) => {
          setCreating(false);
          setPlanId(newId);
          patient.reload();
        }}
      />
    </div>
  );
}
