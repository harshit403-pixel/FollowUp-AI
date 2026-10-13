"use client";

import { useState } from "react";
import { ErrorBanner } from "@/components/ui/Feedback";
import { useTaskActions } from "@/hooks/useTaskActions";
import type { Task } from "@/types";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { TaskRow } from "./TaskRow";

/**
 * Interactive checklist. Checkbox changes are saved to the API and then the
 * owning page reloads via onChanged, so what you see is what is stored.
 */
export function TaskList({
  tasks,
  onChanged,
  detailed,
  showPatient,
}: {
  tasks: Task[];
  onChanged: () => void;
  detailed?: boolean;
  showPatient?: boolean;
}) {
  const actions = useTaskActions(onChanged);
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = tasks.find((t) => t.id === openId) ?? null;

  return (
    <>
      {actions.error && !selected && (
        <div className="px-4 pt-3">
          <ErrorBanner message={actions.error} onDismiss={actions.clearError} />
        </div>
      )}
      <ul className="divide-y divide-ink-100">
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            busy={actions.pending.has(t.id)}
            detailed={detailed}
            showPatient={showPatient}
            onToggle={actions.toggle}
            onOpen={(task) => setOpenId(task.id)}
          />
        ))}
      </ul>
      <TaskDetailDialog task={selected} actions={actions} onClose={() => setOpenId(null)} />
    </>
  );
}
