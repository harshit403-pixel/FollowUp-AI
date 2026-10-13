import Link from "next/link";
import { EmptyState } from "@/components/ui/Feedback";
import type { PatientSummary } from "@/types";

export function AttentionList({ patients }: { patients: PatientSummary[] }) {
  if (patients.length === 0) {
    return <EmptyState title="Nobody needs attention" hint="Overdue, unscheduled and unreachable patients show up here." />;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {patients.map((p) => (
        <li key={p.id}>
          <Link href={`/patients/${p.id}`} className="block px-5 py-3 hover:bg-ink-50">
            <p className="text-sm font-medium text-ink-900">
              {p.fullName} <span className="font-normal text-ink-500">· {p.mrn}</span>
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-ink-600">
              {p.attentionReasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </Link>
        </li>
      ))}
    </ul>
  );
}
