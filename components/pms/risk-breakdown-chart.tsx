"use client";

import { useId } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Ported 1:1 from the PROHAPA cost-breakdown chart — same geometry, SPM data. */
const DATA = [
  {
    name: "Low risk",
    value: 38,
    color: "var(--pms-cost-maintenance)",
    toneBg: "var(--pms-cost-maintenance-soft)",
  },
  {
    name: "Moderate",
    value: 29,
    color: "var(--pms-cost-taxes)",
    toneBg: "var(--pms-cost-taxes-soft)",
  },
  {
    name: "Elevated",
    value: 14,
    color: "var(--pms-cost-repair)",
    toneBg: "var(--pms-cost-repair-soft)",
  },
  {
    name: "No data",
    value: 9,
    color: "var(--pms-cost-saving)",
    toneBg: "var(--pms-cost-saving-soft)",
  },
] as const;

const TOTAL = DATA.reduce((sum, row) => sum + row.value, 0);

const CHART_DATA = Array.from({ length: 28 }, (_, i) => {
  const t = i / 27;
  const wave = Math.sin(t * Math.PI * 2.2) * 0.12 + Math.sin(t * Math.PI * 5) * 0.06;
  const base = 0.45 + t * 0.3 + wave;
  return { x: i, y: Math.min(0.98, Math.max(0.18, base)) };
});

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { x?: number } }>;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload?.x ?? 0;
  const percent = Math.round(Number(payload[0]?.value ?? 0) * 100);

  return (
    <div className="rounded-lg border border-[color:var(--pms-tooltip-border)] bg-[var(--pms-tooltip-bg)] px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-[var(--pms-tooltip-text)]">Coverage: {percent}%</p>
      <p className="mt-0.5 text-[10px] font-medium text-[var(--pms-tooltip-muted)]">
        Point {point + 1}
      </p>
    </div>
  );
}

export function RiskBreakdownChart() {
  const lineColor = DATA[0].color;
  const areaGradientId = `risk-area-${useId().replace(/:/g, "")}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h3 className="text-lg font-bold tracking-tight text-[var(--pms-text-strong)]">
            District risk distribution
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pms-pill-success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--pms-pill-success-fg)]">
            <span className="flex size-4 items-center justify-center rounded-full bg-[var(--pms-pill-success-icon-bg)]">
              <Check className="size-2.5 text-[var(--pms-pill-success-fg)]" strokeWidth={2.5} aria-hidden />
            </span>
            On pace
          </span>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pms-primary)]/40"
        >
          See Details
          <ChevronDown className="size-4 opacity-80" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DATA.map((row) => {
          const pct = Math.round((row.value / TOTAL) * 100);
          return (
            <div
              key={row.name}
              className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]"
            >
              <p className="text-xs font-medium text-[var(--pms-muted-text)]">{row.name}</p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                  {row.value}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: row.color, backgroundColor: row.toneBg }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-chart-well-bg)] px-3 pb-2 pt-4">
        <div className="h-[120px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={32}>
            <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="x" hide />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                cursor={{ stroke: "var(--pms-chart-grid)", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={<TrendTooltip />}
                animationDuration={120}
              />
              <Area
                type="monotone"
                dataKey="y"
                stroke={lineColor}
                strokeWidth={2.25}
                fill={`url(#${areaGradientId})`}
                fillOpacity={1}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
