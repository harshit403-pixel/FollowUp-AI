"use client";

import { useCallback, useState } from "react";
import { updateTask } from "@/services/taskService";
import type { Task, TaskPatch } from "@/types";

/**
 * Persists task changes through the API, then calls onChanged so the owning
 * page reloads from the database. Nothing is updated optimistically.
 */
export function useTaskActions(onChanged: () => void) {
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  /** Resolves true when the change was saved. */
  const patch = useCallback(
    async (id: string, body: TaskPatch): Promise<boolean> => {
      setPending((s) => new Set(s).add(id));
      setError(null);
      try {
        await updateTask(id, body);
        onChanged();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save the change");
        return false;
      } finally {
        setPending((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [onChanged],
  );

  const toggle = useCallback(
    (task: Task) => {
      void patch(task.id, { completed: !task.completedAt });
    },
    [patch],
  );

  const clearError = useCallback(() => setError(null), []);

  return { pending, error, clearError, patch, toggle };
}
