import { clampTo, hasPeriodData, seededOffset } from "@/lib/coverage";
import { RESULT_AREAS } from "./resultAreas";

/** Composite 0–100 score per region, as filed for the platform's base period. */
export const REGION_SCORES: Record<string, number> = {
  awdal: 62, "woqooyi-galbeed": 70, togdheer: 58, sool: 34, sanaag: 41,
  bari: 66, nugaal: 72, mudug: 49, galgaduud: 55,
  hiiraan: 44, "middle-shabelle": 57, banadir: 68,
  bay: 61, bakool: 38, "lower-shabelle": 42,
  gedo: 36, "middle-juba": 22, "lower-juba": 53,
};

/** Districts that filed a return in the base period, per region (sums to 61 of 90). */
export const REGION_REPORTED: Record<string, number> = {
  awdal: 2, "woqooyi-galbeed": 2, togdheer: 2, sool: 1, sanaag: 1,
  bari: 5, nugaal: 3, mudug: 4, galgaduud: 4,
  hiiraan: 2, "middle-shabelle": 4, banadir: 13,
  bay: 5, bakool: 3, "lower-shabelle": 4,
  gedo: 3, "middle-juba": 0, "lower-juba": 3,
};

/* ---------------------------------------------------------------------------
   Everything below derives a period's and a region's figures from the seed
   data above with a stable offset. No randomness: the same filter always
   returns the same numbers, and switching Q1 → Q2 or All regions → Bay moves
   every one of them.
--------------------------------------------------------------------------- */

/** Region score for one period. `null` means no return was ever filed. */
export function regionScore(regionId: string, period: string): number | null {
  const base = REGION_SCORES[regionId];
  if (base === undefined || !hasPeriodData(period)) return null;
  return clampTo(base + seededOffset(`${regionId}|${period}|score`, 8));
}

/** The whole map's shading for one period, in one pass. */
export function regionScoresFor(period: string): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const id of Object.keys(REGION_SCORES)) out[id] = regionScore(id, period);
  return out;
}

/** Districts reporting from one region in one period. */
export function regionReportedFor(regionId: string, period: string): number | null {
  const base = REGION_REPORTED[regionId];
  if (base === undefined || !hasPeriodData(period)) return null;
  return Math.max(0, base + seededOffset(`${regionId}|${period}|reported`, 2));
}

export type ScopedArea = { id: string; score: number; trend: number; reported: number };

/** The pristine national figures, captured before any scope is applied. */
const BASE_AREAS: ScopedArea[] = RESULT_AREAS.map((r) => ({
  id: r.id,
  score: r.score,
  trend: r.trend,
  reported: r.reported,
}));

/** The nine result areas as they stand for one period in one region. */
export function scopedAreas(period: string, region: string): ScopedArea[] {
  return BASE_AREAS.map((b) => ({
    id: b.id,
    score: clampTo(b.score + seededOffset(`${b.id}|${period}|${region}|score`, 9)),
    trend: seededOffset(`${b.id}|${period}|${region}|trend`, 7),
    reported: clampTo(b.reported + seededOffset(`${b.id}|${period}|${region}|reported`, 11), 0, 90),
  }));
}

/**
 * Write the scoped figures back onto the shared result-area records. The stat
 * cards, the "progress vs last quarter" panel and the ranked lists all read
 * RESULT_AREAS, so one call moves all of them together; calling it again with
 * the same filter changes nothing, which keeps it safe to run during render.
 */
export function applyScope(period: string, region: string): void {
  const scoped = scopedAreas(period, region);
  RESULT_AREAS.forEach((area, i) => {
    area.score = scoped[i].score;
    area.trend = scoped[i].trend;
    area.reported = scoped[i].reported;
  });
}
