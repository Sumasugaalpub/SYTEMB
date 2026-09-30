"use client";

import * as React from "react";
import Link from "next/link";

import { REGIONS } from "@/data/geography";
import { RESULT_AREAS } from "@/data/resultAreas";
import { TIMELINE } from "@/data/timeline";
import { ENTITY } from "@/lib/entities";
import { fmtPeriod } from "@/lib/format";
import { bandOf } from "@/lib/status";
import type { StoredSubmission } from "@/lib/seed";
import { useSettings } from "@/lib/settings";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { StatsMetricsStrip, type StatMetricItem } from "@/components/pms/stats-metrics-strip";
import { IconChip, PageHeader, Pill, PmsCard, printPage, Provenance, useExportDialog } from "@/components/pms/ui";
import { SkeletonBlock } from "@/components/system/Skeleton";
import { BellRing, ClipboardCheck, Inbox, ShieldCheck, Undo2 } from "lucide-react";

const STATE = "south-west";

export default function StateDashboard() {
  const [openExport, exportDialog] = useExportDialog();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const sharing = useStore((s) => s.sharing[STATE]);
  const settings = useSettings();
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const total = rows.length;
  const submitted = rows.filter((r) => r.submittedAt).length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const returned = rows.filter((r) => r.status === "returned").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const late = rows.filter((r) => !r.submittedAt).length;

  const stats: StatMetricItem[] = [
    { title: "Districts submitted", value: `${submitted} / ${total}`, trend: `${total - submitted} outstanding`, trendVariant: submitted === total ? "good" : "bad", Icon: ClipboardCheck, iconTone: "success" },
    { title: "Awaiting review", value: String(pending), trend: pending ? "Needs your action" : "Inbox clear", trendVariant: pending ? "bad" : "good", Icon: Inbox, iconTone: "warning" },
    { title: "Approved", value: String(approved), trend: "Released to federal", trendVariant: "good", Icon: ShieldCheck, iconTone: "info" },
    { title: "Sent back", value: String(returned), trend: returned ? "Waiting on districts" : "None", trendVariant: returned ? "bad" : "good", Icon: Undo2, iconTone: "danger" },
    { title: "Late", value: String(late), trend: `Deadline ${settings.calendar.closeDay} Apr`, trendVariant: late ? "bad" : "good", Icon: BellRing, iconTone: "accent" },
  ];

  const byRegion = REGIONS.filter((r) => r.state === STATE).map((r) => {
    const mine = rows.filter((s) => s.region === r.id);
    return { id: r.id, name: r.name, total: r.districts.length, in: mine.filter((s) => s.submittedAt).length };
  });

  const shared = Object.entries(sharing ?? {}).filter(([, v]) => v).length;

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="South West State"
        meta={`${fmtPeriod(TIMELINE.period)} · ${submitted} of ${total} districts submitted`}
        actions={
          <>
            <Pill tone={pending ? "warn" : "good"}>{pending} awaiting review</Pill>
            <Link
              href="/state/submissions"
              className="inline-flex h-9 items-center rounded-[var(--pms-radius-control)] bg-[var(--pms-cta-bg)] px-4 text-sm font-semibold text-[var(--pms-cta-fg)] no-underline hover:bg-[var(--pms-cta-hover)]"
            >
              Open inbox
            </Link>
          </>
        }
      />

      {loading ? <SkeletonBlock height={148} /> : <StatsMetricsStrip items={stats} />}

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <PmsCard title="Result areas — this state" className="xl:col-span-8" flush>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {RESULT_AREAS.map((ra) => {
              const band = bandOf(ra.score, 6);
              return (
                <div key={ra.id} className="border-b border-r border-[color:var(--pms-divide)] px-5 py-4 last:border-r-0">
                  <div className="flex items-start gap-3">
                    <IconChip icon={ra.icon} tone="info" size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{ra.name}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-bold tabular-nums text-[var(--pms-text-strong)]">{ra.score}</span>
                        <span className="text-[11px] font-semibold" style={{ color: band.color }}>
                          {band.label}
                        </span>
                      </div>
                      <Provenance className="mt-1" reported={Math.round((ra.reported / 90) * total)} total={total} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PmsCard>

        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-4">
          <PmsCard title="Coverage by region">
            <ul className="flex flex-col gap-3">
              {byRegion.map((r) => (
                <li key={r.id} className="flex items-center gap-3 text-[13px]">
                  <span className="w-28 shrink-0 font-medium text-[var(--pms-text-strong)]">{r.name}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
                    <span
                      className="block h-full rounded-full bg-[var(--pms-chart-collected)]"
                      style={{ width: `${(r.in / r.total) * 100}%` }}
                    />
                  </span>
                  <b className="w-12 shrink-0 text-right tabular-nums text-[var(--pms-text-strong)]">
                    {r.in}/{r.total}
                  </b>
                </li>
              ))}
            </ul>
          </PmsCard>

          <PmsCard
            title="Sharing with Mogadishu"
            action={
              <Link href="/state/sharing" className="text-sm font-medium text-[var(--pms-muted-text)] no-underline hover:text-[var(--pms-text-strong)]">
                Change
              </Link>
            }
          >
            <p className="text-[13px] text-[var(--pms-text)]">
              {shared} of 5 items released. This state controls the setting.
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-[12.5px]">
              {Object.entries(sharing ?? {}).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="text-[var(--pms-muted-text)] capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                  <Pill tone={v ? "good" : "neutral"}>{v ? "Shared" : "Held"}</Pill>
                </li>
              ))}
            </ul>
          </PmsCard>
        </div>
      </div>
    </div>
  );
}
