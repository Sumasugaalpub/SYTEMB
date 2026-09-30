"use client";

import { useStore } from "@/lib/store";
import { bandOf } from "@/lib/status";

/** Dot + band label for a 0–100 score. Follows the 3/6-band switch in settings. */
export function StatusDot({ score, label = true }: { score: number | null; label?: boolean }) {
  const mode = useStore((s) => s.bandMode);
  const b = bandOf(score, mode);
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: b.color }}>
      <span className="size-2 rounded-full" style={{ background: b.color }} />
      {label ? b.label : null}
    </span>
  );
}
