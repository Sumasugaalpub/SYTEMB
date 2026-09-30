export type Period = { id: string; year: number; quarter: 1 | 2 | 3 | 4; label: string; start: string; end: string };

const QUARTER_START = ["01-01", "04-01", "07-01", "10-01"] as const;
const QUARTER_END = ["03-31", "06-30", "09-30", "12-31"] as const;

/** 2026-Q1 … 2033-Q4 — the full plan horizon. */
export const PERIODS: Period[] = Array.from({ length: 8 }, (_, y) => 2026 + y).flatMap((year) =>
  ([1, 2, 3, 4] as const).map((quarter) => ({
    id: `${year}-Q${quarter}`,
    year,
    quarter,
    label: `Q${quarter} ${year}`,
    start: `${year}-${QUARTER_START[quarter - 1]}`,
    end: `${year}-${QUARTER_END[quarter - 1]}`,
  })),
);

export const periodLabel = (id: string) => PERIODS.find((p) => p.id === id)?.label ?? id;
