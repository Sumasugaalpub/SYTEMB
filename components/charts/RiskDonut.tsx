"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type Slice = { name: string; value: number; color: string };

export function RiskDonut({ data, center, sub, size = 180 }: { data: Slice[]; center: string | number; sub?: string; size?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" stroke="var(--inv-card)" strokeWidth={2} paddingAngle={1}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--inv-card-border)", background: "var(--inv-card)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <div className="text-[26px] leading-none font-bold text-[var(--inv-value)]">{center}</div>
          {sub ? <div className="mt-1 text-[10.5px] font-bold tracking-[.06em] text-[var(--inv-muted2)] uppercase">{sub}</div> : null}
        </div>
      </div>
      <ul className="flex min-w-[140px] flex-col gap-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-[12.5px] text-[var(--inv-title)]">
            <span className="size-[9px] rounded-[3px]" style={{ background: d.color }} />
            <span className="flex-1">{d.name}</span>
            <b className="text-[var(--inv-value)] tabular-nums">{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
