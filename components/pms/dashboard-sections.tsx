"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Link from "next/link";
import { toast } from "sonner";

import { TIMELINE } from "@/data/timeline";
import { ALERTS, INCIDENTS, type Alert, type Incident } from "@/data/alerts";
import { NATIONAL_INDEXES, pointFor, progressToTarget, publishedPoint, PUBLISHED_EDITION } from "@/data/nationalIndexes";
import { clampTo, scopedAreas, seededUnit } from "@/lib/coverage";

/** Counts follow the region and the period, deterministically. */
function scaleByFilter(base: number, scope: string, period: string, key: string): number {
  const factor = scope === "all" ? 1 : 0.25 + seededUnit(`${scope}|${key}`) * 0.5;
  const drift = 0.85 + seededUnit(`${scope}|${period}|${key}`) * 0.3;
  return clampTo(Math.round(base * factor * drift), 0, Number.MAX_SAFE_INTEGER);
}
import { ENTITY } from "@/lib/entities";
import { useRecords } from "@/lib/use-record";
import { useStore } from "@/lib/store";
import { EVIDENCE, EVIDENCE_GROUPS, evidenceGroupCount, type Evidence } from "@/data/evidence";
import { USERS, userGroup } from "@/data/users";
import { cn } from "@/lib/utils";
import { RiskDonut, type Slice } from "@/components/charts/RiskDonut";
import { IconChip } from "./ui";

/* ---------------------------------------------------------------------------
   Card furniture. Every block on the dashboard is the same object: a white
   surface, one hairline, a soft shadow, a 24px gutter, and a header that is a
   bold title on the left with one quiet action link on the right. Nothing
   explains itself in a sentence — the numbers do the talking.
--------------------------------------------------------------------------- */

/** The single small-uppercase label style used for band labels and sub-labels. */
export const LABEL_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]";

/** Body copy. One size across the whole page. */
export const BODY_CLASS = "text-[13px] leading-[1.55] text-[var(--pms-text)]";

const PANEL_CLASS =
  "rounded-[var(--pms-radius-card)] border border-[color:var(--pms-shell-card-border)] bg-[var(--pms-surface)] shadow-[var(--pms-card-shadow)]";

/** Horizontal gutter shared by every row inside a card, so text lines up edge to edge. */
export const GUTTER = "px-5 sm:px-6";

/** Scrolling body of a fixed-height card, so cards in a row stay the same height. */
/** Tinted tones cycled across counter tiles, in the reference's order. */
const TILE_TONE = ["success", "warning", "info", "accent", "neutral"] as const;

export const PANEL_BODY = "flex min-h-0 flex-1 flex-col";

/** One card. Related content is grouped inside it with quiet rules, never with more frames. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(PANEL_CLASS, "flex min-w-0 flex-col overflow-hidden", className)}>{children}</section>
  );
}

/** A hairline inside a card — the only separator used between groups. */
export function Rule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-px shrink-0 bg-[var(--pms-divide)]", className)} />;
}

/** Card heading: bold title left, one small muted action right. */
export function PanelHead({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center justify-between gap-3 pb-3 pt-5", GUTTER, className)}>
      <h2 className="min-w-0 truncate text-[15px] font-semibold text-[var(--pms-text-strong)]">{title}</h2>
      {action}
    </div>
  );
}

/** Sub-heading inside a card — same style as a band label, never larger. */
export function SubLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn(LABEL_CLASS, className)}>{children}</p>;
}

/** The one link style used for card actions. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] no-underline transition-colors hover:text-[var(--pms-text-strong)]"
    >
      {children}
    </Link>
  );
}

/** Outlined button used for the secondary links at the foot of a card. */
export const GHOST_BUTTON =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] px-3.5 text-[13px] font-medium text-[var(--pms-text)] no-underline transition-colors hover:bg-[var(--pms-row-hover)] [&_iconify-icon]:text-[var(--pms-muted-text)]";

/**
 * The four risk bands, counted from the alerts and incidents on record for the
 * chosen region and period rather than stated.
 */
function riskSlices(
  alerts: Alert[],
  incidents: Incident[],
  scale: (n: number, key: string) => number,
): Slice[] {
  const lvl = (l: Alert["level"]) => alerts.filter((a) => a.level === l).length;
  const st = (s: Incident["status"]) => incidents.filter((i) => i.status === s).length;
  return [
    { name: "High", value: scale(lvl("critical") + incidents.filter((i) => i.status === "ongoing" && i.fatalities > 0).length, "risk-high"), color: "var(--pms-icon-danger-fg)" },
    { name: "Medium", value: scale(lvl("warning") + incidents.filter((i) => i.status === "ongoing" && i.fatalities === 0).length, "risk-medium"), color: "var(--pms-icon-warning-fg)" },
    { name: "Low", value: scale(lvl("watch") + st("mediated"), "risk-low"), color: "var(--pms-icon-info-fg)" },
    { name: "Informational", value: scale(alerts.filter((a) => a.status === "closed").length + st("resolved"), "risk-info"), color: "var(--pms-muted-text)" },
  ];
}

