"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { createPatient } from "@/services/patientService";

export function NewPatientDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [form, setForm] = useState({ mrn: "", fullName: "", dateOfBirth: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; portalUrl: string } | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createPatient({
        mrn: form.mrn,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth || null,
        phone: form.phone,
        email: form.email,
      });
      setCreated({ id: res.id, portalUrl: `${window.location.origin}/portal/${res.portalToken}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the patient");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={created ? "Patient created" : "New patient (synthetic data only)"}
      onClose={onClose}
      footer={
        <>
          {created ? (
            <>
              <Button variant="secondary" onClick={() => { const url = created.portalUrl; void navigator.clipboard?.writeText(url); }}> <Copy className="h-4 w-4" /> Copy portal link </Button>
              <Button onClick={() => { const id = created.id; setCreated(null); onCreated(id); }}>Open hospital record</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" form="new-patient-form" loading={busy}>Create patient</Button>
            </>
          )}
        </>
      }
    >
      {created ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"><Check className="h-4 w-4" /> A private, read-only patient portal link was generated.</div>
          <p className="text-sm text-ink-600">Share this link directly with the synthetic demo patient. Anyone with the link can view the approved plan, so treat it like a password.</p>
          <div className="break-all rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm">{created.portalUrl}</div>
          <a className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 hover:underline" href={created.portalUrl} target="_blank" rel="noreferrer">Preview patient portal <ExternalLink className="h-4 w-4" /></a>
        </div>
      ) : (
      <form id="new-patient-form" onSubmit={submit} className="space-y-3">
        {error && <ErrorBanner message={error} />}
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Use made-up identifiers and contact details. Do not enter real patient information.
        </p>
        <Field label="Synthetic identifier (MRN)">
          {(id) => <Input id={id} required value={form.mrn} onChange={set("mrn")} placeholder="FU-2001" />}
        </Field>
        <Field label="Name">
          {(id) => <Input id={id} required value={form.fullName} onChange={set("fullName")} placeholder="Demo Patient" />}
        </Field>
        <Field label="Date of birth (optional)">
          {(id) => <Input id={id} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />}
        </Field>
        <Field label="Phone (optional)">
          {(id) => <Input id={id} value={form.phone} onChange={set("phone")} />}
        </Field>
        <Field label="Email (optional)">
          {(id) => <Input id={id} type="email" value={form.email} onChange={set("email")} />}
        </Field>
      </form>
      )}
    </Modal>
  );
}
