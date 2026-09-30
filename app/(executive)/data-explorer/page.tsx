"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { INDICATORS } from "@/data/indicators";
import { PERIODS } from "@/data/periods";
import { REGIONS, STATES } from "@/data/geography";
import { PROJECTS } from "@/data/projects";
import { REGION_REPORTED } from "@/data/regionStatus";
import { roleById } from "@/data/users";
import { logAct } from "@/lib/audit";
import { wait } from "@/lib/async";
import { getDenominator } from "@/lib/coverage";
import { db } from "@/lib/db";
import { ENTITY, type ReportItem } from "@/lib/entities";
import { nextId } from "@/lib/ids";
import { downloadCSV } from "@/lib/download";
import { fmtPeriod } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useStored } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonRows } from "@/components/system/Skeleton";
import { GUTTER, Panel, PanelHead, Rule, TabTrack } from "@/components/pms/dashboard-sections";
import { CAPTION, TOOLBAR_FIELD, Row as HairRow, Toolbar } from "@/components/pms/exec-kit";
import { EmptyState, PageHeader, printPage, useExportDialog } from "@/components/pms/ui";

/** The workbook's eleven breakdown dimensions. */
const DIMENSIONS = [
  { id: "level", label: "Reporting level", values: ["National", "Federal", "State", "Banadir", "Region", "District"] },
  { id: "project", label: "Project", values: PROJECTS.map((p) => p.id) },
  { id: "population", label: "Population group", values: ["Women", "Men", "Girls", "Boys", "Youth", "Elders", "Displaced"] },
  { id: "geography", label: "Geography", values: STATES.map((s) => s.name) },
  { id: "time", label: "Time", values: ["Baseline", "Quarter", "Year", "Cumulative"] },
  { id: "evidence", label: "Evidence", values: ["Report", "Dataset", "Survey", "Photo", "Video"] },
  { id: "result", label: "Result type", values: ["Output", "Outcome", "Impact", "Institutional capacity"] },
  { id: "quality", label: "Data quality", values: ["Complete", "Validated", "Verified", "Returned"] },
  { id: "contribution", label: "Contribution", values: ["Direct", "Contributing", "Shared"] },
  { id: "visibility", label: "Public visibility", values: ["Public", "Aggregated public", "Authorized", "Restricted"] },
  { id: "initiative", label: "Initiative", values: ["National Peace Education", "National Cohesion", "None"] },
] as const;

type SavedView = { id: string; indicator: string; geography: string; period: string; dimension: string };
type Row = { id: string; label: string; value: number; coverage: string };

const TH = "px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--pms-muted-text)] sm:px-6";
const TD = "px-5 py-2.5 text-[13px] text-[var(--pms-text)] sm:px-6";

