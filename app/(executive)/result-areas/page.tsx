"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EVIDENCE } from "@/data/evidence";
import { INDICATORS } from "@/data/indicators";
import { PROJECTS } from "@/data/projects";
import { RESULT_AREAS } from "@/data/resultAreas";
import { getDenominator } from "@/lib/coverage";
import { fmtPeriod } from "@/lib/format";
import { bandOf } from "@/lib/status";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GHOST_BUTTON, GUTTER, PANEL_BODY, Panel, PanelHead, PanelLink } from "@/components/pms/dashboard-sections";
import { PageHeader, Pill, type PillTone, printPage, Provenance, useExportDialog } from "@/components/pms/ui";

type Row = (typeof RESULT_AREAS)[number];
type Tone = "neutral" | "success" | "info" | "warning" | "accent" | "danger";

/** Bands carry a map colour of their own; in a table they wear a portal tint. */
const BAND_TONE: Record<string, PillTone> = {
  excellent: "good",
  good: "good",
  fair: "info",
  watch: "warn",
  off: "bad",
  poor: "bad",
  none: "neutral",
};

const PROJECT_TONE: Record<string, PillTone> = {
  "on-track": "good",
  complete: "info",
  "at-risk": "warn",
  delayed: "bad",
};

const TILE =
  "rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]";

