"use client";

import * as React from "react";

import { PERIODS } from "@/data/periods";
import { REGIONS } from "@/data/geography";
import { TIMELINE } from "@/data/timeline";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CONTROL =
  "h-9 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] bg-[var(--pms-surface)] px-2.5 text-[12.5px] font-medium text-[var(--pms-text)] outline-none";

/**
 * As-at date, quarter, year, period code and region. These drive every figure
 * on the page they sit on, so they live with the page rather than in the global
 * bar — pages that carry no period or region data do not show them at all.
 */
export function ScopeFilters({ className }: { className?: string }) {
  const { region, period, asAt, setRegion, setPeriod, setAsAt } = useStore();
  const [year, quarter] = period.split("-");
  const setPart = (y: string, q: string) => setPeriod(`${y}-${q}`);

  return (
    <div className={cn("flex flex-wrap items-center gap-2 print:hidden", className)}>
      <label className="flex items-center gap-1.5 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] bg-[var(--pms-surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--pms-muted-text)]">
        <iconify-icon icon="solar:calendar-linear" className="text-[15px]" />
        <span className="sr-only">As at date</span>
        <input
          type="date"
          value={asAt}
          max={TIMELINE.today.slice(0, 10)}
          onChange={(e) => setAsAt(e.target.value || TIMELINE.today.slice(0, 10))}
          className="bg-transparent text-[12.5px] text-[var(--pms-text)] outline-none"
        />
      </label>

      <select aria-label="Quarter" className={CONTROL} value={quarter} onChange={(e) => setPart(year, e.target.value)}>
        {["Q1", "Q2", "Q3", "Q4"].map((q) => (
          <option key={q} value={q}>{q}</option>
        ))}
      </select>

      <select aria-label="Year" className={CONTROL} value={year} onChange={(e) => setPart(e.target.value, quarter)}>
        {[...new Set(PERIODS.map((p) => p.id.split("-")[0]))].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <span className="hidden rounded-[var(--pms-radius-control)] bg-[var(--pms-segmented-track)] px-2.5 py-1.5 font-mono text-[11.5px] text-[var(--pms-muted-text)] md:inline">
        {period}
      </span>

      <select aria-label="Region" className={cn(CONTROL, "max-w-40")} value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="all">All regions</option>
        {REGIONS.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </div>
  );
}
