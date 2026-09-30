import { cn } from "@/lib/utils";
import { fmtPeriod } from "@/lib/format";
import type { Quality } from "@/data/indicators";
import { QualityTag } from "./QualityTag";

/**
 * The most reused component. Every number on screen carries one.
 * → 61 of 90 districts reported · District Returns · Q1 2026 · Verified
 */
export function ProvenanceLine({ reported, total, source, period, quality, unit = "districts", className }: {
  reported: number; total: number; source: string; period: string; quality: Quality; unit?: string; className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-[var(--inv-muted)]", className)}>
      <iconify-icon icon="solar:info-circle-linear" className="text-[12px] text-[var(--inv-muted2)]" />
      <span><b className="text-[var(--inv-title)]">{reported} of {total}</b> {unit} reported</span>
      <span>·</span>
      <span>{source}</span>
      <span>·</span>
      <span>{fmtPeriod(period)}</span>
      <span>·</span>
      <QualityTag quality={quality} bare />
    </div>
  );
}
