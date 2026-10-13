"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { useTaskActions } from "@/hooks/useTaskActions";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { Task } from "@/types";

type Actions = ReturnType<typeof useTaskActions>;

export function TaskDetailDialog({
  task,
  actions,
  onClose,
}: {
  task: Task | null;
  actions: Actions;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState("");

  // Reset local form state when a different task is opened.
  const taskId = task?.id;
  useEffect(() => {
    setNote(task?.staffNote ?? "");
    setDate(task?.scheduledDate ?? "");
    setClosing(false);
    setReason("");
    actions.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!task) return null;
  const busy = actions.pending.has(task.id);
  const open = task.status !== "Completed" && task.status !== "Closed";

  return (
    <Modal open title="Task details" onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-ink-950">{task.title}</h3>
            {task.patientName && (
              <Link href={`/patients/${task.patientId}`} className="text-teal-800 hover:underline">
                {task.patientName} · {task.patientMrn}
              </Link>
            )}
          </div>
          <StatusBadge status={task.status} />
        </div>

        {actions.error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">
            {actions.error}
          </p>
        )}

        {task.description && <p className="text-ink-700">{task.description}</p>}

        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Scheduled date</dt>
            <dd className="mt-0.5">
              {task.scheduledDate ? formatDate(task.scheduledDate) : "Date requires clinician confirmation"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Completed</dt>
            <dd className="mt-0.5">
              {task.completedAt
                ? `${formatDateTime(task.completedAt)}${task.completedBy ? ` by ${task.completedBy}` : ""}`
                : "Not completed"}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Original instruction</p>
          <blockquote className="mt-1 rounded-lg border-l-4 border-teal-600 bg-ink-50 px-3 py-2 text-ink-700">
            {task.sourceInstruction}
          </blockquote>
        </div>

        {task.reviewNote && (
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-violet-900">Review note: {task.reviewNote}</p>
        )}
        {task.status === "Closed" && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
            Closed {formatDateTime(task.closedAt)}. Reason: {task.closeReason}
          </p>
        )}

        {open && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-ink-200 p-3">
            <Field label={task.scheduledDate ? "Reschedule to" : "Confirm a date"} hint="Only enter a date the clinician has confirmed.">
              {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
            </Field>
            <Button
              variant="secondary"
              disabled={!date || date === task.scheduledDate}
              loading={busy}
              onClick={() => actions.patch(task.id, { scheduledDate: date })}
            >
              Save date
            </Button>
          </div>
        )}

        <Field label="Staff note">
          {(id) => (
            <Textarea id={id} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>

        {closing && (
          <Field label="Reason for closing" hint="Closing removes the task from overdue lists. This is recorded in the activity log.">
            {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
        )}
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-ink-100 pt-4">
        <div className="flex gap-2">
          {task.status !== "Closed" && (
            <Button
              variant={task.status === "Completed" ? "secondary" : "primary"}
              loading={busy}
              onClick={() => actions.toggle(task)}
            >
              {task.status === "Completed" ? "Reopen task" : "Mark complete"}
            </Button>
          )}
          {open && user?.role === "coordinator" &&
            (closing ? (
              <Button
                variant="danger"
                loading={busy}
                disabled={reason.trim().length < 3}
                onClick={async () => {
                  const r = await actions.patch(task.id, { close: true, closeReason: reason.trim() });
                  if (r) onClose();
                }}
              >
                Confirm close
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setClosing(true)}>
                Close task…
              </Button>
            ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
          <Button
            loading={busy}
            disabled={note === task.staffNote}
            onClick={() => actions.patch(task.id, { staffNote: note })}
          >
            Save note
          </Button>
        </div>
      </div>
    </Modal>
  );
}
