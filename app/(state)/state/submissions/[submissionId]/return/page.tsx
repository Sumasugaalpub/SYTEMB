"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { wait } from "@/lib/async";
import { ENTITY } from "@/lib/entities";
import type { StoredSubmission } from "@/lib/seed";
import { returnSubmission } from "@/lib/state-actions";
import { useCollection } from "@/lib/use-collection";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

const REASONS = [
  "Dispute count does not match the committee minutes",
  "Resolved disputes exceed total disputes",
  "Evidence missing for a reported agreement",
  "Council figures incomplete",
  "Tension level needs confirming with the district commissioner",
];

const REVIEWER = "Ibraahim Xasan";

export default function ReturnForCorrection() {
  const [openExport, exportDialog] = useExportDialog();
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const row = rows.find((r) => r.id === submissionId);
  if (!row) return <EmptyState icon="solar:file-corrupted-linear" title="That return no longer exists" />;

  const full = [reason, note.trim()].filter(Boolean).join(" — ");
  const valid = reason.length > 0;

  async function send() {
    setBusy(true);
    await wait();
    const res = returnSubmission(row!.id, REVIEWER, full);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Sent back to ${row!.district}`);
    router.push("/state/submissions");
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader onPrint={printPage} onExport={openExport} title={`Return ${row.district} for correction`} meta="The district focal point sees this on the phone immediately." />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <PmsCard title="Reason" className="xl:col-span-7">
          <div className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-[10px] border px-3.5 py-2.5 text-left text-[13px] transition-colors ${
                  reason === r
                    ? "border-[var(--pms-primary)] bg-[var(--pms-icon-info-bg)] font-semibold text-[var(--pms-text-strong)]"
                    : "border-[color:var(--pms-hairline-border)] text-[var(--pms-text)] hover:bg-[var(--pms-row-hover)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Note to the district (optional)</span>
            <textarea
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Qor sida loo saxayo…"
              className="rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-[var(--pms-primary)]"
            />
            <span className="self-end text-[11px] tabular-nums text-[var(--pms-muted-text)]">{note.length}/300</span>
          </label>

          {!valid ? (
            <p className="mt-2 text-[12px] font-medium text-[var(--pms-icon-danger-fg)]">Choose a reason before sending it back.</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <Button disabled={!valid || busy} onClick={send} className="h-10 rounded-[var(--pms-radius-control)]">
              {busy ? "Sending…" : "Send back"}
            </Button>
            <Button variant="outline" className="h-10 rounded-[var(--pms-radius-control)]" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </PmsCard>

        <PmsCard title="What the district will see" className="xl:col-span-5">
          <div className="rounded-[12px] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-icon-danger-fg)]">
              Loo celiyay saxid · Sent back
            </p>
            <p className="mt-2 text-[13px] leading-[1.5] text-[var(--pms-text)]">
              {full || "Your reason appears here."}
            </p>
            <p className="mt-3 text-[11.5px] text-[var(--pms-muted-text)]">
              {row.district} · {row.period} · from {REVIEWER}
            </p>
          </div>
        </PmsCard>
      </div>
    </div>
  );
}
