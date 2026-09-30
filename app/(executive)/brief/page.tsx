"use client";

import * as React from "react";
import Link from "next/link";

import { ALERTS } from "@/data/alerts";
import { NATIONAL_INDEXES, PUBLISHED_EDITION } from "@/data/nationalIndexes";
import { PROJECTS } from "@/data/projects";
import { TIMELINE } from "@/data/timeline";
import { districtsReported, getDenominator, periodBefore, scopedAreas, scopedNationalScore } from "@/lib/coverage";
import { downloadPDF } from "@/lib/download";
import { ENTITY } from "@/lib/entities";
import { useSuppressionThreshold } from "@/lib/settings";
import { fmtDate, fmtPeriod } from "@/lib/format";
import type { StoredSubmission } from "@/lib/seed";
import { bandOf } from "@/lib/status";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GUTTER, PANEL_BODY, Panel, PanelHead, PanelLink } from "@/components/pms/dashboard-sections";
import { PageHeader, Pill, type PillTone, printPage, Provenance, useExportDialog } from "@/components/pms/ui";

const DECISIONS = [
  { text: "Release the emergency mediation grant for the Afgoye corridor", ref: "EW-2026-0094", owner: "MOIFAR" },
  { text: "Mandate OPM to convene the land-tenure task force", ref: "PRJ-0155", owner: "OPM" },
  { text: "Endorse the testimony consent protocol", ref: "PRJ-0161", owner: "MOCHE" },
];

type Tone = "neutral" | "success" | "info" | "warning" | "accent" | "danger";

/** Bands carry their own colour for the map; on a card they wear a portal tint. */
const BAND_TONE: Record<string, PillTone> = {
  excellent: "good",
  good: "good",
  fair: "info",
  watch: "warn",
  off: "bad",
  poor: "bad",
  none: "neutral",
};

const TILE =
  "rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]";

