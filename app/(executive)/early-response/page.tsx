"use client";

import * as React from "react";

import { BreakGlass } from "@/components/system/BreakGlass";

import { ALERTS, type Alert } from "@/data/alerts";
import { REGIONS } from "@/data/geography";
import { TIMELINE } from "@/data/timeline";
import { ENTITY } from "@/lib/entities";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/pms/DataTable";
import { Panel, PanelHead } from "@/components/pms/dashboard-sections";
import { NoData, PageHeader, Pill, type PillTone, printPage } from "@/components/pms/ui";

const TODAY = TIMELINE.today.slice(0, 10);
const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? id;
const days = (from: string, to: string) =>
  Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));

type Row = Alert & { lastAction: string; lastAt: string; age: number; late: boolean };

/** Counter tile — the dashboard's mini-card. */
function Tile({ icon, tone, label, value, pill }: { icon: string; tone: string; label: string; value: string; pill: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]">
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-[9px]"
          style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
        >
          <iconify-icon icon={icon} className="text-[15px]" />
        </span>
        <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{label}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{value}</span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
          style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
        >
          {pill}
        </span>
      </div>
    </div>
  );
}

/** Page 10b — the response half of EWERS: who owns an alert and what they did. */
function EarlyResponseBody() {
  const stored = useCollection<Alert>(ENTITY.alerts, ALERTS);
  const alerts = stored.length ? stored : ALERTS;

  const rows: Row[] = alerts.map((a) => {
    const last = a.actions[a.actions.length - 1];
    return {
      ...a,
      lastAction: last?.text ?? "",
      lastAt: last?.at ?? "",
      age: days(a.opened, a.closed ?? TIMELINE.today),
      late: a.status !== "closed" && a.due < TODAY,
    };
  });

  const responded = rows.filter((r) => r.actions.length > 0).length;
  const overdue = rows.filter((r) => r.late).length;
  const closed = rows.filter((r) => r.status === "closed");
  const avgDays = closed.length ? Math.round(closed.reduce((a, c) => a + c.age, 0) / closed.length) : 0;
  const owned = rows.filter((r) => r.owner).length;
  const share = (n: number) => `${rows.length ? Math.round((n / rows.length) * 100) : 0}%`;

  const tone = (r: Row): PillTone => (r.status === "closed" ? "good" : r.late ? "bad" : "warn");

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <PageHeader
        title="Early response"
        meta="Every alert, its named owner, and what was actually done about it."
        onPrint={printPage}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Tile icon="solar:check-circle-linear" tone="success" label="Alerts responded to" value={String(responded)} pill={share(responded)} />
        <Tile icon="solar:bell-bing-linear" tone="danger" label="Overdue" value={String(overdue)} pill={share(overdue)} />
        <Tile icon="solar:stopwatch-linear" tone="info" label="Average days to close" value={String(avgDays)} pill={`${closed.length} closed`} />
        <Tile icon="solar:user-check-rounded-linear" tone="accent" label="With a named owner" value={String(owned)} pill={share(owned)} />
      </div>

      <Panel>
        <PanelHead title="Response register" className="pb-0" />
        <DataTable
          rows={rows}
          columns={[
            {
              key: "id",
              header: "Reference",
              value: (r) => r.id,
              width: "128px",
              cell: (r) => (
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: r.late ? "var(--pms-icon-danger-fg)" : "var(--pms-icon-neutral-fg)" }}
                    aria-hidden
                  />
                  <span className={cn("font-mono text-[12px]", r.late && "font-semibold text-[var(--pms-icon-danger-fg)]")}>
                    {r.id}
                  </span>
                </span>
              ),
            },
            {
              key: "area",
              header: "Area",
              value: (r) => `${r.district} · ${regionName(r.region)}`,
              cell: (r) => (
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{r.district}</span>
                  <span className="truncate text-[11px] text-[var(--pms-muted-text)]">{regionName(r.region)}</span>
                </span>
              ),
            },
            {
              key: "owner",
              header: "Owner",
              value: (r) => r.owner || "—",
              cell: (r) =>
                r.owner ? (
                  <span className="text-[12.5px] font-semibold text-[var(--pms-text-strong)]">{r.owner}</span>
                ) : (
                  <span className="text-[var(--pms-muted-text)]">—</span>
                ),
            },
            {
              key: "due",
              header: "Due",
              value: (r) => r.due,
              cell: (r) => (
                <span
                  className="text-[12px] tabular-nums"
                  style={r.late ? { color: "var(--pms-icon-danger-fg)", fontWeight: 600 } : undefined}
                >
                  {fmtDate(r.due)}
                </span>
              ),
            },
            {
              key: "action",
              header: "Last action",
              value: (r) => r.lastAction,
              cell: (r) =>
                r.lastAction ? (
                  <span className="flex max-w-[320px] flex-col">
                    <span className="truncate text-[12.5px] text-[var(--pms-text)]" title={r.lastAction}>{r.lastAction}</span>
                    <span className="truncate text-[11px] text-[var(--pms-muted-text)]">{fmtDateTime(r.lastAt)}</span>
                  </span>
                ) : (
                  <NoData label="No action recorded" />
                ),
            },
            {
              key: "age",
              header: "Days open",
              value: (r) => r.age,
              align: "right",
              cell: (r) => (
                <span className="tabular-nums" style={r.late ? { color: "var(--pms-icon-danger-fg)", fontWeight: 600 } : undefined}>
                  {r.age}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              value: (r) => (r.status === "closed" ? "closed" : r.late ? "overdue" : r.status),
              cell: (r) => <Pill tone={tone(r)}>{r.status === "closed" ? "closed" : r.late ? "overdue" : r.status}</Pill>,
            },
          ]}
        />
      </Panel>
    </div>
  );
}

export default function EarlyResponsePage() {
  return (
    <BreakGlass page="early-response">
      <EarlyResponseBody />
    </BreakGlass>
  );
}
