"use client";

import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/dates";
import { PLAN_STATUS_LABELS } from "@/lib/status";
import { approvePlan, generateDraft, saveDraft } from "@/services/planService";
import type { PlanDetail } from "@/types";
import { DraftEditor } from "./DraftEditor";

export function PlanPanel({ plan, onChanged }: { plan: PlanDetail; onChanged: () => void }) {
  const { user } = useAuth();
  const isCoordinator = user?.role === "coordinator";
  const approved = plan.status === "approved";

  const [manual, setManual] = useState(false); // staff chose to write a draft by hand
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "generate" | "approve" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [ack, setAck] = useState(false);

  async function run<T>(kind: NonNullable<typeof busy>, fn: () => Promise<T>) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
      onChanged();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  }

  const draft = plan.draft;
  const undated = draft?.items.filter((i) => !i.suggestedDate).length ?? 0;
  const flagCount = draft?.flags.length ?? 0;

  return (
    <Card>
      <CardHeader
        title="Follow-up plan"
        subtitle={`Created ${formatDateTime(plan.createdAt)}${plan.createdBy ? ` by ${plan.createdBy}` : ""}`}
        action={<Badge tone={approved ? "teal" : "violet"}>{PLAN_STATUS_LABELS[plan.status]}</Badge>}
      />
      <div className="space-y-5 p-5">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <section aria-labelledby="orig-heading">
          <h3 id="orig-heading" className="text-sm font-semibold text-ink-900">
            Original clinician instructions
          </h3>
          <p className="mb-1 text-xs text-ink-500">Stored exactly as entered. Read-only.</p>
          <p className="whitespace-pre-wrap rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800">
            {plan.originalInstructions}
          </p>
        </section>

        {approved && draft ? (
          <section aria-labelledby="approved-heading" className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Approved{" "}
                {plan.approvedVersions.length > 0 &&
                  `(version ${plan.approvedVersions[plan.approvedVersions.length - 1].version}) by ${
                    plan.approvedVersions[plan.approvedVersions.length - 1].approvedBy ?? "staff"
                  } on ${formatDateTime(plan.approvedVersions[plan.approvedVersions.length - 1].approvedAt)}`}
                . Tasks are active in the checklist and calendar.
              </p>
            </div>
            <h3 id="approved-heading" className="text-sm font-semibold text-ink-900">
              Summary
            </h3>
            <p className="text-sm text-ink-800">{draft.summary}</p>
            <p className="text-sm text-ink-600">
              Clinician follow-up date:{" "}
              <span className="font-medium text-ink-900">
                {draft.clinicianFollowUpDate ? formatDate(draft.clinicianFollowUpDate) : "Not specified"}
              </span>
            </p>
            {flagCount > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-600">
                {draft.flags.map((f, i) => (
                  <li key={i}>Reviewed flag: {f.message}</li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section aria-label="Draft plan" className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                {draft?.source === "ai" ? "AI-generated draft. " : "Draft. "}
                Nothing here is active until a coordinator reviews and approves it. Verify every task against the
                original instructions.
              </p>
            </div>

            {!draft && !manual ? (
              <div className="flex flex-wrap gap-2">
                <Button loading={busy === "generate"} onClick={() => run("generate", () => generateDraft(plan.id))}>
                  <Sparkles className="h-4 w-4" aria-hidden /> Generate draft with AI
                </Button>
                <Button variant="secondary" onClick={() => setManual(true)}>
                  Write draft manually
                </Button>
              </div>
            ) : (
              <>
                <DraftEditor
                  key={plan.updatedAt}
                  initial={draft}
                  saving={busy === "save"}
                  onDirtyChange={setDirty}
                  onSave={(d) => run("save", () => saveDraft(plan.id, d))}
                />

                {draft && (
                  <div className="border-t border-ink-100 pt-4">
                    {isCoordinator ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          onClick={() => {
                            setAck(false);
                            setConfirming(true);
                          }}
                          disabled={dirty}
                        >
                          Approve plan
                        </Button>
                        {dirty && <span className="text-sm text-ink-500">Save your changes before approving.</span>}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-600">Only a coordinator can approve this plan.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title="Approve this follow-up plan?"
        confirmLabel="Approve and activate"
        loading={busy === "approve"}
        confirmDisabled={flagCount > 0 && !ack}
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          const ok = await run("approve", () => approvePlan(plan.id, ack));
          if (ok) setConfirming(false);
        }}
      >
        <p>
          {draft?.items.length ?? 0} task(s) will be activated. {undated > 0 && `${undated} have no confirmed date and will appear under “Needs scheduling” instead of on the calendar. `}
          Approval is recorded under your name and the plan can no longer be edited.
        </p>
        {flagCount > 0 && (
          <label className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-900">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-teal-700"
            />
            <span>I have reviewed the {flagCount} open flag(s) on this draft.</span>
          </label>
        )}
      </ConfirmDialog>
    </Card>
  );
}