function toneStyle(tone: Tone) {
  return { backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` };
}

/** One counter tile: label, bold figure, a tinted pill carrying the short marker. */
function Tile({ icon, tone, label, value, pill, meta }: { icon: string; tone: Tone; label: string; value: string; pill: string; meta: string }) {
  return (
    <div className={TILE}>
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle(tone)}>
          <iconify-icon icon={icon} className="text-[15px]" />
        </span>
        <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{label}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{value}</span>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums" style={toneStyle(tone)}>
          {pill}
        </span>
      </div>
      <p className="mt-1 truncate text-[11px] text-[var(--pms-muted-text)]">{meta}</p>
    </div>
  );
}

export default function ExecutiveBrief() {
  const [openExport, exportDialog] = useExportDialog();
  const { region, period, bandMode } = useStore();
  const submissions = useCollection<StoredSubmission>(ENTITY.submissions);

  // The top bar carries the page title on screen, but print CSS drops the top
  // bar — so the sheet needs its own header, with the real date it was printed.
  const [printedOn, setPrintedOn] = React.useState(TIMELINE.today.slice(0, 10));
  React.useEffect(() => setPrintedOn(new Date().toISOString().slice(0, 10)), []);

  const threshold = useSuppressionThreshold();
  const total = getDenominator(region);
  const filedSince = submissions.filter(
    (r) => r.submittedAt && r.period === period && (region === "all" || r.region === region),
  ).length;
  const reported = districtsReported(region, period, filedSince);

  // Every figure on the sheet follows the region and the period the brief is run for.
  const areas = scopedAreas(region, period);
  const composite = scopedNationalScore(region, period) ?? 0;
  const prevPeriod = periodBefore(period);
  const prevComposite = prevPeriod ? scopedNationalScore(region, prevPeriod) : null;
  const delta = prevComposite === null ? null : composite - prevComposite;
  const best = [...areas].sort((a, b) => b.score - a.score)[0];
  const worst = [...areas].sort((a, b) => a.score - b.score)[0];
  const openAlerts = ALERTS.filter((a) => a.status !== "closed");
  const atRisk = PROJECTS.filter((p) => p.status === "at-risk" || p.status === "delayed");

  function savePdf() {
    downloadPDF(
      `Executive brief — ${fmtPeriod(period)}`,
      [
        `Prepared ${fmtDate(TIMELINE.today.slice(0, 10))} · Somalia Peace Museum M&E Unit`,
        "",
        `Composite score: ${composite}`,
        `Coverage: ${reported} of ${total} districts reported`,
        `Strongest: ${best.code} ${best.name} (${best.score})`,
        `Weakest: ${worst.code} ${worst.name} (${worst.score})`,
        "",
        "Result areas",
        ...areas.map((r) => `  ${r.code}  ${r.name} — ${r.score} (${r.trend >= 0 ? "+" : ""}${r.trend}) ${bandOf(r.score, bandMode).label}`),
        "",
        "Decisions requested",
        ...DECISIONS.map((d, i) => `  ${i + 1}. ${d.text} (${d.ref}, ${d.owner})`),
        "",
        `Figures come from approved returns only. Counts of people below ${threshold} are suppressed.`,
        "Boundaries indicative only. Demo data.",
      ],
      `executive-brief-${period}.pdf`,
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      {exportDialog}

      {/* Print only — the ministry name, the period and the print date on the sheet. */}
      <header className="hidden border-b border-black pb-3 text-black print:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Federal Government of Somalia</p>
        <h1 className="mt-0.5 text-[17px] font-bold leading-tight">
          Ministry of Interior, Federal Affairs &amp; Reconciliation (MOIFAR)
        </h1>
        <p className="mt-0.5 text-[12px]">
          Executive brief · {fmtPeriod(period)} · printed {fmtDate(printedOn)}
        </p>
      </header>

      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="Executive brief"
        meta={`${fmtPeriod(period)} · prepared ${fmtDate(TIMELINE.today.slice(0, 10))} · restricted distribution`}
        actions={
          <Button className="h-9 rounded-[var(--pms-radius-control)]" onClick={savePdf}>
            Download PDF
          </Button>
        }
      />

      {/* Compact summary strip — the whole sheet in five figures. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Tile
          icon="solar:speedometer-middle-linear"
          tone={(delta ?? 0) >= 0 ? "success" : "danger"}
          label="Composite score"
          value={String(composite)}
          pill={delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}`}
          meta={delta === null ? "no earlier quarter" : "vs last quarter"}
        />
        <Tile
          icon="solar:clipboard-check-linear"
          tone="info"
          label="Districts reported"
          value={`${reported} / ${total}`}
          pill={`${Math.round((reported / total) * 100)}%`}
          meta="coverage this quarter"
        />
        <Tile
          icon="solar:arrow-right-up-linear"
          tone="success"
          label="Strongest area"
          value={String(best.score)}
          pill={best.code}
          meta={best.name}
        />
        <Tile
          icon="solar:arrow-right-down-linear"
          tone="danger"
          label="Weakest area"
          value={String(worst.score)}
          pill={worst.code}
          meta={worst.name}
        />
        <Tile
          icon="solar:bell-bing-linear"
          tone="warning"
          label="Open alerts"
          value={String(openAlerts.length)}
          pill={`${atRisk.length} at risk`}
          meta="projects delayed or at risk"
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-5">
          <PanelHead title="Key messages" action={<PanelLink href="/early-warning">Alerts</PanelLink>} />
          <ul className={cn(PANEL_BODY, "pb-2")}>
            {[
              { icon: "solar:hand-shake-linear", tone: "success" as Tone, text: `Local mediation is working — ${best.name} leads at ${best.score}, up ${best.trend} this quarter.` },
              { icon: "solar:home-2-linear", tone: "danger" as Tone, text: `${worst.name} is the most off-track area at ${worst.score}.` },
              { icon: "solar:danger-triangle-linear", tone: "warning" as Tone, text: `${openAlerts.length} early-warning alerts remain open; Afgoye corridor is critical.` },
              { icon: "solar:case-round-linear", tone: "info" as Tone, text: `${atRisk.length} projects are delayed or at risk — land tenure is the common blocker.` },
            ].map((m) => (
              <li key={m.text} className={cn("flex items-start gap-3 border-t border-[color:var(--pms-divide)] py-3 first:border-t-0", GUTTER)}>
                <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle(m.tone)}>
                  <iconify-icon icon={m.icon} className="text-[15px]" />
                </span>
                <p className="text-[13px] leading-[1.5] text-[var(--pms-text)]">{m.text}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="xl:col-span-7">
          <PanelHead title="Result areas" action={<PanelLink href="/result-areas">See all</PanelLink>} />
          <div className={cn(PANEL_BODY, "min-w-0")}>
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-y border-[color:var(--pms-divide)]">
                    {["Code", "Result area", "Lead", "Score", "Δ", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]",
                          i >= 3 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {areas.map((r) => {
                    const b = bandOf(r.score, bandMode);
                    return (
                      <tr key={r.id} className="border-b border-[color:var(--pms-divide)] last:border-b-0">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--pms-muted-text)]">{r.code}</td>
                        <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--pms-text-strong)]">{r.name}</td>
                        <td className="px-4 py-2.5 text-[12px] text-[var(--pms-muted-text)]">{r.lead}</td>
                        <td className="px-4 py-2.5 text-right text-[13px] font-bold tabular-nums text-[var(--pms-text-strong)]">{r.score}</td>
                        <td
                          className="px-4 py-2.5 text-right text-[12px] font-semibold tabular-nums"
                          style={{ color: r.trend >= 0 ? "var(--pms-icon-success-fg)" : "var(--pms-icon-danger-fg)" }}
                        >
                          {r.trend >= 0 ? "+" : ""}{r.trend}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Pill tone={BAND_TONE[b.id] ?? "neutral"}>{b.label}</Pill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Provenance
              className={cn("mt-auto border-t border-[color:var(--pms-divide)] py-3", GUTTER)}
              reported={reported}
              total={total}
              period={fmtPeriod(period)}
              quality="Verified"
            />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHead title="Decisions requested" action={<PanelLink href="/early-warning">Early warning</PanelLink>} />
          <ol className={cn(PANEL_BODY, "pb-2")}>
            {DECISIONS.map((d, i) => (
              <li key={d.ref} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                <Link
                  href="/early-warning"
                  className={cn("flex items-center gap-3 py-3 no-underline transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-[9px] text-[12px] font-bold" style={toneStyle("info")}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[var(--pms-text-strong)]">{d.text}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--pms-muted-text)]">{d.ref} · owner {d.owner}</span>
                  </span>
                  <iconify-icon icon="solar:arrow-right-up-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
                </Link>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelHead title="National indicators" action={<PanelLink href="/national-indicators">See all</PanelLink>} />
          <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
            <div className="grid grid-cols-1 gap-3">
              {NATIONAL_INDEXES.map((ix) => {
                const now = ix.series.find((p) => p.year === 2026)!;
                return (
                  <div key={ix.id} className={TILE}>
                    <p className="truncate text-xs font-medium text-[var(--pms-muted-text)]">
                      {ix.name} ({ix.code})
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{now.value}</span>
                      <Pill tone="warn">Projected</Pill>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--pms-muted-text)]">
                      Baseline {ix.baseline} · 2029 target {ix.target2029} · lower is better
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-[var(--pms-muted-text)]">Latest published edition: {PUBLISHED_EDITION}.</p>
          </div>
        </Panel>
      </div>

      <p className="px-1 text-[11px] leading-[1.6] text-[var(--pms-muted-text)]">
        Figures come from approved returns only. Counts of people below {threshold} are suppressed. Boundaries
        indicative only. Demo data.
      </p>
    </div>
  );
}
