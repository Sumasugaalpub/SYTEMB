"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Ported 1:1 from the PROHAPA rent-collection chart — same geometry, SPM data. */
const CHART_HEIGHT = 270;
const RECEIVED_BAR_COLOR = "var(--pms-chart-collected)";
const RECEIVED_BAR_HIGHLIGHT_COLOR = "var(--pms-chart-collected-strong)";

const DATA = [
  { state: "Banadir", received: 15, outstanding: 2 },
  { state: "South West", received: 13, outstanding: 3 },
  { state: "Puntland", received: 17, outstanding: 2 },
  { state: "Jubaland", received: 8, outstanding: 5 },
  { state: "Galmudug", received: 9, outstanding: 4 },
  { state: "Hirshabelle", received: 6, outstanding: 6 },
] as const;

/** Hoisted so recharts receives the same reference on every render. */
const ROWS = [...DATA];

type ReturnsRow = (typeof DATA)[number];

function RowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const received = Number(payload.find((p) => p.dataKey === "received")?.value ?? 0);
  const outstanding = Number(payload.find((p) => p.dataKey === "outstanding")?.value ?? 0);
  const total = received + outstanding;

  return (
    <div className="rounded-lg border border-[color:var(--pms-tooltip-border)] bg-[var(--pms-tooltip-bg)] px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-[var(--pms-tooltip-text)]">
        {received} of {total} districts
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-[var(--pms-tooltip-muted)]">{label}</p>
    </div>
  );
}

export function ReturnsCoverageChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      setChartWidth((prev) => (prev === w ? prev : Math.max(0, w)));
    };

    measure();
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[270px] w-full min-h-[270px] min-w-0"
      style={{ minHeight: CHART_HEIGHT }}
    >
      <div className="mb-3 flex items-center justify-center gap-8 text-xs font-medium text-[var(--pms-chart-legend)]">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[var(--pms-chart-collected)]" aria-hidden />
          Received
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[var(--pms-bar-pending)]" aria-hidden />
          Outstanding
        </span>
      </div>
      {chartWidth > 0 ? (
        <ResponsiveContainer width={chartWidth} height={CHART_HEIGHT} debounce={32}>
          <BarChart
            data={ROWS}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="24%"
          >
            <CartesianGrid vertical={false} stroke="var(--pms-chart-grid)" />
            <Tooltip cursor={{ fill: "transparent" }} content={<RowTooltip />} animationDuration={120} />
            <XAxis
              dataKey="state"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--pms-chart-axis)", fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--pms-chart-axis)", fontSize: 12 }}
              domain={[0, 20]}
              ticks={[0, 5, 10, 15, 20]}
              width={40}
            />
            <Bar
              dataKey="received"
              name="received"
              stackId="returns"
              fill={RECEIVED_BAR_COLOR}
              radius={[0, 0, 0, 0]}
              barSize={12}
            >
              {DATA.map((entry: ReturnsRow) => (
                <Cell
                  key={`received-${entry.state}`}
                  fill={
                    entry.state === "South West"
                      ? RECEIVED_BAR_HIGHLIGHT_COLOR
                      : RECEIVED_BAR_COLOR
                  }
                />
              ))}
            </Bar>
            <Bar
              dataKey="outstanding"
              name="outstanding"
              stackId="returns"
              fill="var(--pms-bar-pending)"
              radius={[7, 7, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full rounded-lg bg-[var(--pms-chart-placeholder)]" aria-hidden />
      )}
    </div>
  );
}
