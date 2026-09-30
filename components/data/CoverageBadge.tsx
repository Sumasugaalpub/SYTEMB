"use client";

import { useStore } from "@/lib/store";
import { getDenominator, scopedReported } from "@/lib/coverage";

/** "61 of 90 districts" — denominator always follows the region filter. */
export function CoverageBadge({ reported, scope }: { reported: number; scope?: string }) {
  const region = useStore((s) => s.region);
  const sc = scope ?? region;
  const total = getDenominator(sc);
  const n = scopedReported(reported, sc);
  const pct = Math.round((n / total) * 100);
  return (
    <span className="inline-flex items-center gap-2 rounded-[20px] bg-[#eef0f4] px-2.5 py-[3px] text-[11px] font-bold text-[var(--inv-title)] dark:bg-[#1c1d22]">
      <span className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white dark:bg-[#2a2d34]">
        <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--inv-brand)]" style={{ width: `${pct}%` }} />
      </span>
      {n} of {total} districts
    </span>
  );
}
