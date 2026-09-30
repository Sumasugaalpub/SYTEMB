"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NATIONAL_INDEXES, PUBLISHED_EDITION, publishedPoint, valueIn, type NationalIndex } from "@/data/nationalIndexes";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, PANEL_BODY, Panel, PanelHead } from "@/components/pms/dashboard-sections";
import { PageHeader, Pill, printPage, useExportDialog } from "@/components/pms/ui";
import { SkeletonBlock } from "@/components/system/Skeleton";

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

/** The workbook's own label for each position on the slider. */
const YEAR_LABEL: Record<number, string> = {
  2024: "Baseline",
  2025: "Achieved",
  2026: "Projected",
  2027: "Target",
  2028: "Target",
  2029: "Target",
};
const MIN_YEAR = YEARS[0];
const MAX_YEAR = YEARS[YEARS.length - 1];

/** Last year with a published FSI edition — everything after it is a projection. */
const LAST_PUBLISHED = Math.max(...NATIONAL_INDEXES[0].series.filter((p) => !p.projected).map((p) => p.year));

/** The dashboard's counter tile: 12px muted label, 20px bold value, tinted pill right. */
type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "accent";

function Tile({
  label,
  value,
  pill,
  tone = "info",
  icon,
  bar,
}: {
  label: string;
  value: string;
  pill?: string;
  tone?: Tone;
  icon?: string;
  bar?: number;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]">
      <div className="flex items-center gap-2">
        {icon ? (
          <span
            className="grid size-7 shrink-0 place-items-center rounded-[9px]"
            style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
          >
            <iconify-icon icon={icon} className="text-[15px]" />
          </span>
        ) : null}
        <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{label}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{value}</span>
        {pill ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
          >
            {pill}
          </span>
        ) : null}
      </div>
      {bar === undefined ? null : (
        <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(2, bar)}%`, backgroundColor: `var(--pms-icon-${tone}-fg)` }}
          />
        </span>
      )}
    </div>
  );
}

/** One row per index — the shape the workbook's table uses. */
type IndexRow = {
  id: string;
  index: string;
  code: string;
  baseline: number;
  published: number;
  publishedYear: number;
  y2027: number;
  y2028: number;
  y2029: number;
};

const INDEX_ROWS: IndexRow[] = NATIONAL_INDEXES.map((ix) => {
  const pub = publishedPoint(ix);
  return {
    id: ix.id,
    index: ix.name,
    code: ix.code,
    baseline: ix.baseline2024,
    published: pub.value,
    publishedYear: pub.year,
    y2027: valueIn(ix, 2027) ?? ix.target2029,
    y2028: valueIn(ix, 2028) ?? ix.target2029,
    y2029: valueIn(ix, 2029) ?? ix.target2029,
  };
});

function IndexPanel({ index, year, showProjections }: { index: NationalIndex; year: number; showProjections: boolean }) {
  const point = index.series.find((p) => p.year === year)!;
  const first = index.series[0].value;
  const progress = Math.max(0, Math.min(100, ((first - point.value) / (first - index.target2029)) * 100));
  const prev = index.series.find((p) => p.year === year - 1);
  const delta = prev ? point.value - prev.value : 0;
  const improving = delta < 0;

  // Two series over one x-axis: published years solid, projected years dotted.
  // The boundary year sits in both, so the dotted line starts where the solid one ends.
  const data = (showProjections ? index.series : index.series.filter((p) => !p.projected)).map((p) => ({
    year: p.year,
    published: p.projected ? null : p.value,
    projected: p.projected || p.year === LAST_PUBLISHED ? p.value : null,
  }));

  return (
    <Panel>
      <PanelHead
        title={`${index.name} (${index.code})`}
        action={<Pill tone={point.projected ? "warn" : "good"}>{point.projected ? point.label : "Published"}</Pill>}
      />
      <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile
            label={`${year} · score out of 10`}
            value={point.value.toFixed(2)}
            tone={prev ? (improving ? "success" : "danger") : "neutral"}
            icon="solar:chart-2-linear"
            pill={prev ? `${improving ? "−" : "+"}${Math.abs(delta).toFixed(2)}` : undefined}
          />
          <Tile
            label={`Baseline ${index.series[0].year} (${first}) → 2029 (${index.target2029})`}
            value={`${progress.toFixed(0)}%`}
            tone="info"
            icon="solar:target-linear"
            bar={progress}
          />
        </div>

        <div className="mt-3 rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-chart-well-bg)] px-3 pb-2 pt-4">
          <div className="h-[170px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={32}>
              <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${index.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--pms-chart-collected)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--pms-chart-collected)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--pms-chart-grid)" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--pms-chart-axis)", fontSize: 11 }} domain={[6, 11]} />
                <Tooltip
                  cursor={{ stroke: "var(--pms-chart-grid)", strokeDasharray: "3 3" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--pms-tooltip-border)",
                    background: "var(--pms-tooltip-bg)",
                    color: "var(--pms-tooltip-text)",
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <Area
                  type="monotone"
                  name="Published"
                  dataKey="published"
                  stroke="var(--pms-chart-collected)"
                  strokeWidth={2.25}
                  fill={`url(#grad-${index.id})`}
                  dot={{ r: 3, fill: "var(--pms-surface)", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                {showProjections ? (
                  <Area
                    type="monotone"
                    name="Projected"
                    dataKey="projected"
                    stroke="var(--pms-chart-collected)"
                    strokeWidth={2.25}
                    strokeDasharray="4 4"
                    fill={`url(#grad-${index.id})`}
                    fillOpacity={0.45}
                    dot={{ r: 3, fill: "var(--pms-surface)", strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--pms-muted-text)]">
              <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: "var(--pms-chart-collected)" }} />
              Published · {PUBLISHED_EDITION}
            </span>
            {showProjections ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--pms-muted-text)]">
                <span
                  className="h-[3px] w-4"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, var(--pms-chart-collected) 0 4px, transparent 4px 7px)",
                  }}
                />
                Projected · {index.target2029} by 2029
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-[11.5px] leading-[1.5] text-[var(--pms-muted-text)]">{index.description}</p>
      </div>
    </Panel>
  );
}

