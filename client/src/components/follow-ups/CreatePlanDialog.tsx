"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { createPlan, generateDraft } from "@/services/planService";

export function CreatePlanDialog({
  open,
  patientId,
  onClose,
  onCreated,
}: {
  open: boolean;
  patientId: string;
  onClose: () => void;
  onCreated: (planId: string) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createPlan(patientId, text);
      setText("");
      try {
        await generateDraft(res.id);
      } catch {
        // The original instructions are safely saved. The plan page offers a retry action if Gemini is unavailable.
      }
      onCreated(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="New follow-up plan"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-plan-form" loading={busy} disabled={text.trim().length < 10}>
            Save instructions and generate draft
          </Button>
        </>
      }
    >
      <form id="create-plan-form" onSubmit={submit} className="space-y-3">
        {error && <ErrorBanner message={error} />}
        <Field
          label="Clinician instructions"
          hint="Paste the instructions exactly as the clinician provided them. They are stored unchanged. AI will prepare a draft for staff review; nothing becomes active until a coordinator approves it."
        >
          {(id) => (
            <Textarea id={id} required rows={8} maxLength={10000} value={text} onChange={(e) => setText(e.target.value)} />
          )}
        </Field>
      </form>
    </Modal>
  );
}
