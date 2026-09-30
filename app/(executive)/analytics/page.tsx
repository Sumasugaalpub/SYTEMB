"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { REGIONS, STATES } from "@/data/geography";
import { REGION_REPORTED, REGION_SCORES } from "@/data/regionStatus";
import { RESULT_AREAS } from "@/data/resultAreas";
import { roleById } from "@/data/users";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY, type ReportItem } from "@/lib/entities";
import { fmtPeriod } from "@/lib/format";
import { nextId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, Panel, PanelHead, Rule, TabTrack } from "@/components/pms/dashboard-sections";
import { CAPTION, Strip } from "@/components/pms/exec-kit";
import { PageHeader, printPage, useExportDialog } from "@/components/pms/ui";

type Mode = "states" | "periods" | "target";
const MODES = [
  { k: "states" as const, l: "States" },
  { k: "periods" as const, l: "Periods" },
  { k: "target" as const, l: "To target" },
];
const MODE_LABEL: Record<Mode, string> = {
  states: "Compare states",
  periods: "Compare periods",
  target: "Compare to target",
};

const QUARTERS = ["2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"];

type Row = { id: string; name: string; value: number; coverage: number; total: number };

export default function AnalyticsPage() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const { period, role } = useStore();
  const actor = roleById(role).name;
  const [mode, setMode] = React.useState<Mode>("states");
  const [states, setStates] = React.useState<string[]>(["south-west", "puntland", "hirshabelle"]);
  const [periods, setPeriods] = React.useState<string[]>(QUARTERS);

  const stateRows: Row[] = STATES.filter((s) => states.includes(s.id)).map((s) => {
    const rs = REGIONS.filter((r) => r.state === s.id);
    const total = rs.reduce((a, r) => a + r.districts.length, 0);
    const coverage = rs.reduce((a, r) => a + REGION_REPORTED[r.id], 0);
    const value = Math.round(rs.reduce((a, r) => a + REGION_SCORES[r.id], 0) / Math.max(1, rs.length));
    return { id: s.id, name: s.name, value, coverage, total };
  });

  const periodRows: Row[] = periods.map((p, i) => ({
    id: p,
    name: fmtPeriod(p),
    value: [64, 67, 71, 74][i % 4],
    coverage: [48, 55, 61, 68][i % 4],
    total: 90,
  }));

  const targetRows: Row[] = RESULT_AREAS.map((r) => ({
    id: r.id,
    name: r.name,
    value: r.score,
    coverage: r.reported,
    total: 90,
  }));

  const rows = mode === "states" ? stateRows : mode === "periods" ? periodRows : targetRows;

  function addToReport() {
    if (!rows.length) {
      toast.error("Nothing selected to add");
      return;
    }
    const modeLabel = MODE_LABEL[mode];
    const item: ReportItem = {
      id: nextId("ITM", 2026, 3),
      title: `Performance analytics — ${modeLabel}`,
      source: "analytics",
      summary: `${modeLabel} · ${rows.length} series · ${fmtPeriod(period)}`,
      rows: rows.map((r) => ({ label: r.name, value: r.value, note: `${r.coverage}/${r.total} districts` })),
      addedAt: new Date().toISOString(),
    };
    db.add<ReportItem>(ENTITY.reportItems, item);
    logAct({ actor, role, action: "report.stage", target: item.id, note: `${item.title} · ${item.summary}` });
    toast.success(`${item.id} staged for the report builder`);
    router.push("/reports");
  }

  const pcts = rows.map((r) => (r.coverage / r.total) * 100);
  const spread = pcts.length > 1 ? Math.max(...pcts) - Math.min(...pcts) : 0;
  const mismatch = spread > 15;

  const columns: Column<Row>[] = [
    { key: "name", header: mode === "periods" ? "Period" : mode === "states" ? "State" : "Result area", value: (r) => r.name, cell: (r) => <span className="font-semibold text-[var(--pms-text-strong)]">{r.name}</span> },
    { key: "value", header: mode === "target" ? "Score" : "Composite", value: (r) => r.value, align: "right", cell: (r) => <b className="text-[15px] tabular-nums text-[var(--pms-text-strong)]">{r.value}</b> },
    { key: "coverage", header: "Coverage", value: (r) => r.coverage, align: "right", cell: (r) => <span className="tabular-nums text-[var(--pms-muted-text)]">{r.coverage}/{r.total}</span> },
    { key: "pct", header: "Coverage %", value: (r) => Math.round((r.coverage / r.total) * 100), align: "right", cell: (r) => `${Math.round((r.coverage / r.total) * 100)}%` },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="Performance analytics"
        meta={`Comparisons for ${fmtPeriod(period)}`}
        actions={
          <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" onClick={addToReport}>
            Add to report
          </Button>
        }
      />

      <Panel>
        <PanelHead title={MODE_LABEL[mode]} action={<span className={CAPTION}>{fmtPeriod(period)}</span>} />

        <div className={cn("flex flex-col gap-3 pb-3", GUTTER)}>
          <TabTrack tabs={MODES} active={mode} onChange={setMode} />

          {mode === "states" ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {STATES.filter((s) => s.id !== "northern").map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-[12.5px] text-[var(--pms-text)]">
                  <Checkbox
                    checked={states.includes(s.id)}
                    onCheckedChange={(v) => setStates((prev) => (v ? [...prev, s.id] : prev.filter((x) => x !== s.id)))}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          ) : null}

          {mode === "periods" ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {QUARTERS.map((q) => (
                <label key={q} className="flex items-center gap-2 text-[12.5px] text-[var(--pms-text)]">
                  <Checkbox
                    checked={periods.includes(q)}
                    onCheckedChange={(v) => setPeriods((prev) => (v ? [...prev, q] : prev.filter((x) => x !== q)))}
                  />
                  {fmtPeriod(q)}
                </label>
              ))}
            </div>
          ) : null}

          {mismatch ? (
            <Strip tone="warning" icon="solar:danger-triangle-linear">
              Reporting coverage runs {Math.round(Math.min(...pcts))}% to {Math.round(Math.max(...pcts))}% — these are not directly comparable.
            </Strip>
          ) : null}

          <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-chart-well-bg)] px-2 pb-2 pt-4">
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={32}>
                {mode === "periods" ? (
                  <LineChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--pms-chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--pms-tooltip-border)", background: "var(--pms-tooltip-bg)", color: "var(--pms-tooltip-text)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="var(--pms-chart-collected)" strokeWidth={2.25} dot={{ r: 3 }} isAnimationActive={false} />
                  </LineChart>
                ) : (
                  <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--pms-chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={mode === "target" ? -25 : 0} height={mode === "target" ? 70 : 30} textAnchor={mode === "target" ? "end" : "middle"} />
                    <YAxis tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 10, border: "1px solid var(--pms-tooltip-border)", background: "var(--pms-tooltip-bg)", color: "var(--pms-tooltip-text)", fontSize: 12 }} />
                    <Bar dataKey="value" fill="var(--pms-chart-collected)" radius={[6, 6, 0, 0]} barSize={26} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <Rule />
        <p className={cn(CAPTION, "py-3", GUTTER)}>
          {rows.length} series · coverage shown against 90 districts · {fmtPeriod(period)}
        </p>
      </Panel>

      <Panel>
        <PanelHead title="Comparison table" />
        <DataTable rows={rows} columns={columns} pageSize={10} exportName={`analytics-${mode}`} searchPlaceholder="Search…" empty="Nothing selected" />
      </Panel>
    </div>
  );
}
