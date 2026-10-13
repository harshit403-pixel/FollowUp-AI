import { FileText, StickyNote } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { Task } from "@/types";

export function TaskRow({
  task,
  busy,
  detailed,
  showPatient,
  onToggle,
  onOpen,
}: {
  task: Task;
  busy: boolean;
  detailed?: boolean;
  showPatient?: boolean;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  const done = task.status === "Completed";
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={done}
        disabled={busy || task.status === "Closed"}
        onChange={() => onToggle(task)}
        aria-label={`Mark "${task.title}" ${done ? "not complete" : "complete"}`}
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-ink-300 accent-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(task)}
          className={cn(
            "rounded text-left text-sm font-medium hover:underline",
            done ? "text-ink-500 line-through" : "text-ink-900",
          )}
        >
          {task.title}
        </button>

        {detailed && task.description && <p className="mt-0.5 text-sm text-ink-600">{task.description}</p>}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          {showPatient && task.patientName && (
            <Link href={`/patients/${task.patientId}`} className="font-medium text-teal-800 hover:underline">
              {task.patientName}
            </Link>
          )}
          {task.scheduledDate ? (
            <span>{formatDate(task.scheduledDate)}</span>
          ) : (
            <span className="font-medium text-violet-700">Date requires clinician confirmation</span>
          )}
          {task.completedAt && (
            <span className="text-emerald-700">
              Completed {formatDateTime(task.completedAt)}
              {task.completedBy ? ` by ${task.completedBy}` : ""}
            </span>
          )}
        </div>

        {detailed && (
          <div className="mt-1.5 space-y-1 text-xs text-ink-500">
            <p className="flex gap-1.5">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium">Source:</span> “{task.sourceInstruction}”
              </span>
            </p>
            {task.staffNote && (
              <p className="flex gap-1.5">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{task.staffNote}</span>
              </p>
            )}
          </div>
        )}
      </div>
      <StatusBadge status={task.status} />
    </li>
  );
}
