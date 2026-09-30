"use client";

import * as React from "react";
import Link from "next/link";

import { scopedAreas } from "@/lib/coverage";
import { useStore } from "@/lib/store";
import { bandOf, bandsFor, type BandMode } from "@/lib/status";
import { cn } from "@/lib/utils";
import { GUTTER } from "./dashboard-sections";

/** Each decision line points at the alert that raised it. */
export type AreaDecision = { text: string; alert: string };

/**
 * The nine result areas as one continuous field of tiles, not nine cards.
 * A single hairline grid separates them, so the set reads as one object: the
 * lead of the page. Identity comes from the icon, meaning from the number.
 *
 * Provenance that is the same for all nine (source, period, quality) lives on
 * one line under the whole set. A tile shows its own coverage only when that
 * coverage differs from the set's default, and the "Number detail" switch
 * still opens the full origin block on every tile.
 */
export function ResultAreaCards({
  detail,
  bandMode,
  total,
  period,
  quality = "Verified",
  source = "District Returns",
  decisions,
  defaultReported,
}: {
  detail: boolean;
  bandMode: BandMode;
  total: number;
  period: string;
  quality?: string;
  source?: string;
  decisions: Record<string, AreaDecision | undefined>;
  /** Coverage stated on the set's shared provenance line. */
  defaultReported?: number;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  // Three bars of three — nine areas split evenly, no ragged last cell.
  const region = useStore((st) => st.region);
  const storePeriod = useStore((st) => st.period);
  const areas = scopedAreas(region, storePeriod);
  const bars = [areas.slice(0, 3), areas.slice(3, 6), areas.slice(6)];
  return (
    <div className="flex flex-col gap-3">
      {bars.map((bar, barIndex) => (
    <div
      key={barIndex}
      className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--pms-radius-card)] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-hairline-border)] shadow-[var(--pms-stat-bar-shadow)] sm:grid-cols-2"
      style={{ gridTemplateColumns: `repeat(${bar.length}, minmax(0, 1fr))` }}
    >
      {bar.map((ra, cellIndex) => {
        const i = barIndex * 3 + cellIndex;
        const band = bandOf(ra.score, bandMode);
        const reported = ra.reportedScoped;
        const decision = decisions[ra.id];
        const coverageDiffers = defaultReported === undefined || reported !== defaultReported;
        return (
          <div
            key={ra.id}
            className="group relative flex min-w-0 flex-col bg-[var(--pms-stat-bar-bg)] px-6 py-5 transition-colors hover:bg-[var(--pms-row-hover)]"
          >
            {/* The tile itself — page 5, filtered to this area. */}
            <Link
              href={`/result-areas?area=${ra.id}`}
              aria-label={`${ra.name} — open result area`}
              className="absolute inset-0 z-0 no-underline"
            />

            <div className="pointer-events-none relative z-[1] flex min-w-0 flex-1 flex-col">
              {/* PROHAPA stat cell: circular tinted icon left, label · value · trend right. */}
              <div className="flex min-w-0 flex-1 flex-row items-start gap-4">
                <span
                  className="mt-[5px] flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--pms-icon-info-bg)", color: "var(--pms-icon-info-fg)" }}
                  aria-hidden
                >
                  <iconify-icon icon={ra.icon} className="text-[21px]" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-h-[34px] min-w-0 items-center">
                    <p className="m-0 min-w-0 truncate p-0 text-[12px] font-medium leading-[12px] text-[var(--pms-muted-text)]">
                      {i + 1} · {ra.name}
                    </p>
                  </div>
                  <p className="-mt-1 m-0 p-0 text-[24px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-stat-value)]">
                    {ra.score}
                  </p>
                  <p
                    className="mt-1.5 m-0 p-0 text-[11px] font-medium leading-[14px] tabular-nums"
                    style={{ color: ra.trend >= 0 ? "var(--pms-stat-trend-good)" : "var(--pms-stat-trend-bad)" }}
                  >
                    {ra.trend >= 0 ? "+" : "−"}
                    {Math.abs(ra.trend)} this quarter
                  </p>
                </div>
              </div>

              {/* One thin status line: band, coverage, and the origin block only when asked for. */}
              <div className="mt-2.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium">
                <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: band.color }} />
                <span className="shrink-0" style={{ color: band.color }}>{band.label}</span>
                {coverageDiffers ? (
                  <span className="truncate tabular-nums text-[var(--pms-muted-text)]">
                    · {reported}/{total}
                  </span>
                ) : null}
              </div>

              {detail ? (
                <p className="mt-1.5 text-[11px] leading-[1.35] text-[var(--pms-muted-text)]">
                  {reported}/{total} districts · {source} · {period} · {quality}
                </p>
              ) : null}

              {decision ? (
                <Link
                  href={`/early-warning?alert=${decision.alert}`}
                  onClick={stop}
                  className="pointer-events-auto mt-2 rounded-[6px] bg-[var(--pms-icon-warning-bg)] px-2 py-1 text-[11px] leading-[1.3] font-medium text-[var(--pms-icon-warning-fg)] no-underline hover:underline"
                >
                  ⚠ {decision.text}
                </Link>
              ) : null}

              <Link
                href={`/indicators?area=${ra.id}`}
                onClick={stop}
                className="pointer-events-auto absolute bottom-3 right-6 z-[2] text-[11px] font-medium text-[var(--pms-muted-text)] no-underline opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--pms-text-strong)] hover:underline"
              >
                Indicators
                <iconify-icon icon="solar:arrow-right-up-linear" className="text-[13px]" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
      ))}
    </div>
  );
}

/**
 * The band key. It reads as the footer of the result-area bar: the bands, the
 * one provenance line for the whole set, and the "Progress vs last quarter"
 * switch.
 */
export function BandKeyStrip({
  bandMode,
  onCompare,
  compareOpen = false,
  note,
}: {
  bandMode: BandMode;
  onCompare: () => void;
  compareOpen?: boolean;
  /** One short muted line naming where every figure on the bar came from. */
  note?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 py-3.5", GUTTER)}>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
        {bandsFor(bandMode).map((b) => (
          <span
            key={b.id}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${b.color}14`, color: b.color }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: b.color }} />
            {b.label}
            {b.min >= 0 ? ` ${b.min}+` : ""}
          </span>
        ))}
      </div>

      {note ? (
        <p className="min-w-0 flex-1 truncate text-[11px] text-[var(--pms-muted-text)]">{note}</p>
      ) : (
        <span className="flex-1" />
      )}

      <button
        type="button"
        onClick={onCompare}
        aria-expanded={compareOpen}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] bg-[var(--pms-surface)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]"
      >
        <iconify-icon icon="solar:graph-up-linear" className="text-[14px]" />
        Progress vs last quarter
        <iconify-icon
          icon={compareOpen ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
          className="text-[13px]"
        />
      </button>
    </div>
  );
}
