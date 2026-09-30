"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import { REGIONS } from "@/data/geography";
import { wait } from "@/lib/async";
import { ENTITY } from "@/lib/entities";
import { STATUS_LABEL, type SubStatus } from "@/lib/flow";
import { fmtDateTime, fmtPeriod } from "@/lib/format";
import { rules } from "@/lib/rules";
import type { StoredSubmission } from "@/lib/seed";
import { approveSubmission } from "@/lib/state-actions";
import { useCollection } from "@/lib/use-collection";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, IconChip, PageHeader, Pill, type PillTone, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

const TONE: Record<SubStatus, PillTone> = { approved: "good", pending: "warn", returned: "bad", draft: "neutral", missing: "accent" };
const REVIEWER = "Sahra Aadan";

export default function ReviewSubmission() {
  const [openExport, exportDialog] = useExportDialog();
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const [busy, setBusy] = React.useState(false);

  const row = rows.find((r) => r.id === submissionId);
  if (!row) return <EmptyState icon="solar:file-corrupted-linear" title="That return no longer exists" />;

  const status = row.status as SubStatus;
  const region = REGIONS.find((r) => r.id === row.region)?.name ?? row.region;
  const approvable = rules.canApprove(row);
  const flag = row.resolved > row.disputes
    ? "Resolved disputes exceed total disputes."
    : row.disputes > 0 && row.resolved / row.disputes < 0.3
      ? `Only ${row.resolved} of ${row.disputes} disputes resolved. Confirm with the district before approving.`
      : null;

  async function approve() {
    setBusy(true);
    await wait();
    const res = approveSubmission(row!.id, REVIEWER);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`${row!.district} approved and released to federal`);
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title={`${row.district} — ${fmtPeriod(row.period)}`}
        meta={`${region} · filed by ${row.focalPoint}${row.submittedAt ? ` · ${fmtDateTime(row.submittedAt)}` : ""}`}
        actions={<Pill tone={TONE[status]}>{STATUS_LABEL[status]}</Pill>}
      />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-8">
          <PmsCard title="What the district reported" flush>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                { label: "Disputes", value: row.disputes, icon: "solar:scale-linear" },
                { label: "Resolved", value: row.resolved, icon: "solar:check-circle-linear" },
                { label: "Tension level", value: row.tension, icon: "solar:danger-triangle-linear" },
                { label: "Evidence files", value: row.evidence, icon: "solar:gallery-wide-linear" },
              ].map((s) => (
                <div key={s.label} className="border-b border-r border-[color:var(--pms-divide)] px-5 py-4 last:border-r-0">
                  <div className="flex items-center gap-3">
                    <IconChip icon={s.icon} tone="info" size={36} />
                    <div>
                      <p className="text-[11px] font-medium text-[var(--pms-muted-text)]">{s.label}</p>
                      <p className="text-xl font-bold tabular-nums text-[var(--pms-text-strong)]">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PmsCard>

          <PmsCard title="The story">
            <dl className="flex flex-col gap-3 text-[13px]">
              {[
                ["What happened", BERDAALE_REPORT.narrative.whatHappened],
                ["What stopped more being done", BERDAALE_REPORT.narrative.whoActed],
                ["What will change next quarter", BERDAALE_REPORT.narrative.whatChanged],
                ["What changed for ordinary people", BERDAALE_REPORT.narrative.whatIsNeeded],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]">{k}</dt>
                  <dd className="mt-1 leading-[1.5] text-[var(--pms-text)]">{v}</dd>
                </div>
              ))}
            </dl>
          </PmsCard>

          <PmsCard title="Timeline" flush>
            <ol className="flex flex-col">
              {row.events?.length ? (
                row.events.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 border-b border-[color:var(--pms-divide)] px-5 py-3 last:border-b-0">
                    <IconChip icon="solar:clock-circle-linear" tone="neutral" size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{STATUS_LABEL[e.to]}</p>
                      <p className="text-[11.5px] text-[var(--pms-muted-text)]">
                        {fmtDateTime(e.at)} · {e.by}
                        {e.reason ? ` — ${e.reason}` : ""}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-5 py-4 text-[13px] text-[var(--pms-muted-text)]">Nothing recorded yet.</li>
              )}
            </ol>
          </PmsCard>
        </div>

        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-4">
          <PmsCard title="Checks">
            {flag ? (
              <p className="rounded-[10px] bg-[var(--pms-icon-warning-bg)] px-3 py-2.5 text-[12.5px] font-medium text-[var(--pms-icon-warning-fg)]">
                {flag}
              </p>
            ) : (
              <p className="rounded-[10px] bg-[var(--pms-icon-success-bg)] px-3 py-2.5 text-[12.5px] font-medium text-[var(--pms-icon-success-fg)]">
                No automatic flags raised.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={!approvable.ok || busy} className="h-10 w-full rounded-[var(--pms-radius-control)]">
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve {row.district}?</DialogTitle>
                    <DialogDescription>
                      The figures are released to federal users under this state&apos;s sharing settings. An approved
                      return can no longer be edited.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={approve}>Approve</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                disabled={status !== "pending"}
                className="h-10 w-full rounded-[var(--pms-radius-control)]"
                onClick={() => router.push(`/state/submissions/${row.id}/return`)}
              >
                Return for correction
              </Button>

              <Button
                variant="outline"
                className="h-10 w-full rounded-[var(--pms-radius-control)]"
                onClick={() => toast(`${row.focalPoint} · ${BERDAALE_REPORT.focalPoint.phone}`, { description: "District focal point" })}
              >
                Call the focal point
              </Button>
            </div>

            {!approvable.ok ? (
              <p className="mt-3 text-[12px] text-[var(--pms-muted-text)]">{approvable.reason}</p>
            ) : null}
          </PmsCard>

          <PmsCard title="Sharing">
            <p className="text-[13px] leading-[1.5] text-[var(--pms-text)]">
              What leaves this state is decided on the sharing page, not here.
            </p>
            <Link
              href="/state/sharing"
              className="mt-3 inline-flex h-9 items-center rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] px-4 text-sm font-medium text-[var(--pms-text)] no-underline hover:bg-[var(--pms-row-hover)]"
            >
              Open sharing control
            </Link>
          </PmsCard>
        </div>
      </div>
    </div>
  );
}