/**
 * The two national indexes. Both fall as they improve, so the bar fills as the
 * score drops and the change arrow points down when things get better.
 */
/** One line per index, 2024 → 2029, both drawn on one area chart. */
const INDEX_LINE = ["var(--pms-chart-collected)", "var(--pms-bar-pending)"];

function indexSeries() {
  const years = NATIONAL_INDEXES[0].series.map((p) => p.year);
  return years.map((year) => {
    const row: Record<string, number> = { year };
    for (const ix of NATIONAL_INDEXES) {
      const point = ix.series.find((p) => p.year === year);
      if (point) row[ix.id] = point.value;
    }
    return row;
  });
}

export function NationalIndexRail({ className }: { className?: string }) {
  return (
    <Panel className={className}>
      <PanelHead
        title="National indicators"
        action={<PanelLink href="/national-indicators">See all</PanelLink>}
      />
      <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
        <div className="flex items-center gap-2.5 pb-3">
          <span className="text-[15px] font-bold tracking-tight text-[var(--pms-text-strong)]">Lower is better</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pms-pill-success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--pms-pill-success-fg)]">
            <span className="flex size-4 items-center justify-center rounded-full bg-[var(--pms-pill-success-icon-bg)]">
              <iconify-icon icon="solar:check-read-linear" className="text-[10px]" />
            </span>
            {PUBLISHED_EDITION}
          </span>
        </div>

        {/* Two mini-cards, then the shared projection well — the reference's
            cost-breakdown composition. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NATIONAL_INDEXES.map((ix) => {
            const pub = publishedPoint(ix);
            const { now, prev } = pointFor(ix, 2026);
            const progress = progressToTarget(ix, now.value);
            const change = prev ? Math.round((now.value - prev.value) * 100) / 100 : 0;
            const improving = change < 0;
            return (
              <div
                key={ix.id}
                className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]"
              >
                <p className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{ix.name}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                    {pub.value.toFixed(1)}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{
                      backgroundColor: improving ? "var(--pms-pill-success-bg)" : "var(--pms-icon-danger-bg)",
                      color: improving ? "var(--pms-pill-success-fg)" : "var(--pms-icon-danger-fg)",
                    }}
                  >
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-chart-well-bg)] px-3 pt-4 pb-2">
          <div className="h-[120px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={32}>
              <AreaChart data={indexSeries()} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  {NATIONAL_INDEXES.map((ix, i) => (
                    <linearGradient key={ix.id} id={`nix-${ix.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INDEX_LINE[i]} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={INDEX_LINE[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="year" hide />
                <YAxis hide domain={[6, 10.5]} />
                <Tooltip
                  cursor={{ stroke: "var(--pms-chart-grid)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  animationDuration={120}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--pms-tooltip-border)",
                    background: "var(--pms-tooltip-bg)",
                    fontSize: 12,
                  }}
                />
                {NATIONAL_INDEXES.map((ix, i) => (
                  <Area
                    key={ix.id}
                    type="monotone"
                    dataKey={ix.id}
                    name={ix.code}
                    stroke={INDEX_LINE[i]}
                    strokeWidth={2.25}
                    fill={`url(#nix-${ix.id})`}
                    fillOpacity={1}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5">
            {NATIONAL_INDEXES.map((ix, i) => {
              const { now } = pointFor(ix, 2026);
              return (
                <span key={ix.id} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--pms-muted-text)]">
                  <span className="size-2 rounded-full" style={{ backgroundColor: INDEX_LINE[i] }} />
                  {ix.code} · {now.value} → {ix.target2029} by 2029
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

const TAB_TRACK = "flex w-full gap-1 rounded-[10px] bg-[#f1f1f2] p-[3px] dark:bg-[#131416]";
const TAB_BUTTON =
  "flex-1 cursor-pointer rounded-[8px] border-none bg-transparent p-2 text-[12.5px] font-semibold text-[var(--inv-muted)] transition-[background-color,color] duration-[140ms] [font-family:inherit]";
const TAB_BUTTON_ON =
  "bg-white text-[var(--inv-value)] shadow-[0_1px_2px_rgba(16,24,40,.08)] dark:bg-[#212327] dark:shadow-none";

/** The Inventory dashboard's tab track, shared by every tabbed card here. */
export function TabTrack<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { k: T; l: string }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className={TAB_TRACK} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.k}
          type="button"
          role="tab"
          aria-selected={active === t.k}
          onClick={() => onChange(t.k)}
          className={cn(TAB_BUTTON, active === t.k && TAB_BUTTON_ON)}
        >
          {t.l}
        </button>
      ))}
    </div>
  );
}

