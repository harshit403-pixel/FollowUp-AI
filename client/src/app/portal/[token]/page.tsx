"use client";

import { CalendarDays, CheckCircle2, Circle, Clock3, HeartPulse, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/dates";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
type PortalData = { patient: { fullName: string; mrn: string }; plan: { summary: string; clinicianFollowUpDate: string | null } | null; tasks: { id: string; title: string; description: string; scheduledDate: string | null; status: string; completedAt: string | null; needsReview: boolean }[] };

export default function PatientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch(`${BASE}/patient-portal/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error || "This portal link is not available"); return body as PortalData; })
      .then((body) => { if (active) setData(body); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Could not load patient portal"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  return <main className="min-h-screen bg-ink-50 px-4 py-8 text-ink-900 sm:px-6">
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-700 text-white"><HeartPulse className="h-6 w-6" /></span><div><h1 className="text-xl font-bold">FollowUp AI</h1><p className="text-sm text-ink-500">Patient follow-up portal</p></div></header>
      {loading ? <div className="rounded-2xl border border-ink-200 bg-white p-8">Loading your follow-up plan…</div> : error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-rose-800">{error}</div> : data ? <>
        <section className="mb-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm text-ink-500">Welcome</p><h2 className="text-2xl font-semibold">{data.patient.fullName}</h2><p className="mt-1 text-sm text-ink-500">Patient ID: {data.patient.mrn}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"><ShieldCheck className="mr-1 inline h-3.5 w-3.5"/> Read only</span></div>
          {data.plan ? <><h3 className="mb-2 text-sm font-semibold">Your follow-up plan</h3><p className="text-sm leading-6 text-ink-700">{data.plan.summary}</p>{data.plan.clinicianFollowUpDate && <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900"><CalendarDays className="h-4 w-4"/> Clinician follow-up: {formatDate(data.plan.clinicianFollowUpDate)}</p>}</> : <p className="text-sm text-ink-600">Your follow-up plan will appear here after the hospital team reviews and approves it.</p>}
        </section>
        {data.plan && <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Your calendar & checklist</h3><span className="text-sm text-ink-500">{data.tasks.filter(t => t.status === "Completed").length} of {data.tasks.length} complete</span></div>{data.tasks.length ? <ol className="space-y-3">{data.tasks.map((task) => <li key={task.id} className="flex gap-3 rounded-xl border border-ink-100 p-4"><span className="mt-0.5">{task.status === "Completed" ? <CheckCircle2 className="h-5 w-5 text-teal-700"/> : <Circle className="h-5 w-5 text-ink-300"/>}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{task.title}</p><span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-700">{task.status}</span></div>{task.description && <p className="mt-1 text-sm leading-5 text-ink-600">{task.description}</p>}<p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-500">{task.scheduledDate ? <><CalendarDays className="h-3.5 w-3.5"/>{formatDate(task.scheduledDate)}</> : <><Clock3 className="h-3.5 w-3.5"/>Timing to be confirmed by your care team</>}</p>{task.needsReview && <p className="mt-2 text-xs text-amber-800">Please contact your care team to confirm the timing.</p>}</div></li>)}</ol> : <p className="text-sm text-ink-600">No tasks have been added to this plan yet.</p>}</section>}
        <p className="mt-5 text-xs leading-5 text-ink-500">This portal displays information approved by your hospital team. It does not provide medical advice. If an instruction or date looks incorrect, contact your care team. Do not use this portal for emergencies.</p>
      </> : null}
    </div>
  </main>;
}
