"use client";

import { useState } from "react";
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
      setForm({ mrn: "", fullName: "", dateOfBirth: "", phone: "", email: "" });
      onCreated(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the patient");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="New patient (synthetic data only)"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-patient-form" loading={busy}>
            Create patient
          </Button>
        </>
      }
    >
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
    </Modal>
  );
}
