"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { PLAN_STATUS_LABELS } from "@/lib/status";
import { listPatients } from "@/services/patientService";

export default function PatientsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading, reload } = useAsync(() => listPatients(debounced || undefined), [debounced]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Patients"
        subtitle="Follow-up queue (synthetic demo patients)"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New patient
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or identifier"
          aria-label="Search patients"
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-ink-400"
        />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={reload} />
        </div>
      )}

      <Card>
        {loading && !data ? (
          <SkeletonRows rows={5} />
        ) : data && data.length === 0 ? (
          <EmptyState
            title={debounced ? "No patients match your search" : "No patients yet"}
            hint={debounced ? undefined : "Create a patient to start a follow-up plan."}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data?.map((p) => (
              <li key={p.id}>
                <Link href={`/patients/${p.id}`} className="block px-5 py-4 hover:bg-ink-50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink-900">{p.fullName}</p>
                      <p className="text-xs text-ink-500">{p.mrn}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.latestPlan ? (
                        <Badge tone={p.latestPlan.status === "approved" ? "teal" : "violet"}>
                          {PLAN_STATUS_LABELS[p.latestPlan.status]}
                        </Badge>
                      ) : (
                        <Badge>No plan</Badge>
                      )}
                      {p.counts.overdue > 0 && <Badge tone="rose">{p.counts.overdue} overdue</Badge>}
                      {p.counts.dueToday > 0 && <Badge tone="amber">{p.counts.dueToday} due today</Badge>}
                    </div>
                  </div>
                  {p.progress.total > 0 && (
                    <ProgressBar className="mt-3 max-w-sm" completed={p.progress.completed} total={p.progress.total} />
                  )}
                  {p.attentionReasons.length > 0 && (
                    <p className="mt-2 text-xs text-ink-600">{p.attentionReasons.join(" · ")}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <NewPatientDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => router.push(`/patients/${id}`)}
      />
    </div>
  );
}
