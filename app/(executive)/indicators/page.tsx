"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { INDICATORS, type Indicator } from "@/data/indicators";
import { INSTITUTIONS } from "@/data/institutions";
import { RESULT_AREAS } from "@/data/resultAreas";
import { getDenominator } from "@/lib/coverage";
import { fmtValue } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GHOST_BUTTON, GUTTER, PANEL_BODY, Panel, PanelHead } from "@/components/pms/dashboard-sections";
import { PageHeader, Pill, type PillTone, printPage, useExportDialog } from "@/components/pms/ui";

const QUALITY_TONE: Record<Indicator["quality"], PillTone> = {
  verified: "good",
  provisional: "warn",
  estimated: "neutral",
};

const SELECT =
  "h-9 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-hairline-border)] bg-transparent px-2.5 text-[12.5px]";

export default function IndicatorsPage() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const params = useSearchParams();
  const region = useStore((s) => s.region);
  // Pages 5 and 6 link here with ?area=cl-0n — the filter opens on that area.
  const [area, setArea] = React.useState(() => {
    const from = params.get("area");
    return from && RESULT_AREAS.some((r) => r.id === from) ? from : "all";
  });
  const [withData, setWithData] = React.useState(false);
  const [withoutData, setWithoutData] = React.useState(false);
  const [open, setOpen] = React.useState<Indicator | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const total = getDenominator(region);

  const rows = INDICATORS.filter((k) => {
    if (area !== "all" && k.resultArea !== area) return false;
    if (withData && k.value === null) return false;
    if (withoutData && k.value !== null) return false;
    return true;
  });

  const areaName = (id: string) => RESULT_AREAS.find((r) => r.id === id)?.code ?? id;
  const directionOf = (k: Indicator) => (k.target >= k.baseline ? "Higher is better" : "Lower is better");

  const columns: Column<Indicator>[] = [
    {
      key: "id",
      header: "Code",
      value: (k) => k.id,
      cell: (k) => <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{k.id}</span>,
      width: "92px",
    },
    {
      key: "name",
      header: "Indicator",
      value: (k) => k.name,
      cell: (k) => <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{k.name}</span>,
    },
    { key: "area", header: "Area", value: (k) => areaName(k.resultArea), cell: (k) => <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{areaName(k.resultArea)}</span> },
    { key: "unit", header: "Unit", value: (k) => k.unit, cell: (k) => <span className="text-[12px] text-[var(--pms-muted-text)]">{k.unit}</span> },
    {
      key: "direction",
      header: "Direction",
      value: (k) => directionOf(k),
      cell: (k) => <Pill tone={k.target >= k.baseline ? "good" : "info"}>{k.target >= k.baseline ? "Higher" : "Lower"} is better</Pill>,
    },
    { key: "frequency", header: "Frequency", value: (k) => k.frequency, cell: (k) => <span className="text-[12px] text-[var(--pms-muted-text)]">{k.frequency}</span> },
    { key: "owner", header: "Institution", value: (k) => k.owner, cell: (k) => <span className="text-[12px] text-[var(--pms-muted-text)]">{k.owner}</span> },
    { key: "baseline", header: "Baseline", value: (k) => k.baseline, align: "right" },
    { key: "target", header: "Target", value: (k) => k.target, align: "right" },
    {
      key: "value",
      header: "Latest",
      value: (k) => k.value ?? "",
      align: "right",
      cell: (k) =>
        k.value === null ? (
          <span className="rounded-full bg-[var(--pms-segmented-track)] px-2 py-0.5 text-[11px] font-medium text-[var(--pms-muted-text)]">
            no data received
          </span>
        ) : (
          <b className="text-[13px] tabular-nums text-[var(--pms-text-strong)]">{fmtValue(k.value, k.unit)}</b>
        ),
    },
    {
      key: "coverage",
      header: "Coverage",
      value: (k) => k.reported,
      align: "right",
      width: "132px",
      cell: (k) => {
        const rep = Math.round((k.reported / 90) * total);
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
    { key: "quality", header: "Quality", value: (k) => k.quality, cell: (k) => <Pill tone={QUALITY_TONE[k.quality]}>{k.quality}</Pill> },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters onPrint={printPage} onExport={openExport} title="Indicators" meta={`${INDICATORS.length} indicators across nine result areas`} />

      {/* The count in the source workbook does not match its own categories. */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3 shadow-[var(--pms-card-shadow)]">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-[9px]"
          style={{ backgroundColor: "var(--pms-icon-warning-bg)", color: "var(--pms-icon-warning-fg)" }}
        >
          <iconify-icon icon="solar:danger-triangle-linear" className="text-[15px]" />
        </span>
        <p className="text-[12px] leading-[1.55] text-[var(--pms-text)]">
          The source document is titled 72 indicators; the categories total 73. The official list must be confirmed by
          the ministry before anything is built on it.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className={open ? "xl:col-span-8" : "xl:col-span-12"}>
          {/* Filter bar in the card header. */}
          <div className={cn("flex flex-wrap items-center gap-2.5 pb-3 pt-5", GUTTER)}>
            <h2 className="mr-auto text-[15px] font-semibold text-[var(--pms-text-strong)]">Indicator register</h2>

            <select aria-label="Result area" value={area} onChange={(e) => setArea(e.target.value)} className={SELECT}>
              <option value="all">All result areas</option>
              {RESULT_AREAS.map((r) => (
                <option key={r.id} value={r.id}>{r.code} — {r.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-[12px] text-[var(--pms-muted-text)]">
              With data
              <Switch checked={withData} onCheckedChange={(v) => { setWithData(v); if (v) setWithoutData(false); }} />
            </label>
            <label className="flex items-center gap-2 text-[12px] text-[var(--pms-muted-text)]">
              Without data
              <Switch checked={withoutData} onCheckedChange={(v) => { setWithoutData(v); if (v) setWithData(false); }} />
            </label>

            {area !== "all" ? (
              <button
                type="button"
                onClick={() => setArea("all")}
                className="text-[12px] font-medium text-[var(--pms-muted-text)] underline-offset-4 transition-colors hover:text-[var(--pms-text-strong)] hover:underline"
              >
                Clear area
              </button>
            ) : null}

            <span className="text-[12px] tabular-nums text-[var(--pms-muted-text)]">
              {rows.length} of {INDICATORS.length}
            </span>
          </div>

          <div className="border-t border-[color:var(--pms-divide)]" />

          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            pageSize={12}
            exportName="indicators"
            searchPlaceholder="Search indicator, code or institution…"
            onRowClick={(k) => setOpen(k)}
            empty="No indicators match those filters"
          />
        </Panel>

        {open ? (
          <Panel className="xl:col-span-4">
            <PanelHead
              title="Method sheet"
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
            <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
              <p className="font-mono text-[11px] text-[var(--pms-muted-text)]">{open.id}</p>
              <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-[var(--pms-text-strong)]">{open.name}</h3>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone={open.target >= open.baseline ? "good" : "info"}>
                  {open.target >= open.baseline ? "Higher" : "Lower"} is better
                </Pill>
                <Pill tone={QUALITY_TONE[open.quality]}>{open.quality}</Pill>
              </div>

              <dl className="mt-3 flex flex-col">
                {([
                  ["Definition", open.method],
                  ["Calculation", `Reported by ${open.frequency.toLowerCase()} district return, aggregated to the selected geography.`],
                  ["Data source", open.source],
                  ["Frequency", open.frequency],
                  ["Unit", open.unit],
                  ["Evidence required", "Yes — every reported result must link to at least one evidence item."],
                  ["Measurement level", "National · state · district"],
                  ["Breakdown", "Sex · age · geography · population group · data quality"],
                  ["Responsible institution", INSTITUTIONS.find((i) => i.acronym === open.owner)?.name ?? open.owner],
                  ["People count", open.peopleCount ? "Yes — counts below five are suppressed" : "No"],
                ] as const).map(([label, v]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-t border-[color:var(--pms-divide)] py-2.5 first:border-t-0">
                    <dt className="shrink-0 text-[12px] text-[var(--pms-muted-text)]">{label}</dt>
                    <dd className="min-w-0 text-right text-[12px] font-semibold leading-[1.5] text-[var(--pms-text-strong)]">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={GHOST_BUTTON} onClick={() => window.print()}>
                  Print sheet
                  <iconify-icon icon="solar:printer-minimalistic-linear" className="text-[15px]" />
                </button>
                <button type="button" className={GHOST_BUTTON} onClick={() => router.push(`/indicators/${open.id}`)}>
                  Full page
                  <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
                </button>
              </div>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