function toneStyle(tone: Tone) {
  return { backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` };
}

export default function ResultAreasPage() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const params = useSearchParams();
  const { region, period, bandMode } = useStore();
  const [open, setOpen] = React.useState<string | null>(params.get("area"));
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const total = getDenominator(region);
  const area = RESULT_AREAS.find((r) => r.id === open);
  const indicatorsOf = (id: string) => INDICATORS.filter((k) => k.resultArea === id);
  const withData = (id: string) => indicatorsOf(id).filter((k) => k.value !== null).length;
  const projectsOf = (id: string) => PROJECTS.filter((p) => p.resultArea === id);

  /** Evidence filed against the area itself, plus everything its projects carry. */
  const evidenceOf = (id: string) => {
    const ids = new Set(EVIDENCE.filter((e) => e.resultArea === id).map((e) => e.id));
    projectsOf(id).forEach((p) => {
      p.evidence.forEach((e) => ids.add(e));
      EVIDENCE.filter((e) => e.linked.includes(p.id)).forEach((e) => ids.add(e.id));
    });
    return ids.size;
  };

  /** An area needs at least two measures carrying a value before its score means anything. */
  const thinIds = new Set(RESULT_AREAS.filter((r) => withData(r.id) < 2).map((r) => r.id));

  const columns: Column<Row>[] = [
    {
      key: "code",
      header: "Code",
      value: (r) => r.code,
      cell: (r) => <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{r.code}</span>,
      width: "76px",
    },
    {
      key: "name",
      header: "Result area",
      value: (r) => r.name,
      cell: (r) => <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{r.name}</span>,
    },
    { key: "lead", header: "Lead", value: (r) => r.lead, cell: (r) => <span className="text-[12px] text-[var(--pms-muted-text)]">{r.lead}</span> },
    { key: "indicators", header: "Indicators", value: (r) => indicatorsOf(r.id).length, align: "right" },
    {
      key: "withData",
      header: "With data",
      value: (r) => withData(r.id),
      align: "right",
      // Fewer than two measures with a value: the count itself says so, so the
      // page needs no legend repeating it underneath.
      cell: (r) =>
        thinIds.has(r.id) ? (
          <Pill tone="warn">
            {withData(r.id)} of {indicatorsOf(r.id).length}
          </Pill>
        ) : (
          <span className="text-[12px] tabular-nums text-[var(--pms-muted-text)]">
            {withData(r.id)} of {indicatorsOf(r.id).length}
          </span>
        ),
    },
    {
      key: "score",
      header: "Score",
      value: (r) => r.score,
      align: "right",
      cell: (r) => <b className="text-[13px] tabular-nums text-[var(--pms-text-strong)]">{r.score}</b>,
    },
    {
      key: "trend",
      header: "Δ",
      value: (r) => r.trend,
      align: "right",
      cell: (r) => (
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: r.trend >= 0 ? "var(--pms-icon-success-fg)" : "var(--pms-icon-danger-fg)" }}
        >
          {r.trend >= 0 ? "+" : ""}{r.trend}
        </span>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      value: (r) => r.reported,
      align: "right",
      width: "132px",
      cell: (r) => {
        const rep = Math.round((r.reported / 90) * total);
        const pct = Math.round((rep / Math.max(1, total)) * 100);
        return (
          <span className="flex items-center justify-end gap-2">
            <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-[var(--pms-segmented-track)] sm:block">
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.max(2, pct)}%`, backgroundColor: "var(--pms-chart-collected)" }}
              />
            </span>
            <span className="text-[12px] tabular-nums text-[var(--pms-muted-text)]">
              {rep}/{total}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      value: (r) => bandOf(r.score, bandMode).label,
      cell: (r) => {
        const b = bandOf(r.score, bandMode);
        return <Pill tone={BAND_TONE[b.id] ?? "neutral"}>{b.label}</Pill>;
      },
    },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters onPrint={printPage} onExport={openExport} title="Result areas" meta={`Nine areas against ${fmtPeriod(period)} targets`} />

      <Panel>
        <PanelHead title="Nine result areas" action={<PanelLink href="/framework">Framework</PanelLink>} />
        <DataTable
          rows={RESULT_AREAS}
          columns={columns}
          loading={loading}
          exportName="result-areas"
          searchPlaceholder="Search area or lead…"
          pageSize={9}
          onRowClick={(r) => setOpen(r.id)}
          empty="No result areas"
        />
      </Panel>

      {area ? (
        <div className="grid grid-cols-1 items-stretch gap-3 lg:gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-8">
            <PanelHead
              title={`${area.code} — ${area.name}`}
              action={
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]"
                >
                  Close
                </button>
              }
            />
            <div className={PANEL_BODY}>
              <div className={cn("flex items-start gap-3", GUTTER)}>
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={toneStyle("info")}>
                  <iconify-icon icon={area.icon} className="text-[17px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-[1.55] text-[var(--pms-text)]">{area.summary}</p>
                  <Provenance
                    className="mt-1.5"
                    reported={Math.round((area.reported / 90) * total)}
                    total={total}
                    period={fmtPeriod(period)}
                    quality="Verified"
                  />
                </div>
              </div>

              <div className={cn("mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3", GUTTER)}>
                {[
                  { label: "Indicators", n: indicatorsOf(area.id).length, icon: "solar:ruler-pen-linear", tone: "success" as Tone },
                  { label: "Projects", n: projectsOf(area.id).length, icon: "solar:case-round-linear", tone: "info" as Tone },
                  { label: "Evidence items", n: evidenceOf(area.id), icon: "solar:gallery-wide-linear", tone: "accent" as Tone },
                ].map((s) => (
                  <div key={s.label} className={TILE}>
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle(s.tone)}>
                        <iconify-icon icon={s.icon} className="text-[15px]" />
                      </span>
                      <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{s.label}</span>
                    </div>
                    <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{s.n}</p>
                  </div>
                ))}
              </div>

              <div className={cn("mt-4 flex flex-wrap gap-2", GUTTER)}>
                <button type="button" className={GHOST_BUTTON} onClick={() => router.push(`/indicators?area=${area.id}`)}>
                  View indicators
                  <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
                </button>
                <button type="button" className={GHOST_BUTTON} onClick={() => router.push(`/interventions?area=${area.id}`)}>
                  View projects
                  <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
                </button>
              </div>

              <ul className="mt-4 flex flex-col pb-2">
                {indicatorsOf(area.id).map((k) => (
                  <li key={k.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                    <Link
                      href={`/indicators/${k.id}`}
                      className={cn("flex items-center gap-3 py-2.5 no-underline transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
                    >
                      <span className="hidden shrink-0 font-mono text-[11px] text-[var(--pms-muted-text)] sm:inline">{k.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{k.name}</span>
                      <b className="shrink-0 text-[13px] tabular-nums text-[var(--pms-text-strong)]">{k.value ?? "—"}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel className="xl:col-span-4">
            <PanelHead
              title="Projects in this area"
              action={<PanelLink href={`/interventions?area=${area.id}`}>See all</PanelLink>}
            />
            <ul className={cn(PANEL_BODY, "pb-2")}>
              {projectsOf(area.id).map((p) => (
                <li key={p.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                  <Link
                    href={`/interventions/${p.id}`}
                    className={cn("flex items-center gap-3 py-2.5 no-underline transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle("neutral")}>
                      <iconify-icon icon="solar:case-round-linear" className="text-[14px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{p.title}</span>
                      <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">{p.lead} · {p.progress}%</span>
                    </span>
                    <Pill tone={PROJECT_TONE[p.status] ?? "neutral"}>{p.status}</Pill>
                  </Link>
                </li>
              ))}
              {projectsOf(area.id).length === 0 ? (
                <li className={cn("py-4 text-[13px] text-[var(--pms-muted-text)]", GUTTER)}>No registered projects.</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
