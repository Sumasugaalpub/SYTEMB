"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendSeries = { key: string; name: string; color: string; dashed?: boolean };
/** Extra fields from the same row to show in the tooltip — coverage, notes, anything. */
export type TrendMeta = { key: string; label: string; suffix?: string };

function TrendTooltip({
  active,
  payload,
  label,
  series,
  meta,
}: {
  active?: boolean;
  payload?: { payload: Record<string, string | number | null> }[];
  label?: string | number;
  series: TrendSeries[];
  meta: TrendMeta[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-[10px] border border-[var(--inv-card-border)] bg-[var(--inv-card)] px-3 py-2 text-[12px] shadow-[0_10px_24px_rgba(16,24,40,.14)]">
      <div className="font-bold text-[var(--inv-value)]">{label}</div>
      {series.map((s) => (
        <div key={s.key} style={{ color: s.color }}>
          {s.name}: <b className="tabular-nums">{row[s.key] ?? "—"}</b>
        </div>
      ))}
      {meta.map((m) => (
        <div key={m.key} className="text-[var(--inv-muted)]">
          {m.label}: <span className="tabular-nums">{row[m.key] ?? "—"}</span>
          {m.suffix ?? ""}
        </div>
      ))}
    </div>
  );
}

export function TrendLine({
  data,
  series,
  height = 220,
  xKey = "label",
  meta,
}: {
  data: Record<string, string | number | null>[];
  series: TrendSeries[];
  height?: number;
  xKey?: string;
  meta?: TrendMeta[];
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--inv-line)" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--inv-muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--inv-muted)" }} axisLine={false} tickLine={false} />
          {meta?.length ? (
            <Tooltip content={<TrendTooltip series={series} meta={meta} />} />
          ) : (
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--inv-card-border)", background: "var(--inv-card)", fontSize: 12 }} />
          )}
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.2} strokeDasharray={s.dashed ? "5 4" : undefined} dot={{ r: 3, strokeWidth: 0, fill: s.color }} activeDot={{ r: 5 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
