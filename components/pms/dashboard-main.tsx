"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing, ChevronRight, ClipboardCheck, Download, FileText, QrCode, Upload } from "lucide-react";

import { REGION_SCORES } from "@/data/regionStatus";
import { TIMELINE } from "@/data/timeline";
import { roleById } from "@/data/users";
import { clampTo, districtsReported, getDenominator, scopedAreas, seededOffset } from "@/lib/coverage";
import { PERIODS } from "@/data/periods";
import { ENTITY } from "@/lib/entities";
import { useSettings } from "@/lib/settings";
import { mapBandOf } from "@/lib/status";
import { fmtDate, fmtPeriod } from "@/lib/format";
import type { StoredSubmission } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { canSee } from "@/lib/visibility";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendLine } from "@/components/charts/TrendLine";
import { MapLegend } from "@/components/map/MapLegend";
import { MAP_HOME_CENTER, MAP_HOME_ZOOM, MAP_MAX_ZOOM, MAP_MIN_ZOOM, SomaliaMap } from "@/components/map/SomaliaMap";
import { SkeletonBlock } from "@/components/system/Skeleton";

import {
  EarlyWarningRail,
  EvidenceHub,
  GHOST_BUTTON,
  GUTTER,
  NationalIndexRail,
  PANEL_BODY,
  Panel,
  PanelHead,
  PanelLink,
  RankLists,
  Rule,
  SubLabel,
} from "./dashboard-sections";
import { type AreaDecision, BandKeyStrip, ResultAreaCards } from "./result-area-cards";
import { ResultEntryDialog } from "./result-entry-dialog";
import { ScopeFilters } from "./scope-filters";
import { useExportDialog } from "./ui";

/** One grid gap for every card row on the page. */
const ROW_GRID = "grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12";

/** Each row of cards shares one height on wide screens, so nothing is ragged. */
const ROW_1_HEIGHT = "";
const ROW_2_HEIGHT = "";
const ROW_3_HEIGHT = "";

/** Each decision line points at the alert that raised it. */
const DECISIONS: Record<string, AreaDecision> = {
  "cl-02": { text: "Water tension, 3 Bay districts", alert: "EW-2026-0091" },
  "cl-04": { text: "Land tenure blocking PRJ-0155", alert: "EW-2026-0094" },
};

/** Nine quarters, Q2 2024 → Q2 2026. Two of them fall — a line that only rises is not credible. */
/** Nine quarters ending at whatever the picker is on, scoped to the region. */
function trendFor(scope: string, period: string) {
  const i = PERIODS.findIndex((p) => p.id === period);
  const end = i === -1 ? PERIODS.length - 1 : i;
  const start = Math.max(0, end - 8);
  const total = getDenominator(scope);
  return PERIODS.slice(start, end + 1).map((p) => {
    const key = `${scope}|${p.id}`;
    const share = clampTo(55 + seededOffset(`${key}|trend-cov`, 20));
    return {
      label: p.label.replace(" 20", " "),
      score: clampTo(68 + seededOffset(`${key}|trend-score`, 11)),
      // Districts, not a percentage: the line is read against the scope's own denominator.
      coverage: clampTo(Math.round((total * share) / 100), 0, total),
    };
  });
}

/** Six quick actions. Each one opens the thing itself, not the page near it. */
type QuickAction = {
  title: string;
  Icon: typeof ClipboardCheck;
  tone: "neutral" | "success" | "info" | "warning";
  href?: string;
  act?: "result" | "export";
};

const QUICK_ACTIONS: QuickAction[] = [
  { title: "Submit report", Icon: ClipboardCheck, tone: "success", act: "result" },
  { title: "Upload evidence", Icon: Upload, tone: "info", href: "/evidence?upload=1" },
  { title: "Create early warning alert", Icon: BellRing, tone: "success", href: "/early-warning?new=1" },
  { title: "Create incident report", Icon: FileText, tone: "info", href: "/conflict-navigator?new=1" },
  { title: "Generate QR code", Icon: QrCode, tone: "warning", href: "/verify?mode=generate" },
  { title: "Export dashboard", Icon: Download, tone: "warning", act: "export" },
];