export default function DataExplorer() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const role = useStore((s) => s.role);
  const actor = roleById(role).name;
  const saved = useStored<SavedView[]>("explorer_views", []);

  const [indicator, setIndicator] = React.useState(INDICATORS[0].id);
  const [geography, setGeography] = React.useState("all");
  const [period, setPeriod] = React.useState("2026-Q1");
  const [dimension, setDimension] = React.useState<string>(DIMENSIONS[0].id);
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [pivot, setPivot] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [tab, setTab] = React.useState<"table" | "chart">("table");

  const ind = INDICATORS.find((k) => k.id === indicator)!;
  const dim = DIMENSIONS.find((d) => d.id === dimension)!;
  const total = getDenominator(geography);

  async function run() {
    setRunning(true);
    setRows(null);
    await wait(700);
    const base = ind.value ?? ind.baseline;
    const out: Row[] = dim.values.slice(0, 8).map((v, i) => {
      const seed = (v.length * 7 + i * 13) % 23;
      const value = Math.max(0, Math.round(base * (0.6 + seed / 40)));
      const reported =
        geography === "all"
          ? Object.values(REGION_REPORTED).reduce((a, b) => a + b, 0)
          : REGION_REPORTED[geography] ?? total;
      return { id: `${v}-${i}`, label: v, value, coverage: `${Math.min(total, reported)} of ${total}` };
    });
    setRows(out);
    setRunning(false);
  }

  function download() {
    if (!rows) return;
    downloadCSV(
      [
        { Indicator: ind.name, Geography: geography, Period: fmtPeriod(period), Breakdown: dim.label, Source: ind.source },
        ...rows.map((r) => ({ [dim.label]: r.label, Value: r.value, Coverage: r.coverage })),
      ],
      `explorer-${ind.id}-${period}.csv`,
    );
    logAct({ actor, role, action: "explorer.download", target: ind.id, note: `${dim.label} · ${geography} · ${period}` });
    toast.success("CSV downloaded and recorded");
  }

  function addToReport() {
    if (!rows) return;
    const geoLabel =
      geography === "all"
        ? "All regions"
        : STATES.find((s) => s.id === geography)?.name ?? REGIONS.find((r) => r.id === geography)?.name ?? geography;
    const item: ReportItem = {
      id: nextId("ITM", 2026, 3),
      title: `${ind.id} — ${ind.name}`,
      source: "data-explorer",
      summary: `${dim.label} · ${geoLabel} · ${fmtPeriod(period)}`,
      rows: rows.map((r) => ({ label: r.label, value: r.value, note: `${r.coverage} districts` })),
      addedAt: new Date().toISOString(),
    };
    db.add<ReportItem>(ENTITY.reportItems, item);
    logAct({ actor, role, action: "report.stage", target: item.id, note: `${item.title} · ${item.summary}` });
    toast.success(`${item.id} staged for the report builder`);
    router.push("/reports");
  }

  function saveView() {
    const view: SavedView = { id: `VIEW-${saved.length + 1}`, indicator, geography, period, dimension };
    db.setOne("explorer_views", [view, ...saved]);
    toast.success("View saved");
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}
      <PageHeader filters onPrint={printPage} onExport={openExport} title="Data explorer" meta="Pull the numbers behind any figure, with their coverage attached." />

      <Panel>
        <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 pt-5", GUTTER)}>
          <h2 className="shrink-0 text-[15px] font-semibold text-[var(--pms-text-strong)]">Query</h2>
          <Toolbar className="w-full sm:ml-auto sm:w-auto">
            <select aria-label="Indicator" className={cn(TOOLBAR_FIELD, "w-full sm:w-[190px]")} value={indicator} onChange={(e) => setIndicator(e.target.value)}>
              {INDICATORS.map((k) => <option key={k.id} value={k.id}>{k.id} — {k.name}</option>)}
            </select>
            <select aria-label="Geography" className={cn(TOOLBAR_FIELD, "w-full sm:w-[150px]")} value={geography} onChange={(e) => setGeography(e.target.value)}>
              <option value="all">All regions (90 districts)</option>
              {STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select aria-label="Period" className={cn(TOOLBAR_FIELD, "w-full sm:w-[110px]")} value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <select aria-label="Breakdown" className={cn(TOOLBAR_FIELD, "w-full sm:w-[150px]")} value={dimension} onChange={(e) => setDimension(e.target.value)}>
              {DIMENSIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Toolbar>
        </div>
        <Rule />
        <div className={cn("flex flex-wrap gap-2 py-4", GUTTER)}>
          <Button className="h-9 rounded-[var(--pms-radius-control)]" disabled={running} onClick={run}>
            {running ? "Running…" : "Run"}
          </Button>
          <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => { setRows(null); setGeography("all"); setDimension(DIMENSIONS[0].id); }}>
            Reset
          </Button>
          <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" disabled={!rows} onClick={() => setPivot((p) => !p)}>
            Swap rows and columns
          </Button>
          <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" disabled={!rows} onClick={download}>
            Download CSV
          </Button>
          <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" disabled={!rows} onClick={saveView}>
            Save this view
          </Button>
          <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" disabled={!rows} onClick={addToReport}>
            Add to report
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHead
          title={pivot ? "Results — pivoted" : "Results"}
          action={rows ? <span className={CAPTION}>{rows.length} rows</span> : null}
        />
        {running ? (
          <div className={cn("pb-5", GUTTER)}><SkeletonRows rows={6} /></div>
        ) : !rows ? (
          <EmptyState icon="solar:database-linear" title="No query has run yet" hint="Choose an indicator and press Run." />
        ) : (
          <>
            <div className={cn("pb-3", GUTTER)}>
              <TabTrack
                tabs={[{ k: "table", l: "Table" }, { k: "chart", l: "Chart" }] as const}
                active={tab}
                onChange={setTab}
              />
            </div>

            {tab === "table" ? (
              <div className="min-w-0 overflow-x-auto">
                {pivot ? (
                  <table className="w-full min-w-[520px] border-collapse">
                    <tbody>
                      <tr className="border-b border-[color:var(--pms-divide)]">
                        <th className={cn(TH, "text-left")}>{dim.label}</th>
                        {rows.map((r) => <td key={r.id} className={cn(TD, "font-semibold text-[var(--pms-text-strong)]")}>{r.label}</td>)}
                      </tr>
                      <tr>
                        <th className={cn(TH, "text-left")}>Value</th>
                        {rows.map((r) => <td key={r.id} className={cn(TD, "tabular-nums")}>{r.value}</td>)}
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[420px] border-collapse">
                    <thead>
                      <tr className="border-y border-[color:var(--pms-divide)]">
                        {[dim.label, "Value", "Coverage"].map((h, i) => (
                          <th key={h} className={cn(TH, i ? "text-right" : "text-left")}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-[color:var(--pms-divide)] last:border-b-0">
                          <td className={cn(TD, "font-semibold text-[var(--pms-text-strong)]")}>{r.label}</td>
                          <td className={cn(TD, "text-right text-[15px] font-bold tabular-nums text-[var(--pms-text-strong)]")}>{r.value}</td>
                          <td className={cn(TD, "text-right tabular-nums text-[var(--pms-muted-text)]")}>{r.coverage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className={cn("pb-4", GUTTER)}>
                <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-chart-well-bg)] px-2 pb-2 pt-4">
                  <div className="h-[280px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={32}>
                      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--pms-chart-grid)" />
                        <XAxis dataKey="label" tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-20} height={52} textAnchor="end" />
                        <YAxis tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{ borderRadius: 10, border: "1px solid var(--pms-tooltip-border)", background: "var(--pms-tooltip-bg)", color: "var(--pms-tooltip-text)", fontSize: 12 }}
                        />
                        <Bar dataKey="value" fill="var(--pms-chart-collected)" radius={[6, 6, 0, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <Rule />
            <p className={cn(CAPTION, "py-3", GUTTER)}>
              {ind.name} · {rows[0].coverage} districts reported · {ind.source} · {fmtPeriod(period)} · {ind.quality}
            </p>
          </>
        )}
      </Panel>

      {saved.length ? (
        <Panel>
          <PanelHead title="Saved views" action={<span className={CAPTION}>{saved.length}</span>} />
          <ul className="flex flex-col pb-2">
            {saved.map((v) => (
              <HairRow
                key={v.id}
                icon="solar:bookmark-linear"
                tone="info"
                title={`${v.indicator} · ${DIMENSIONS.find((d) => d.id === v.dimension)?.label}`}
                meta={`${v.id} · ${v.geography} · ${fmtPeriod(v.period)}`}
                right={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-[var(--pms-radius-control)]"
                    onClick={() => { setIndicator(v.indicator); setGeography(v.geography); setPeriod(v.period); setDimension(v.dimension); toast("View restored — press Run"); }}
                  >
                    Load
                  </Button>
                }
              />
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
