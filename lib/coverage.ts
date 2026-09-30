import { DISTRICT_STATUS, DISTRICTS, REGIONS, STATES } from "@/data/geography";
import { RESULT_AREAS, type ResultArea } from "@/data/resultAreas";
import { PERIODS } from "@/data/periods";
import { TIMELINE } from "@/data/timeline";

/** Coverage denominators are computed, never typed. 'all' → 90 · 'south-west' → 16 · 'bay' → 5. */
export function getDenominator(scope: string = "all"): number {
  if (scope === "all") return DISTRICTS.length;
  if (STATES.some((s) => s.id === scope)) return DISTRICTS.filter((d) => d.state === scope).length;
  if (REGIONS.some((r) => r.id === scope)) return DISTRICTS.filter((d) => d.region === scope).length;
  return DISTRICTS.length;
}

/** Scale a national "reported" count down to the filtered scope (demo data is national). */
export function scopedReported(reportedNational: number, scope: string = "all"): number {
  const total = getDenominator(scope);
  if (scope === "all") return reportedNational;
  return Math.min(total, Math.round((reportedNational / DISTRICTS.length) * total));
}

export function scopeLabel(scope: string = "all"): string {
  if (scope === "all") return "Somalia";
  return STATES.find((s) => s.id === scope)?.name ?? REGIONS.find((r) => r.id === scope)?.name ?? scope;
}

/* ---------------------------------------------------------------------------
   Deterministic scoping. Every figure the dashboard shows for a period and a
   region is derived from the seed data plus a stable offset keyed on that
   filter — the same filter always draws the same page, and no two filters draw
   the same one. Nothing here is random, so a re-render never moves a number.
--------------------------------------------------------------------------- */

/** FNV-1a. Same key in, same number out, in every render and on the server. */
export function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable signed offset in [-spread, +spread] for a key. */
export function seededOffset(key: string, spread: number): number {
  if (spread <= 0) return 0;
  return (seedOf(key) % (spread * 2 + 1)) - spread;
}

/** Stable fraction in [0, 1) for a key. */
export function seededUnit(key: string): number {
  return (seedOf(key) % 10000) / 10000;
}

/** Round a derived figure and hold it inside its scale. */
export function clampTo(value: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, Math.round(value)));
}

/**
 * The platform holds returns up to the quarter that is open. Anything later —
 * a future quarter, or any year past this one — has never been filed, so the
 * page shows the grey "no data received" block rather than a wall of zeros.
 */
export const LAST_DATA_PERIOD: string = PERIODS[PERIODS.length - 1]?.id ?? TIMELINE.periodOpen;

export function hasPeriodData(period: string): boolean {
  return period <= LAST_DATA_PERIOD;
}

/**
 * The reported numerator for a scope in a period. The denominator already
 * follows the region through `getDenominator`; this moves the numerator with
 * it, so coverage never reads "52 of 5".
 */
export function scopedReportedFor(
  reportedNational: number,
  scope: string = "all",
  period: string = LAST_DATA_PERIOD,
): number {
  const total = getDenominator(scope);
  if (!hasPeriodData(period)) return 0;
  const base = scope === "all" ? reportedNational : Math.round((reportedNational / DISTRICTS.length) * total);
  const drift = seededOffset(`${scope}|${period}|coverage`, Math.max(1, Math.round(total * 0.09)));
  return Math.max(0, Math.min(total, base + drift));
}

/**
 * The nine areas as they read for one region in one period. Scores, trends and
 * coverage all move with the filter, deterministically, so switching Q1 → Q2 or
 * All regions → Bay redraws the page without ever inventing a different answer
 * for the same selection.
 */
export type ScopedArea = ResultArea & { reportedScoped: number; total: number; hasData: boolean };

/** The quarter before this one, or null at the start of the series. */
export function periodBefore(period: string): string | null {
  const i = PERIODS.findIndex((p) => p.id === period);
  return i > 0 ? PERIODS[i - 1].id : null;
}

export function scopedAreas(scope: string = "all", period: string = LAST_DATA_PERIOD): ScopedArea[] {
  const live = hasPeriodData(period);
  const total = getDenominator(scope);

  // A region is the unit that reports. Everything above it — a state, or the
  // whole country — is the sum of its regions, so "All regions" is a real
  // aggregate and never a separate made-up number.
  const inScope =
    scope === "all"
      ? REGIONS
      : REGIONS.filter((r) => r.id === scope || r.state === scope);
  const units = inScope.length ? inScope : REGIONS;

  return RESULT_AREAS.map((ra) => {
    if (!live) {
      return { ...ra, score: 0, trend: 0, reportedScoped: 0, total, hasData: false };
    }

    const prev = periodBefore(period);
    let reported = 0;
    let weighted = 0;
    let weightedPrev = 0;

    for (const r of units) {
      const districts = DISTRICTS.filter((d) => d.region === r.id).length;
      const share = clampTo(
        45 + seededOffset(`${ra.id}|${r.id}|${period}|cov`, 45),
        0,
        100,
      );
      const regionReported = Math.round((districts * share) / 100);
      const regionScore = clampTo(ra.score + seededOffset(`${ra.id}|${r.id}|${period}|score`, 14));
      const regionPrev = prev
        ? clampTo(ra.score + seededOffset(`${ra.id}|${r.id}|${prev}|score`, 14))
        : regionScore;

      reported += regionReported;
      // Weight by districts that reported: a region that filed nothing cannot
      // pull the national figure.
      weighted += regionScore * regionReported;
      weightedPrev += regionPrev * regionReported;
    }

    const score = reported > 0 ? Math.round(weighted / reported) : 0;
    const prevScore = reported > 0 ? Math.round(weightedPrev / reported) : score;

    return {
      ...ra,
      score,
      trend: score - prevScore,
      reportedScoped: Math.min(total, reported),
      total,
      hasData: reported > 0,
    };
  });
}

/** National score for a scope and period — the mean of the nine scoped areas. */
export function scopedNationalScore(scope: string = "all", period: string = LAST_DATA_PERIOD): number | null {
  if (!hasPeriodData(period)) return null;
  const areas = scopedAreas(scope, period);
  return Math.round(areas.reduce((a, r) => a + r.score, 0) / areas.length);
}

/**
 * Districts that have ever filed a return. This is the national numerator for
 * coverage — it is counted from the district register, never typed in.
 */
export const REPORTING_DISTRICTS = Object.keys(DISTRICT_STATUS).length;

/**
 * Districts reported for a scope and a period, plus whatever has been filed to
 * this browser since. Never larger than the scope's denominator, and zero for a
 * period the platform holds nothing for.
 */
export function districtsReported(scope: string = "all", period: string = LAST_DATA_PERIOD, filedSince = 0): number {
  if (!hasPeriodData(period)) return 0;
  return clampTo(scopedReportedFor(REPORTING_DISTRICTS, scope, period) + filedSince, 0, getDenominator(scope));
}
