"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { NationalIndex } from "@/data/nationalIndexes";

/** Published points solid, projected points hollow + dashed. */
export function IndexChart({ index, year, height = 240 }: { index: NationalIndex; year?: number; height?: number }) {
  const lastPublished = [...index.series].reverse().find((p) => !p.projected)!.year;
  const data = index.series.map((p) => ({
    year: p.year,
    published: p.projected ? null : p.value,
    projected: p.projected || p.year === lastPublished ? p.value : null,
  }));
  const color = index.higherIsBetter ? "var(--inv-brand)" : "var(--inv-violet)";
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--inv-line)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--inv-muted)" }} axisLine={false} tickLine={false} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "var(--inv-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--inv-card-border)", background: "var(--inv-card)", fontSize: 12 }} />
          {year ? <ReferenceLine x={year} stroke="var(--inv-amber)" strokeDasharray="3 3" /> : null}
          <Line dataKey="published" name="Published" stroke={color} strokeWidth={2.4} dot={{ r: 4, fill: color, strokeWidth: 0 }} connectNulls={false} />
          <Line dataKey="projected" name="Projected" stroke={color} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4, fill: "var(--inv-card)", stroke: color, strokeWidth: 2 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
