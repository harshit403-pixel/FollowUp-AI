"use client";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import type { Draft, DraftItem } from "@/types";

type Editable = Pick<Draft, "summary" | "clinicianFollowUpDate" | "items" | "flags">;

const EMPTY_ITEM: DraftItem = {
  title: "",
  description: "",
  sourceInstruction: "",
  suggestedDate: null,
  needsReview: false,
  reviewNote: "",
};

const FLAG_LABEL: Record<string, string> = {
  missing_date: "Missing date",
  ambiguous: "Ambiguous",
  unsupported_assumption: "Unsupported assumption",
  other: "Review",
};

export function DraftEditor({
  initial,
  saving,
  onSave,
  onDirtyChange,
}: {
  initial: Editable | null;
  saving: boolean;
  onSave: (draft: Editable) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const start: Editable = initial ?? {
    summary: "",
    clinicianFollowUpDate: null,
    items: [{ ...EMPTY_ITEM }],
    flags: [],
  };
  const [draft, setDraft] = useState<Editable>(start);
  const [problem, setProblem] = useState<string | null>(null);

  const baseline = useMemo(() => JSON.stringify(start), [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !initial || JSON.stringify(draft) !== baseline;
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const setItem = (i: number, patch: Partial<DraftItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));

  function save() {
    if (!draft.summary.trim()) return setProblem("Add a short summary of the instructions.");
    if (draft.items.length === 0) return setProblem("Add at least one task.");
    for (const [i, it] of draft.items.entries()) {
      if (!it.title.trim()) return setProblem(`Task ${i + 1} needs a title.`);
      if (!it.sourceInstruction.trim()) {
        return setProblem(`Task ${i + 1} needs the source instruction it came from.`);
      }
    }
    setProblem(null);
    onSave(draft);
  }

  return (
    <div className="space-y-5">
      {draft.flags.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Needs human review ({draft.flags.length})
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
            {draft.flags.map((f, i) => (
              <li key={i}>
                <span className="font-medium">{FLAG_LABEL[f.type] ?? "Review"}:</span> {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Summary of the original instructions">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            maxLength={2000}
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          />
        )}
      </Field>

      <Field
        label="Clinician-provided follow-up date"
        hint="Leave empty unless the clinician stated a specific date."
      >
        {(id) => (
          <Input
            id={id}
            type="date"
            className="max-w-xs"
            value={draft.clinicianFollowUpDate ?? ""}
            onChange={(e) => setDraft({ ...draft, clinicianFollowUpDate: e.target.value || null })}
          />
        )}
      </Field>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-900">Timeline of tasks</h3>
        <ol className="space-y-3">
          {draft.items.map((item, i) => (
            <li key={i} className="rounded-lg border border-ink-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-500">Task {i + 1}</span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }))}
                  className="inline-flex items-center gap-1 rounded text-xs text-rose-700 hover:underline"
                  aria-label={`Remove task ${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Title">
                  {(id) => <Input id={id} maxLength={200} value={item.title} onChange={(e) => setItem(i, { title: e.target.value })} />}
                </Field>
                <Field label="Description">
                  {(id) => (
                    <Textarea id={id} rows={2} maxLength={2000} value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                  )}
                </Field>
                <Field label="Source instruction" hint="The part of the clinician’s instructions this task comes from.">
                  {(id) => (
                    <Textarea id={id} rows={2} maxLength={2000} value={item.sourceInstruction} onChange={(e) => setItem(i, { sourceInstruction: e.target.value })} />
                  )}
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Date">
                    {(id) => (
                      <Input
                        id={id}
                        type="date"
                        value={item.suggestedDate ?? ""}
                        onChange={(e) => setItem(i, { suggestedDate: e.target.value || null })}
                      />
                    )}
                  </Field>
                  <div className="flex items-end pb-2">
                    {!item.suggestedDate ? (
                      <p className="text-sm font-medium text-violet-700">Date requires clinician confirmation</p>
                    ) : (
                      <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input
                          type="checkbox"
                          checked={item.needsReview}
                          onChange={(e) => setItem(i, { needsReview: e.target.checked })}
                          className="h-4 w-4 accent-teal-700"
                        />
                        Mark as needs review
                      </label>
                    )}
                  </div>
                </div>
                {item.reviewNote && <p className="text-xs text-violet-800">Review note: {item.reviewNote}</p>}
              </div>
            </li>
          ))}
        </ol>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => setDraft((d) => ({ ...d, items: [...d.items, { ...EMPTY_ITEM }] }))}
        >
          <Plus className="h-4 w-4" aria-hidden /> Add task
        </Button>
      </div>

      {problem && (
        <p role="alert" className="text-sm text-rose-700">
          {problem}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={saving} disabled={!dirty}>
          Save draft
        </Button>
        {!dirty && initial && <span className="text-sm text-ink-500">All changes saved</span>}
      </div>
    </div>
  );
}
