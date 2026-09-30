export type BandMode = 3 | 6;
export type Band = { id: string; label: string; min: number; color: string; soft: string };

export const BANDS_3: Band[] = [
  { id: "good", label: "On track", min: 65, color: "#159a52", soft: "#e7f6ee" },
  { id: "watch", label: "Watch", min: 45, color: "#d98a06", soft: "#fdf3e1" },
  { id: "off", label: "Off track", min: 0, color: "#d94a4a", soft: "#fdecec" },
];

export const BANDS_6: Band[] = [
  { id: "excellent", label: "Excellent", min: 80, color: "#0f6b3f", soft: "#dff2e7" },
  { id: "good", label: "Good", min: 65, color: "#1f9266", soft: "#e7f5ee" },
  { id: "fair", label: "Fair", min: 50, color: "#8fb33a", soft: "#f1f6e3" },
  { id: "watch", label: "Watch", min: 35, color: "#d98a06", soft: "#fdf3e1" },
  { id: "poor", label: "Poor", min: 0, color: "#d94a4a", soft: "#fdecec" },
];

/** The sixth band — always last, always grey. */
export const NO_DATA: Band = { id: "none", label: "No data", min: -1, color: "#c5cad3", soft: "#eef0f4" };

export function bandsFor(mode: BandMode): Band[] {
  return mode === 3 ? [...BANDS_3, NO_DATA] : [...BANDS_6, NO_DATA];
}

export function bandOf(score: number | null | undefined, mode: BandMode): Band {
  if (score === null || score === undefined) return NO_DATA;
  const list = mode === 3 ? BANDS_3 : BANDS_6;
  return list.find((b) => score >= b.min) ?? list[list.length - 1];
}

/**
 * Map shading only. Colouring a Federal Member State red or green reads in
 * Somalia as taking sides, so the national map uses one hue, light to dark,
 * over the same thresholds as the cards.
 */
export const MAP_BANDS_3: Band[] = [
  { id: "good", label: "On track", min: 65, color: "#1f4a7a", soft: "#e8eef6" },
  { id: "watch", label: "Watch", min: 45, color: "#5b8cc4", soft: "#eef3fa" },
  { id: "off", label: "Off track", min: 0, color: "#bcd3ea", soft: "#f4f8fc" },
];

/** The six legend bands exactly as supplied, one blue hue from dark to light. */
export const MAP_BANDS_6: Band[] = [
  { id: "excellent", label: "80% and above", min: 80, color: "#123a63", soft: "#e6ecf4" },
  { id: "good", label: "70\u201379%", min: 70, color: "#22557f", soft: "#e9eff6" },
  { id: "fair", label: "60\u201369%", min: 60, color: "#3f7cae", soft: "#edf3f9" },
  { id: "watch", label: "50\u201359%", min: 50, color: "#7dabd6", soft: "#f1f6fb" },
  { id: "poor", label: "below 50%", min: 0, color: "#c2d8ee", soft: "#f5f9fd" },
];

/** Same grey as NO_DATA, labelled the way the supplied legend labels it. */
export const MAP_NO_DATA: Band = { ...NO_DATA, label: "no data" };

export function mapBandsFor(mode: BandMode): Band[] {
  return mode === 3 ? [...MAP_BANDS_3, MAP_NO_DATA] : [...MAP_BANDS_6, MAP_NO_DATA];
}

export function mapBandOf(score: number | null | undefined, mode: BandMode): Band {
  if (score === null || score === undefined) return NO_DATA;
  const list = mode === 3 ? MAP_BANDS_3 : MAP_BANDS_6;
  return list.find((b) => score >= b.min) ?? list[list.length - 1];
}

/** Submission status → Tag tone. */
export const SUB_TONE = { approved: "green", pending: "amber", returned: "red", draft: "neutral", missing: "violet" } as const;