export function EarlyWarningRail({ canOpen, className }: { canOpen: boolean; className?: string }) {
  const region = useStore((st) => st.region);
  const period = useStore((st) => st.period);
  const scaled = (n: number, key: string) => scaleByFilter(n, region, period, key);
  // Alerts and incidents as stored, narrowed to the region the page is filtered to.
  const allAlerts = useRecords<Alert>(ENTITY.alerts, ALERTS);
  const allIncidents = useRecords<Incident>(ENTITY.incidents, INCIDENTS);
  const alerts = region === "all" ? allAlerts : allAlerts.filter((a) => a.region === region);
  const incidents = region === "all" ? allIncidents : allIncidents.filter((i) => i.region === region);
  const risk = riskSlices(alerts, incidents, scaled);
  const high = alerts.filter((a) => a.level === "critical").length;
  const medium = scaled(alerts.filter((a) => a.level === "warning").length, "ew-medium");
  // Early response — the other half of EWERS. A warning nobody acted on is not a system.
  const responded = scaled(alerts.filter((a) => a.actions.length > 0).length, "ew-responded");
  const overdue = scaled(alerts.filter((a) => a.status !== "closed" && a.due < TIMELINE.today.slice(0, 10)).length, "ew-overdue");
  const closed = alerts.filter((a) => a.status === "closed");
  const avgDays = closed.length
    ? Math.round(
        closed.reduce((a, c) => a + (new Date(c.closed ?? c.due).getTime() - new Date(c.opened).getTime()) / 86400000, 0) /
          closed.length,
      )
    : 0;
  const [tab, setTab] = React.useState<"warning" | "response">("warning");

  const guard = (e: React.MouseEvent, what: string) => {
    if (!canOpen) {
      e.preventDefault();
      toast.error(`Restricted — your role cannot open ${what}`);
    }
  };

  return (
    <Panel className={className}>
      <PanelHead
        title="Early warning & response"
        action={
          <span className="flex shrink-0 items-center gap-2">
            <iconify-icon icon="solar:lock-keyhole-linear" className="text-[15px] text-[var(--pms-muted-text)]" />
            <Link
              href={canOpen ? "/early-warning" : "#"}
              onClick={(e) => guard(e, "early warning")}
              className="text-[12px] font-medium text-[var(--pms-muted-text)] no-underline transition-colors hover:text-[var(--pms-text-strong)]"
            >
              See all
            </Link>
          </span>
        }
      />

      <div className={PANEL_BODY}>
        <div className={cn("pb-3", GUTTER)}>
          <div className={TAB_TRACK} role="tablist">
            {([
              { k: "warning", l: "Early warning" },
              { k: "response", l: "Early response" },
            ] as const).map((t) => (
              <button
                key={t.k}
                type="button"
                role="tab"
                aria-selected={tab === t.k}
                onClick={() => setTab(t.k)}
                className={cn(TAB_BUTTON, tab === t.k && TAB_BUTTON_ON)}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {tab === "response" ? (
          <div className={cn("grid grid-cols-3 gap-2 pb-5", GUTTER)}>
            {[
              { n: responded, l: "Responded" },
              { n: overdue, l: "Overdue" },
              { n: avgDays, l: "Avg days" },
            ].map((c) => (
              <div key={c.l} className="rounded-[10px] bg-[var(--pms-segmented-track)] px-2.5 py-2.5">
                <p className="text-[24px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-stat-value)]">
                  {c.n}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-[var(--pms-muted-text)]">{c.l}</p>
              </div>
            ))}
          </div>
        ) : (
        <div className={cn("grid grid-cols-3 gap-2", GUTTER)}>
          {[
            { n: high, l: "High risk", tone: "danger" as const },
            { n: medium, l: "Medium", tone: "warning" as const },
            { n: incidents.length, l: "Incidents", tone: "neutral" as const },
          ].map((c) => (
            <div
              key={c.l}
              className="rounded-[10px] px-2.5 py-2.5"
              style={{ backgroundColor: `var(--pms-icon-${c.tone}-bg)`, color: `var(--pms-icon-${c.tone}-fg)` }}
            >
              <p className="text-[24px] font-bold leading-none tabular-nums tracking-tight">{c.n}</p>
              <p className="mt-1.5 text-[11px] font-medium">{c.l}</p>
            </div>
          ))}
        </div>
        )}

        <Rule />
        <div className={cn("py-5", GUTTER)}>
          <RiskDonut size={118} center={risk.reduce((a, r) => a + r.value, 0)} sub="alerts" data={risk} />
        </div>

        <div className={cn("mt-auto flex flex-wrap gap-2 pb-5 pt-3", GUTTER)}>
          <Link href={canOpen ? "/early-warning" : "#"} onClick={(e) => guard(e, "early warning")} className={GHOST_BUTTON}>
            Open early warning
            <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
          </Link>
          <Link
            href={canOpen ? "/conflict-intelligence" : "#"}
            onClick={(e) => guard(e, "conflict intelligence")}
            className={GHOST_BUTTON}
          >
            Conflict intelligence
            <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}


/**
 * Early response — the other half of EWERS. A warning nobody acted on is not a
 * system, so response stands beside early warning rather than inside it.
 */
export function EarlyResponseRail({ canOpen, className }: { canOpen: boolean; className?: string }) {
  const region = useStore((st) => st.region);
  const period = useStore((st) => st.period);
  const scaled = (n: number, key: string) => scaleByFilter(n, region, period, key);
  const allAlerts = useRecords<Alert>(ENTITY.alerts, ALERTS);
  const alerts = region === "all" ? allAlerts : allAlerts.filter((a) => a.region === region);
  const responded = scaled(alerts.filter((a) => a.actions.length > 0).length, "ew-responded");
  const overdue = scaled(alerts.filter((a) => a.status !== "closed" && a.due < TIMELINE.today.slice(0, 10)).length, "ew-overdue");
  const closedList = alerts.filter((a) => a.status === "closed");
  const avgDays = closedList.length
    ? Math.round(
        closedList.reduce(
          (a, c) => a + (new Date(c.closed ?? c.due).getTime() - new Date(c.opened).getTime()) / 86400000,
          0,
        ) / closedList.length,
      )
    : 0;
  const owned = scaled(alerts.filter((a) => a.owner).length, "ew-owned");

  return (
    <Panel className={className}>
      <PanelHead
        title="Early response"
        action={canOpen ? <PanelLink href="/early-warning">See all</PanelLink> : null}
      />
      <div className={PANEL_BODY}>
        <div className={cn("grid grid-cols-2 gap-2 pb-4", GUTTER)}>
          {[
            { n: responded, l: "Responded" },
            { n: overdue, l: "Overdue" },
            { n: avgDays, l: "Avg days to close" },
            { n: owned, l: "With a named owner" },
          ].map((c) => (
            <div key={c.l} className="rounded-[10px] bg-[var(--pms-segmented-track)] px-3 py-2.5">
              <p className="text-[24px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-stat-value)]">
                {c.n}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-[var(--pms-muted-text)]">{c.l}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function EvidenceHub({ className }: { className?: string }) {
  const region = useStore((st) => st.region);
  const period = useStore((st) => st.period);
  const [tab, setTab] = React.useState<"evidence" | "access">("evidence");
  const scaled = (n: number, key: string) => scaleByFilter(n, region, period, key);

  // Every counter is the library's own total for that group — archive plus
  // everything held live — so an upload moves the tile it belongs to.
  const library = useRecords<Evidence>(ENTITY.evidence, EVIDENCE);
  const counts = EVIDENCE_GROUPS.map((g) => ({
    icon: g.icon,
    n: scaled(evidenceGroupCount(g, library), `ev-${g.id}`),
    l: g.label,
    href: `/evidence?type=${g.filter}`,
  }));

  const count = (g: string) => scaled(USERS.filter((u) => userGroup(u) === g).length, `users-${g}`);
  const groups = [
    { icon: "solar:buildings-3-linear", l: "Federal", n: count("federal"), href: "/users?group=federal" },
    { icon: "solar:buildings-2-linear", l: "States", n: count("states"), href: "/users?group=states" },
    { icon: "solar:city-linear", l: "Banadir", n: count("banadir"), href: "/users?group=banadir" },
    { icon: "solar:home-2-linear", l: "Districts", n: count("districts"), href: "/users?group=districts" },
    { icon: "solar:users-group-rounded-linear", l: "Partners", n: count("partners"), href: "/users?group=partners" },
  ];

  const rows = tab === "evidence" ? counts : groups;

  return (
    <Panel className={className}>
      <PanelHead
        title={tab === "evidence" ? "Evidence & knowledge" : "System access"}
        action={<PanelLink href={tab === "evidence" ? "/evidence" : "/users"}>See all</PanelLink>}
      />
      <div className={PANEL_BODY}>
        <div className={cn("pb-3", GUTTER)}>
          <TabTrack
            tabs={[
              { k: "evidence", l: "Evidence" },
              { k: "access", l: "Access" },
            ] as const}
            active={tab}
            onChange={setTab}
          />
        </div>

        <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", GUTTER)}>
          {rows.map((r, i) => {
            const share = Math.round((r.n / Math.max(1, rows.reduce((a, x) => a + x.n, 0))) * 100);
            const tone = TILE_TONE[i % TILE_TONE.length];
            return (
              <Link
                key={r.l}
                href={r.href}
                className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 no-underline shadow-[var(--pms-card-shadow)] transition-colors hover:bg-[var(--pms-row-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-[9px]"
                    style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
                  >
                    <iconify-icon icon={r.icon} className="text-[15px]" />
                  </span>
                  <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{r.l}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                    {r.n.toLocaleString("en-US")}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
                  >
                    {share}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={cn("mt-auto flex flex-wrap gap-2 pb-5 pt-4", GUTTER)}>
          <Link href={tab === "evidence" ? "/evidence" : "/users"} className={GHOST_BUTTON}>
            {tab === "evidence" ? "Evidence library" : "Manage users"}
            <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
          </Link>
          <Link href={tab === "evidence" ? "/knowledge" : "/settings"} className={GHOST_BUTTON}>
            {tab === "evidence" ? "Knowledge hub" : "Roles & settings"}
            <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

export function RankLists({ total, className }: { total: number; className?: string }) {
  // CL-09 carries one indicator, so it is ranked nowhere — only in the grey strip below.
  const LOW_DATA_ID = "cl-09";
  const region = useStore((s) => s.region);
  const period = useStore((s) => s.period);
  const areas = scopedAreas(region, period);
  const scored = areas.filter((r) => r.id !== LOW_DATA_ID);
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3);
  const bottom = ranked.slice(-3).reverse();
  const lowData = areas.find((r) => r.id === LOW_DATA_ID);
  const [tab, setTab] = React.useState<"top" | "bottom">("top");
  return (
    <Panel className={className}>
      <PanelHead title="Result area ranking" action={<PanelLink href="/result-areas">See all</PanelLink>} />
      <div className={PANEL_BODY}>
        <div className={cn("pb-3", GUTTER)}>
          <TabTrack
            tabs={[
              { k: "top", l: "Top performing" },
              { k: "bottom", l: "Needing attention" },
            ] as const}
            active={tab}
            onChange={setTab}
          />
        </div>
        {[
          { key: "top", rows: top, tone: "good" },
          { key: "bottom", rows: bottom, tone: "bad" },
        ]
          .filter((block) => block.key === tab)
          .map((block) => (
          <React.Fragment key={block.key}>
            <ul className="flex flex-col">
              {block.rows.map((r, i) => {
                const tone = block.tone === "good" ? "success" : "danger";
                return (
                  <li key={r.id} className="border-t border-t-[var(--pms-divide)] first:border-t-0">
                    <Link
                      href={`/result-areas?area=${r.id}`}
                      className={cn(
                        "flex items-center gap-3 py-3 no-underline transition-colors hover:bg-[var(--pms-row-hover)]",
                        GUTTER,
                      )}
                    >
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-[9px] text-[12px] font-bold"
                        style={{
                          backgroundColor: `var(--pms-icon-${tone}-bg)`,
                          color: `var(--pms-icon-${tone}-fg)`,
                        }}
                      >
                        {i + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">
                          {r.name}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${Math.max(2, r.score)}%`, backgroundColor: `var(--pms-icon-${tone}-fg)` }}
                            />
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-[var(--pms-muted-text)]">
                            {r.reportedScoped}/{total}
                          </span>
                        </span>
                      </span>

                      <span className="shrink-0 text-[20px] font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                        {r.score}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </React.Fragment>
        ))}
        {lowData ? (
          <div className={cn("mt-auto flex items-center gap-2.5 pb-5 pt-4", GUTTER)}>
            <iconify-icon icon="solar:minus-circle-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
            <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--pms-muted-text)]">
              <b className="font-semibold text-[var(--pms-text)]">{lowData.name}</b> — one indicator, not ranked
            </span>
          </div>
        ) : (
          <div className="pb-4" />
        )}
      </div>
    </Panel>
  );
}
