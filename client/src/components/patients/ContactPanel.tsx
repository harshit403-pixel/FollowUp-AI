"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/dates";
import { OUTCOME_LABELS } from "@/lib/status";
import { addContactAttempt } from "@/services/patientService";
import type { ContactAttempt } from "@/types";

export function ContactPanel({
  patientId,
  planId,
  attempts,
  onChanged,
}: {
  patientId: string;
  planId?: string;
  attempts: ContactAttempt[];
  onChanged: () => void;
}) {
  const [method, setMethod] = useState<ContactAttempt["method"]>("phone");
  const [outcome, setOutcome] = useState<ContactAttempt["outcome"]>("reached");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await addContactAttempt(patientId, { planId, method, outcome, note });
      setNote("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log the attempt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Contact attempts"
        subtitle="Log of staff outreach. The app never contacts patients."
      />
      <form onSubmit={submit} className="space-y-3 border-b border-ink-100 px-5 py-4">
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Method">
            {(id) => (
              <Select id={id} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_person">In person</option>
              </Select>
            )}
          </Field>
          <Field label="Outcome">
            {(id) => (
              <Select id={id} value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}>
                {Object.entries(OUTCOME_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Note (optional)">
          {(id) => <Input id={id} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <Button type="submit" size="sm" loading={busy}>
          Log attempt
        </Button>
      </form>
      {attempts.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-500">No contact attempts logged yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {attempts.map((a) => (
            <li key={a.id} className="px-5 py-3 text-sm">
              <p className="font-medium text-ink-900">
                {OUTCOME_LABELS[a.outcome]} <span className="font-normal text-ink-500">· {a.method.replace("_", " ")}</span>
              </p>
              {a.note && <p className="text-ink-600">{a.note}</p>}
              <p className="text-xs text-ink-500">
                {formatDateTime(a.at)}
                {a.by ? ` · ${a.by}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