export default function NationalIndicators() {
  const [openExport, exportDialog] = useExportDialog();
  const [year, setYear] = React.useState(2025);
  const [showProjections, setShowProjections] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const maxYear = showProjections ? MAX_YEAR : LAST_PUBLISHED;
  const projectedYear = year > LAST_PUBLISHED;

  function toggleProjections(next: boolean) {
    setShowProjections(next);
    if (!next && year > LAST_PUBLISHED) setYear(LAST_PUBLISHED);
  }

  const fall = (from: number, to: number) => to < from;

  const indexColumns: Column<IndexRow>[] = [
    {
      key: "index",
      header: "Index",
      value: (r) => `${r.index} (${r.code})`,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-[9px] text-[11px] font-bold"
            style={{ backgroundColor: "var(--pms-icon-info-bg)", color: "var(--pms-icon-info-fg)" }}
          >
            {r.code}
          </span>
          <span className="min-w-0 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{r.index}</span>
        </span>
      ),
    },
    { key: "baseline", header: "2024 baseline", value: (r) => r.baseline, align: "right", cell: (r) => r.baseline.toFixed(1) },
    {
      key: "published",
      header: "Latest published",
      value: (r) => r.published,
      align: "right",
      cell: (r) => (
        <span className="inline-flex items-center justify-end gap-1.5">
          <b className="tabular-nums">{r.published.toFixed(1)}</b>
          <span className="text-[11px] text-[var(--pms-muted-text)]">FSI {r.publishedYear}</span>
        </span>
      ),
    },
    ...([
      ["y2027", "2027", (r: IndexRow) => r.y2027],
      ["y2028", "2028", (r: IndexRow) => r.y2028],
      ["y2029", "2029 target", (r: IndexRow) => r.y2029],
    ] as const).map(([key, header, get]) => ({
      key,
      header,
      align: "right" as const,
      value: (r: IndexRow) => get(r),
      cell: (r: IndexRow) => (
        <span
          className="inline-flex items-center justify-end gap-1 tabular-nums"
          style={{ color: fall(r.published, get(r)) ? "var(--pms-icon-success-fg)" : "var(--pms-text)" }}
        >
          <iconify-icon icon={fall(r.published, get(r)) ? "solar:alt-arrow-down-linear" : "solar:alt-arrow-up-linear"} className="text-[13px]" />
          {get(r).toFixed(2)}
        </span>
      ),
    })),
  ];

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="National indicators"
        meta="Lower is better. A falling score is progress."
        actions={<Pill tone="info">Latest published: {PUBLISHED_EDITION}</Pill>}
      />

      <Panel>
        <PanelHead
          title="Year"
          action={
            <span className="flex shrink-0 items-center gap-2">
              <b className="text-[20px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                {year}
              </b>
              <Pill tone={projectedYear ? "warn" : "good"}>{projectedYear ? "Projected" : "Published"}</Pill>
            </span>
          }
        />
        <div className={cn(GUTTER, "flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:gap-6")}>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              type="range"
              min={MIN_YEAR}
              max={maxYear}
              step={1}
              value={year}
              disabled={maxYear === MIN_YEAR}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Year"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--pms-segmented-track)] accent-[var(--pms-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex justify-between gap-1 text-[11px]">
              {YEARS.map((y) => (
                <span
                  key={y}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-0.5",
                    y === year
                      ? "font-semibold text-[var(--pms-text-strong)]"
                      : y > maxYear
                        ? "text-[var(--pms-muted-text)] opacity-40"
                        : "text-[var(--pms-muted-text)]",
                  )}
                >
                  <span className="tabular-nums">{y}</span>
                  <span className="truncate text-[10px] font-medium uppercase tracking-[0.04em]">{YEAR_LABEL[y]}</span>
                </span>
              ))}
            </div>
          </div>

          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--pms-text)]">
            <input
              type="checkbox"
              checked={showProjections}
              onChange={(e) => toggleProjections(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[var(--pms-primary)]"
            />
            Show projections
          </label>
        </div>
      </Panel>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-2">
          <SkeletonBlock height={380} />
          <SkeletonBlock height={380} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-2">
          {NATIONAL_INDEXES.map((ix) => (
            <IndexPanel key={ix.id} index={ix} year={year} showProjections={showProjections} />
          ))}
        </div>
      )}

      <Panel>
        <PanelHead title="The two indexes" className="pb-0" />
        <DataTable
          rows={INDEX_ROWS}
          columns={indexColumns}
          loading={loading}
          pageSize={5}
          exportName="national-indexes"
          searchPlaceholder="Search index…"
          empty="No values to show"
        />
        <p className="border-t border-[color:var(--pms-divide)] px-5 py-3 text-[11px] leading-[1.5] text-[var(--pms-muted-text)] sm:px-6">
          Fragile States Index, Fund for Peace · latest published edition {PUBLISHED_EDITION} · 2025 onward are workbook
          projections.
        </p>
      </Panel>
    </div>
  );
}