function iconToneStyle(tone: "neutral" | "success" | "info" | "warning") {
  return { backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` };
}

export function DashboardMain() {
  // Off by default: the shared origin line under the nine tiles already says
  // where every figure came from. The switch opens the full block per tile.
  const [detail, setDetail] = React.useState(false);
  const [compare, setCompare] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [openExport, exportDialog] = useExportDialog();
  const [entryOpen, setEntryOpen] = React.useState(false);
  const router = useRouter();

  // Map controls — the same set page 12 carries.
  const [zoom, setZoom] = React.useState(MAP_HOME_ZOOM);
  const [center, setCenter] = React.useState<[number, number]>(MAP_HOME_CENTER);
  const [pins, setPins] = React.useState(true);
  const [band, setBand] = React.useState<string | null>(null);

  const { region, period, bandMode, role, setPageHead } = useStore();

  /** Legend filter — regions outside the chosen band fade out, the rest keep their blue. */
  const bandFill = React.useCallback(
    (rid: string) => (band && mapBandOf(REGION_SCORES[rid] ?? null, bandMode).id !== band ? "#e9ebef" : undefined),
    [band, bandMode],
  );
  const clearance = roleById(role).clearance;
  const trend = trendFor(region, period);
  const submissions = useCollection<StoredSubmission>(ENTITY.submissions);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const settings = useSettings();
  const total = getDenominator(region);
  // Coverage is counted, not typed: the districts on record as reporting for
  // this scope and quarter, plus anything filed to this browser since.
  const filedSince = submissions.filter(
    (r) => r.submittedAt && r.period === period && (region === "all" || r.region === region),
  ).length;
  const reported = districtsReported(region, period, filedSince);

  /** The open quarter closes `closeDay` days after the quarter ends — a setting, not a date. */
  const closes = React.useMemo(() => {
    const open = PERIODS.find((p) => p.id === TIMELINE.periodOpen);
    if (!open) return null;
    const d = new Date(`${open.end}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + settings.calendar.closeDay);
    return d.toISOString().slice(0, 10);
  }, [settings.calendar.closeDay]);


  React.useEffect(() => {
    setPageHead({ title: "Dashboard", meta: "Executive overview of performance by Result Area." });
  }, [setPageHead]);

  return (
    <main className="min-w-0 w-full flex-1">
      <div className="flex w-full flex-col gap-4">
        {exportDialog}
        <ResultEntryDialog open={entryOpen} onOpenChange={setEntryOpen} />

        {/* One control row: the national score on the left, everything that
            changes what it means on the right. */}
        {/* Filter bar on top, the period note and detail switch on the right. */}
        <div className="mt-2 flex flex-wrap items-center gap-2.5 border-b border-[color:var(--pms-divide)] pb-4">
          <ScopeFilters />
          <span className="ml-auto hidden text-[11.5px] text-[var(--pms-muted-text)] lg:inline">
            {fmtPeriod(TIMELINE.periodOpen)} in progress{closes ? ` · closes ${fmtDate(closes)}` : ""}
          </span>
          <label className="flex shrink-0 items-center gap-2 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] bg-[var(--pms-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--pms-muted-text)]">
            Number detail
            <Switch checked={detail} onCheckedChange={setDetail} aria-label="Show number detail" />
          </label>
        </div>

        {/* ------------------------------------------------------------------
            Stats bar — the nine result areas and the score they roll up to.
        ------------------------------------------------------------------ */}
        <section aria-label="Result areas" className="flex flex-col gap-4">
          {loading ? (
            <SkeletonBlock height={190} />
          ) : (
            <>
              <ResultAreaCards
                detail={detail}
                bandMode={bandMode}
                total={total}
                period={fmtPeriod(period)}
                decisions={DECISIONS}
                defaultReported={reported}
              />

              <Panel>
                <BandKeyStrip
                  bandMode={bandMode}
                  compareOpen={compare}
                  onCompare={() => setCompare((c) => !c)}
                  note={`All figures: District Returns · ${fmtPeriod(period)} · Verified · ${reported} of ${total} districts reported.`}
                />
                {compare ? (
                  <>
                    <Rule />
                    <SubLabel className={cn("pb-2 pt-4", GUTTER)}>Progress compared to last quarter</SubLabel>
                    <ul className="flex flex-col pb-4">
                      {scopedAreas(region, period).map((r) => (
                        <li
                          key={r.id}
                          className={cn(
                            "flex items-center gap-3 border-t border-[color:var(--pms-divide)] py-2.5 text-[13px] first:border-t-0",
                            GUTTER,
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate text-[var(--pms-text)]">{r.name}</span>
                          <span className="w-8 text-right tabular-nums text-[var(--pms-muted-text)]">
                            {r.score - r.trend}
                          </span>
                          <iconify-icon icon="solar:arrow-right-linear" className="text-[13px] text-[var(--pms-muted-text)]" />
                          <b className="w-8 text-right tabular-nums text-[var(--pms-text-strong)]">{r.score}</b>
                          <span
                            className="inline-flex w-[52px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums"
                            style={{
                              backgroundColor:
                                r.trend >= 0 ? "var(--pms-icon-success-bg)" : "var(--pms-icon-danger-bg)",
                              color: r.trend >= 0 ? "var(--pms-icon-success-fg)" : "var(--pms-icon-danger-fg)",
                            }}
                          >
                            {r.trend >= 0 ? "+" : ""}
                            {r.trend}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </Panel>
            </>
          )}
        </section>

        {/* Row 1 — how the score moved, what it rolls into, what to do next. */}
        <section aria-label="Score trend and national indicators" className={ROW_GRID}>
          <Panel className={cn("xl:col-span-6", ROW_1_HEIGHT)}>
            <PanelHead title="Score trend" action={<PanelLink href="/analytics">See all</PanelLink>} />
            <div className={cn(PANEL_BODY, "justify-center px-2 pb-5 sm:px-3")}>
              <TrendLine
                data={trend}
                series={[{ key: "score", name: "Composite score", color: "var(--pms-chart-collected)" }]}
                meta={[{ key: "coverage", label: "Coverage", suffix: ` of ${total} districts` }]}
                height={236}
              />
            </div>
          </Panel>

          <NationalIndexRail className={cn("xl:col-span-6", ROW_1_HEIGHT)} />

        </section>

        {/* Row 2 — the evidence behind the score, where it sits, what is warning. */}
        <section aria-label="Evidence, national map and early warning" className={ROW_GRID}>

          <Panel className={cn("xl:col-span-8", ROW_2_HEIGHT)}>
            <PanelHead title="National map" action={<PanelLink href="/map">See all</PanelLink>} />
            <div className={PANEL_BODY}>
              <div className={cn("relative", GUTTER)}>
                <SomaliaMap
                  height={300}
                  layers={{ status: true, incidents: pins }}
                  zoom={zoom}
                  center={center}
                  regionColor={bandFill}
                  onSelectRegion={(id) => router.push(`/map?region=${id}`)}
                />
                <div className="absolute right-7 top-2 flex flex-col gap-1.5 sm:right-8">
                  {[
                    { icon: "solar:add-circle-linear", label: "Zoom in", disabled: zoom >= MAP_MAX_ZOOM, on: false, run: () => setZoom((z) => Math.min(MAP_MAX_ZOOM, Math.round((z + 0.5) * 10) / 10)) },
                    { icon: "solar:minus-circle-linear", label: "Zoom out", disabled: zoom <= MAP_MIN_ZOOM, on: false, run: () => setZoom((z) => Math.max(MAP_MIN_ZOOM, Math.round((z - 0.5) * 10) / 10)) },
                    { icon: "solar:home-2-linear", label: "Reset to full country", disabled: zoom === MAP_HOME_ZOOM && center[0] === MAP_HOME_CENTER[0] && center[1] === MAP_HOME_CENTER[1], on: false, run: () => { setZoom(MAP_HOME_ZOOM); setCenter(MAP_HOME_CENTER); } },
                    { icon: "solar:map-point-linear", label: pins ? "Hide district pins" : "Show district pins", disabled: false, on: pins, run: () => setPins((v) => !v) },
                  ].map((b) => (
                    <Button
                      key={b.label}
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={b.label}
                      aria-pressed={b.on}
                      title={b.label}
                      disabled={b.disabled}
                      onClick={b.run}
                      className="size-8 rounded-[var(--pms-radius-control)] bg-[var(--pms-surface)] shadow-[var(--pms-card-shadow)]"
                      style={b.on ? { borderColor: "var(--pms-primary)", color: "var(--pms-icon-info-fg)" } : undefined}
                    >
                      <iconify-icon icon={b.icon} className="text-[16px]" />
                    </Button>
                  ))}
                </div>
                <span className="absolute bottom-2 left-7 rounded-[8px] bg-[var(--pms-surface)]/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--pms-muted-text)] shadow-[var(--pms-card-shadow)] sm:left-8">
                  {zoom.toFixed(1)}×
                </span>
              </div>
              <div className={cn("mt-auto pb-5 pt-4", GUTTER)}>
                <MapLegend active={band} onSelect={setBand} />
                <p className="mt-2 text-[11px] text-[var(--pms-muted-text)]">
                  Boundaries are indicative only and imply no official endorsement.
                </p>
              </div>
            </div>
          </Panel>

          <EarlyWarningRail canOpen={canSee(clearance, "restricted")} className={cn("xl:col-span-4", ROW_2_HEIGHT)} />

        </section>

        {/* Row 3 — who is in the system and what it has been doing. */}
        <section aria-label="Ranking and access" className={ROW_GRID}>
          <EvidenceHub className={cn("xl:col-span-6", ROW_3_HEIGHT)} />

          <RankLists total={total} className={cn("xl:col-span-6", ROW_3_HEIGHT)} />


          <Panel className={cn("xl:col-span-6", ROW_3_HEIGHT)}>
            <PanelHead title="Quick actions" action={<PanelLink href="/result-areas">See all</PanelLink>} />
            <ul className={cn(PANEL_BODY, "pb-4")}>
              {QUICK_ACTIONS.map((a) => {
                const inner = (
                  <>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={iconToneStyle(a.tone)}>
                      <a.Icon className="size-4 stroke-[1.75]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[13px] font-medium text-[var(--pms-text-strong)]">{a.title}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[var(--pms-muted-text)]" aria-hidden />
                  </>
                );
                const row = cn(
                  "flex w-full items-center gap-3 py-2 no-underline transition-colors hover:bg-[var(--pms-row-hover)]",
                  GUTTER,
                );
                return (
                  <li key={a.title}>
                    {a.href ? (
                      <Link href={a.href} className={row}>
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={row}
                        onClick={() => (a.act === "result" ? setEntryOpen(true) : openExport())}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className={cn("xl:col-span-6", ROW_3_HEIGHT)}>
            <PanelHead title="Welcome & orientation" action={<PanelLink href="/welcome">See all</PanelLink>} />
            <div className={PANEL_BODY}>
              <div className={GUTTER}>
                <Link
                  href="/welcome"
                  className="relative grid aspect-[16/7] w-full place-items-center overflow-hidden rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-segmented-track)] no-underline transition-colors hover:bg-[var(--pms-row-hover)]"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-[rgba(23,26,32,.42)] text-white backdrop-blur-[2px]">
                    <iconify-icon icon="solar:play-bold" className="text-[22px]" />
                  </span>
                </Link>
              </div>

              <div className={cn("pt-3", GUTTER)}>
                <p className="text-[13px] font-semibold text-[var(--pms-text-strong)]">Tutorial introduction</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--pms-muted-text)]">4 min · what the system measures, and what it never does</p>
              </div>

              <div className={cn("mt-auto flex flex-wrap gap-2 pb-5 pt-4", GUTTER)}>
                <Link href="/welcome" className={GHOST_BUTTON}>
                  Watch tutorial
                  <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
                </Link>
                <Link href="/support" className={GHOST_BUTTON}>
                  Support
                  <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
                </Link>
              </div>
            </div>
          </Panel>



        </section>

      </div>
    </main>
  );
}
