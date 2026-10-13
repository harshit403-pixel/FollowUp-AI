"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Textarea } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/dates";
import { addNote } from "@/services/planService";
import type { PlanDetail } from "@/types";

export function NotesPanel({ plan, onChanged }: { plan: PlanDetail; onChanged: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addNote(plan.id, text.trim());
      setText("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Staff notes" />
      <form onSubmit={submit} className="space-y-2 border-b border-ink-100 px-5 py-4">
        {error && <ErrorBanner message={error} />}
        <Textarea
          aria-label="New staff note"
          placeholder="Add a note for the care team"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>
          Add note
        </Button>
      </form>
      {plan.notes.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-500">No notes yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {[...plan.notes].reverse().map((n) => (
            <li key={n.id} className="px-5 py-3 text-sm">
              <p className="whitespace-pre-wrap text-ink-800">{n.text}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {formatDateTime(n.at)}
                {n.by ? ` · ${n.by}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
