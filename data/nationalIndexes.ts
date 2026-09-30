export type IndexPoint = { year: number; value: number; projected: boolean; label: string };
export type NationalIndex = {
  id: "gg" | "fe";
  code: string;
  name: string;
  description: string;
  higherIsBetter: boolean;
  scale: string;
  baseline: number;
  /** The plan's 2024 baseline, which is not always the published FSI 2024 result. */
  baseline2024: number;
  target2029: number;
  source: string;
  series: IndexPoint[];
};

/**
 * GG = Group Grievance (Fragile States Index C3). FE = Factionalized Elites (C2).
 * Both are scored 0–10 and LOWER IS BETTER. The most recent published edition is
 * FSI 2024; 2025 onward in the ministry workbook are projections, not results.
 */
export const NATIONAL_INDEXES: NationalIndex[] = [
  {
    id: "gg",
    code: "C3",
    name: "Group Grievance",
    description: "Divisions between groups in society and their effect on access to services and participation.",
    higherIsBetter: false,
    scale: "0–10",
    baseline: 9,
    baseline2024: 8.7,
    target2029: 7.2,
    source: "Fragile States Index, Fund for Peace",
    series: [
      { year: 2024, value: 9, projected: false, label: "FSI 2024 published" },
      { year: 2025, value: 8.5, projected: true, label: "Projected" },
      { year: 2026, value: 8.06, projected: true, label: "Projected" },
      { year: 2027, value: 7.77, projected: true, label: "Target" },
      { year: 2028, value: 7.55, projected: true, label: "Target" },
      { year: 2029, value: 7.2, projected: true, label: "Target" },
    ],
  },
  {
    id: "fe",
    code: "C2",
    name: "Factionalized Elites",
    description: "Fragmentation of state institutions along clan, class or regional lines, and gridlock among ruling elites.",
    higherIsBetter: false,
    scale: "0–10",
    baseline: 10,
    baseline2024: 10,
    target2029: 8.7,
    source: "Fragile States Index, Fund for Peace",
    series: [
      { year: 2024, value: 10, projected: false, label: "FSI 2024 published" },
      { year: 2025, value: 9.7, projected: true, label: "Projected" },
      { year: 2026, value: 9.5, projected: true, label: "Projected" },
      { year: 2027, value: 9.2, projected: true, label: "Target" },
      { year: 2028, value: 8.9, projected: true, label: "Target" },
      { year: 2029, value: 8.7, projected: true, label: "Target" },
    ],
  },
];

export const PUBLISHED_EDITION = "FSI 2024";

/** The latest point that is a published result rather than a workbook projection. */
export function publishedPoint(ix: NationalIndex): IndexPoint {
  const published = ix.series.filter((p) => !p.projected);
  return published[published.length - 1] ?? ix.series[0];
}

/** The workbook figure for a given year, or undefined when that year is not in the series. */
export const valueIn = (ix: NationalIndex, year: number) => ix.series.find((p) => p.year === year)?.value;

/** The workbook figure for a year, and the year before it, for the change arrow. */
export function pointFor(ix: NationalIndex, year: number): { now: IndexPoint; prev?: IndexPoint } {
  const now = ix.series.find((p) => p.year === year) ?? publishedPoint(ix);
  return { now, prev: ix.series.find((p) => p.year === now.year - 1) };
}

/**
 * How far the index has travelled from its baseline to the 2029 target.
 * Both indexes fall as they improve, so progress grows as the value drops.
 */
export function progressToTarget(ix: NationalIndex, value: number): number {
  const span = ix.baseline - ix.target2029;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((ix.baseline - value) / span) * 100));
}
