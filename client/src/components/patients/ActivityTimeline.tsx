import { Card, CardHeader } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/dates";
import { ACTION_LABELS } from "@/lib/status";
import type { ActivityEntry } from "@/types";

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader title="Activity timeline" subtitle="Important changes, newest first" />
      {entries.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-500">No activity yet.</p>
      ) : (
        <ol className="space-y-4 px-5 py-4">
          {entries.map((e) => (
            <li key={e.id} className="relative border-l-2 border-ink-200 pl-4">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-teal-600" aria-hidden />
              <p className="text-sm font-medium text-ink-900">{ACTION_LABELS[e.action] ?? e.action}</p>
              {e.detail && <p className="text-sm text-ink-600">{e.detail}</p>}
              <p className="text-xs text-ink-500">
                {formatDateTime(e.at)}
                {e.actor ? ` · ${e.actor}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
