"use client";

import { useStore } from "@/lib/store";
import { mapBandsFor } from "@/lib/status";

/**
 * 6 bands incl. No Data (or 3 + No Data when switched). Pass `onSelect` to make
 * each band a filter — clicking a band shows only the regions inside it.
 */
export function MapLegend({
  active = null,
  onSelect,
}: {
  active?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const mode = useStore((s) => s.bandMode);
  const swatch = (b: { id: string; color: string }) => ({
    background: b.id === "none" ? `repeating-linear-gradient(45deg,${b.color} 0 2px,#eef0f4 2px 4px)` : b.color,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mapBandsFor(mode).map((b) =>
        onSelect ? (
          <button
            key={b.id}
            type="button"
            aria-pressed={active === b.id}
            onClick={() => onSelect(active === b.id ? null : b.id)}
            className="inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-1 text-[11.5px] transition-colors"
            style={{
              borderColor: active === b.id ? "var(--pms-primary)" : "transparent",
              backgroundColor: active === b.id ? "var(--pms-row-hover)" : "transparent",
              color: active === b.id ? "var(--pms-text-strong)" : "var(--inv-muted)",
            }}
          >
            <span className="size-[10px] rounded-[3px]" style={swatch(b)} />
            {b.label}
          </button>
        ) : (
          <span key={b.id} className="inline-flex items-center gap-1.5 px-2 py-1 text-[11.5px] text-[var(--inv-muted)]">
            <span className="size-[10px] rounded-[3px]" style={swatch(b)} />
            {b.label}
          </span>
        ),
      )}
      <span className="w-full text-[11px] text-[var(--inv-muted)]">
        Colour shows score, not political status.
      </span>
    </div>
  );
}

/** Sequential red scale for intensity choropleths — five steps, lightest first. */
export const HEAT_SCALE = ["#fcecea", "#f8c9c2", "#f09a90", "#df6259", "#b3241f"];

/** Maps a value against its maximum onto HEAT_SCALE. Zero always reads as the lightest step. */
export function heatColor(value: number, max: number): string {
  if (!(max > 0) || value <= 0) return HEAT_SCALE[0];
  const step = Math.ceil((value / max) * (HEAT_SCALE.length - 1));
  return HEAT_SCALE[Math.min(step, HEAT_SCALE.length - 1)];
}

/** Small ramp legend for a heat map. */
export function HeatLegend({ max, unit = "incidents" }: { max: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--pms-muted-text)]">
      <span>0</span>
      <span className="flex overflow-hidden rounded-[3px]">
        {HEAT_SCALE.map((c) => (
          <span key={c} className="h-[10px] w-[22px]" style={{ background: c }} />
        ))}
      </span>
      <span className="tabular-nums">{max}</span>
      <span>{unit}</span>
    </div>
  );
}
