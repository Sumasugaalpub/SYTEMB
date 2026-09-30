"use client";

import * as React from "react";

import { BreakGlass } from "@/components/system/BreakGlass";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { Alert, Incident } from "@/data/alerts";
import { REGIONS } from "@/data/geography";
import { roleById } from "@/data/users";
import { wait } from "@/lib/async";
import { createAlert } from "@/lib/alert-actions";
import { logAct } from "@/lib/audit";
import { ENTITY } from "@/lib/entities";
import { fmtDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { canSee } from "@/lib/visibility";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HeatLegend, heatColor } from "@/components/map/MapLegend";
import { SomaliaMap } from "@/components/map/SomaliaMap";
import { GUTTER, PANEL_BODY, Panel, PanelHead, Rule, TabTrack } from "@/components/pms/dashboard-sections";
import { EmptyState, PageHeader, Pill, printPage } from "@/components/pms/ui";
import { DemoBadge } from "@/components/system/DemoBadge";

type Pattern = {
  id: string;
  issue: string;
  districts: string[];
  direction: "rising" | "steady" | "falling";
  firstSeen: string;
  driver: string;
  clanSensitive: boolean;
};

const PATTERNS: Pattern[] = [
  { id: "PAT-01", issue: "Grazing corridor competition", districts: ["Berdale", "Dinsor", "Qansahdhere"], direction: "rising", firstSeen: "2026-02-14", driver: "Failed Gu' rains", clanSensitive: true },
  { id: "PAT-02", issue: "Water-point pressure", districts: ["Beledweyne", "Bulo Burte"], direction: "rising", firstSeen: "2026-03-02", driver: "Borehole failure", clanSensitive: false },
  { id: "PAT-03", issue: "Eviction and land tenure", districts: ["Afgoye", "Merca"], direction: "rising", firstSeen: "2026-01-20", driver: "Urban expansion", clanSensitive: true },
  { id: "PAT-04", issue: "Revenge cycles after mediation failure", districts: ["Luuq"], direction: "steady", firstSeen: "2025-11-08", driver: "Unpaid diya", clanSensitive: true },
  { id: "PAT-05", issue: "Checkpoint extortion", districts: ["Hudur"], direction: "falling", firstSeen: "2025-12-01", driver: "Road access", clanSensitive: false },
];

const DIR = {
  rising: { tone: "bad", icon: "solar:alt-arrow-up-linear", square: "danger" },
  steady: { tone: "warn", icon: "solar:minus-linear", square: "warning" },
  falling: { tone: "good", icon: "solar:alt-arrow-down-linear", square: "success" },
} as const;

const MAX_DISTRICTS = Math.max(...PATTERNS.map((p) => p.districts.length));

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** The dashboard links here with ?issue=PAT-01; a slug of the issue text resolves too. */
const patternFrom = (q: string | null) =>
  q ? PATTERNS.find((p) => p.id.toLowerCase() === q.toLowerCase() || slugify(p.issue) === slugify(q)) ?? null : null;

const regionOfDistrict = (name: string) => REGIONS.find((r) => r.districts.includes(name))?.id ?? null;
const homeRegionOf = (p: Pattern) => p.districts.map(regionOfDistrict).find(Boolean) ?? null;

function ConflictIntelligenceBody() {
  const router = useRouter();
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const clearance = roleById(role).clearance;
  const actor = roleById(role).name;
  const incidents = useCollection<Incident>(ENTITY.incidents);
  const alerts = useCollection<Alert>(ENTITY.alerts);
  // Trending issues on the dashboard link here with one pattern already open.
  const opened = patternFrom(params.get("issue"));
  const [open, setOpen] = React.useState<string | null>(opened?.id ?? null);
  const [focus, setFocus] = React.useState<string | null>(opened ? homeRegionOf(opened) : null);
  const [granted, setGranted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [tab, setTab] = React.useState<"patterns" | "drivers">("patterns");

  if (!canSee(clearance, "restricted")) {
    return (
      <EmptyState
        icon="solar:lock-keyhole-linear"
        title="Restricted"
        hint="Your role does not have access to conflict intelligence. Switch role in the top bar to view it."
      />
    );
  }


  /** Heat: pattern intensity per region — recorded incidents weighted by the patterns running there. */
  const patternsOf = (rid: string) =>
    PATTERNS.filter((p) => p.districts.some((d) => REGIONS.find((r) => r.districts.includes(d))?.id === rid));

  const heat = REGIONS.map((r) => {
    const pats = patternsOf(r.id);
    const n = incidents.filter((i) => i.region === r.id).length;
    return { id: r.id, name: r.name, n, patterns: pats, intensity: n + pats.reduce((a, p) => a + (p.direction === "rising" ? 3 : p.direction === "steady" ? 2 : 1), 0) };
  }).sort((a, b) => b.intensity - a.intensity);

  const heatById = Object.fromEntries(heat.map((h) => [h.id, h]));
  const max = Math.max(1, ...heat.map((h) => h.intensity));

  /** The map hands back a state id when that state has withheld district names. */
  function openFromMap(id: string) {
    const hit = REGIONS.find((r) => r.id === id) ? [id] : REGIONS.filter((r) => r.state === id).map((r) => r.id);
    const withPattern = hit.find((rid) => patternsOf(rid).length > 0) ?? hit[0];
    if (!withPattern) return;
    setFocus(withPattern);
    const pats = patternsOf(withPattern);
    if (!pats.length) {
      setOpen(null);
      toast(`${REGIONS.find((r) => r.id === withPattern)?.name} — no pattern recorded`);
      return;
    }
    setTab("patterns");
    setOpen(pats[0].id);
  }

  /** The incidents and alerts this pattern was read off — the records behind the shape. */
  const recordsOf = (p: Pattern) => ({
    incidents: incidents.filter((i) => p.districts.includes(i.district)).sort((a, b) => b.date.localeCompare(a.date)),
    alerts: alerts.filter((a) => p.districts.includes(a.district)).sort((a, b) => b.opened.localeCompare(a.opened)),
  });

  const drivers = [
    { label: "Resource competition", n: 41 },
    { label: "Land and tenure", n: 27 },
    { label: "Political contest", n: 14 },
    { label: "Revenge and diya", n: 11 },
    { label: "Displacement pressure", n: 7 },
  ];
  const driverTotal = drivers.reduce((a, d) => a + d.n, 0);

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <div className="flex items-center gap-2 rounded-[var(--pms-radius-card)] border border-[color:var(--pms-icon-danger-fg)] bg-[var(--pms-icon-danger-bg)] px-4 py-2">
        <iconify-icon icon="solar:lock-keyhole-linear" className="shrink-0 text-[15px] text-[var(--pms-icon-danger-fg)]" />
        <p className="min-w-0 text-[11.5px] font-semibold leading-[1.4] text-[var(--pms-icon-danger-fg)]">
          Restricted · every view is recorded · no exports · clan fields hidden until access is granted
        </p>
      </div>

      <PageHeader filters onPrint={printPage} exportDisabled title="Conflict intelligence" meta="Patterns and drivers across regions, not individual records." />

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-5">
          <PanelHead title="Heat by region" />
          <div className={PANEL_BODY}>
            <div className={GUTTER}>
              <SomaliaMap
                height={280}
                layers={{ basemap: true }}
                regionColor={(id) => heatColor(heatById[id]?.intensity ?? 0, max)}
                regionTooltip={(id) => [
                  `${heatById[id]?.n ?? 0} incidents · intensity ${heatById[id]?.intensity ?? 0}`,
                  heatById[id]?.patterns.length ? heatById[id].patterns.map((p) => p.issue).join(", ") : "No pattern recorded",
                ]}
                onSelectRegion={openFromMap}
              />
              <div className="pb-3 pt-3">
                <HeatLegend max={max} unit="intensity" />
              </div>
            </div>

            <Rule />

            <ul className="flex flex-col">
              {heat.slice(0, 8).map((h) => (
                <li key={h.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                  <button
                    type="button"
                    onClick={() => openFromMap(h.id)}
                    className={cn(
                      "flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-[var(--pms-row-hover)]",
                      GUTTER,
                      focus === h.id && "bg-[var(--pms-row-hover)]",
                    )}
                  >
                    <span className="size-7 shrink-0 rounded-[9px]" style={{ background: heatColor(h.intensity, max) }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{h.name}</span>
                      <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">
                        {h.n} incidents · {h.patterns.length} pattern{h.patterns.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <b className="shrink-0 text-[20px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                      {h.intensity}
                    </b>
                  </button>
                </li>
              ))}
            </ul>

            <p className={cn("mt-auto pb-5 pt-4 text-[11px] text-[var(--pms-muted-text)]", GUTTER)}>
              Region level only. District detail is withheld unless the state has released it.
            </p>
          </div>
        </Panel>

        <Panel className="xl:col-span-7">
          <PanelHead title={tab === "patterns" ? "Patterns" : "Driver breakdown"} />
          <div className={PANEL_BODY}>
            <div className={cn("pb-3", GUTTER)}>
              <TabTrack
                tabs={[
                  { k: "patterns", l: "Patterns" },
                  { k: "drivers", l: "Drivers" },
                ] as const}
                active={tab}
                onChange={setTab}
              />
            </div>

            {tab === "drivers" ? (
              <ul className="flex flex-col pb-5">
                {drivers.map((d) => {
                  const pct = Math.round((d.n / driverTotal) * 100);
                  return (
                    <li
                      key={d.label}
                      className={cn("flex items-center gap-3 border-t border-[color:var(--pms-divide)] py-2.5 first:border-t-0", GUTTER)}
                    >
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-[9px]"
                        style={{ backgroundColor: "var(--pms-icon-info-bg)", color: "var(--pms-icon-info-fg)" }}
                      >
                        <iconify-icon icon="solar:chart-square-linear" className="text-[15px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{d.label}</span>
                        <span className="mt-1 block h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${Math.max(2, pct)}%`, backgroundColor: "var(--pms-chart-collected)" }}
                          />
                        </span>
                      </span>
                      <b className="shrink-0 text-[20px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                        {pct}%
                      </b>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="flex flex-col">
                {PATTERNS.map((p) => {
                  const d = DIR[p.direction];
                  const bar = Math.round((p.districts.length / MAX_DISTRICTS) * 100);
                  return (
                    <li key={p.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = open === p.id ? null : p.id;
                          setOpen(next);
                          setFocus(next ? homeRegionOf(p) : null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-[var(--pms-row-hover)]",
                          GUTTER,
                        )}
                      >
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-[9px]"
                          style={{ backgroundColor: `var(--pms-icon-${d.square}-bg)`, color: `var(--pms-icon-${d.square}-fg)` }}
                        >
                          <iconify-icon icon="solar:graph-linear" className="text-[15px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{p.issue}</span>
                          <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">
                            {p.driver} · {p.districts.length} district{p.districts.length === 1 ? "" : "s"} · first seen {fmtDate(p.firstSeen)}
                          </span>
                          <span className="mt-1 block h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${Math.max(4, bar)}%`, backgroundColor: `var(--pms-icon-${d.square}-fg)` }}
                            />
                          </span>
                        </span>
                        <Pill tone={d.tone}>
                          <iconify-icon icon={d.icon} className="text-[13px]" />
                          {p.direction}
                        </Pill>
                      </button>

                      {open === p.id ? (
                        <div className={cn("border-t border-[color:var(--pms-divide)] bg-[var(--pms-cost-mini-bg)] py-4", GUTTER)}>
                          <dl className="grid grid-cols-1 gap-3 text-[12.5px] sm:grid-cols-2">
                            <div>
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]">Districts</dt>
                              <dd className="mt-0.5 text-[var(--pms-text)]">{p.districts.join(", ")}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]">Main driver</dt>
                              <dd className="mt-0.5 text-[var(--pms-text)]">{p.driver}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]">Group composition</dt>
                              <dd className="mt-0.5 text-[var(--pms-text)]">
                                {!p.clanSensitive
                                  ? "Not applicable to this pattern."
                                  : granted
                                    ? "Two sub-clans, names held in the restricted record. Access expires in 24 hours."
                                    : "Withheld. Clan fields require a per-record access grant."}
                              </dd>
                            </div>
                          </dl>

                          {(() => {
                            const rec = recordsOf(p);
                            const n = rec.incidents.length + rec.alerts.length;
                            return (
                              <div className="mt-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]">
                                  Records behind this pattern · {n}
                                </p>
                                {n ? (
                                  <ul className="mt-1.5 flex flex-col overflow-hidden rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-surface)]">
                                    {rec.incidents.map((i) => (
                                      <li key={i.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                                        <Link
                                          href={`/conflict-navigator?district=${encodeURIComponent(i.district)}`}
                                          className="flex items-center gap-2.5 px-3 py-2 no-underline transition-colors hover:bg-[var(--pms-row-hover)]"
                                        >
                                          <iconify-icon icon="solar:danger-triangle-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
                                          <span className="shrink-0 font-mono text-[11px] text-[var(--pms-muted-text)]">{i.id}</span>
                                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--pms-text-strong)]">
                                            {i.type} · {i.district}
                                          </span>
                                          <span className="hidden shrink-0 text-[11px] tabular-nums text-[var(--pms-muted-text)] sm:inline">{fmtDate(i.date)}</span>
                                          <Pill tone={i.status === "ongoing" ? "bad" : i.status === "mediated" ? "good" : "info"}>{i.status}</Pill>
                                        </Link>
                                      </li>
                                    ))}
                                    {rec.alerts.map((a) => (
                                      <li key={a.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                                        <Link
                                          href="/early-warning"
                                          className="flex items-center gap-2.5 px-3 py-2 no-underline transition-colors hover:bg-[var(--pms-row-hover)]"
                                        >
                                          <iconify-icon icon="solar:bell-bing-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
                                          <span className="shrink-0 font-mono text-[11px] text-[var(--pms-muted-text)]">{a.id}</span>
                                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--pms-text-strong)]">
                                            {a.title} · {a.district}
                                          </span>
                                          <span className="hidden shrink-0 text-[11px] tabular-nums text-[var(--pms-muted-text)] sm:inline">{fmtDate(a.opened)}</span>
                                          <Pill tone={a.level === "critical" ? "bad" : a.level === "warning" ? "warn" : "info"}>{a.level}</Pill>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-1.5 rounded-[10px] bg-[var(--pms-segmented-track)] px-3 py-2 text-[11.5px] text-[var(--pms-muted-text)]">
                                    No incident or alert recorded in these districts yet.
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="h-9 rounded-[var(--pms-radius-control)]"
                              disabled={busy}
                              onClick={async () => {
                                setBusy(true);
                                await wait(600);
                                const res = createAlert(
                                  {
                                    title: p.issue,
                                    district: p.districts[0],
                                    region: REGIONS.find((r) => r.districts.includes(p.districts[0]))?.id ?? "bay",
                                    state: "south-west",
                                    level: p.direction === "rising" ? "warning" : "watch",
                                    trigger: `Raised from pattern ${p.id} — ${p.driver}.`,
                                    owner: "Early Warning Desk",
                                    due: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
                                  },
                                  actor,
                                  role,
                                );
                                setBusy(false);
                                if (!res.ok) return toast.error(res.error);
                                toast.success(`Alert ${res.alert.id} opened`);
                                router.push("/early-warning");
                              }}
                            >
                              Link to an alert
                            </Button>

                            {p.clanSensitive && !granted ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-9 rounded-[var(--pms-radius-control)]">
                                    Request access to clan fields
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      Request access <DemoBadge label="Access grant" />
                                    </DialogTitle>
                                  </DialogHeader>
                                  <p className="text-[13px] leading-[1.55] text-[var(--pms-text)]">
                                    Clan is protected data under the Data Protection Act 2023. Access is granted per record,
                                    expires after 24 hours, and is written to the log with your reason.
                                  </p>
                                  <label className="flex flex-col gap-1.5">
                                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Reason (required)</span>
                                    <textarea
                                      value={reason}
                                      rows={3}
                                      onChange={(e) => setReason(e.target.value)}
                                      className="rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--pms-primary)]"
                                    />
                                  </label>
                                  <DialogFooter>
                                    <Button
                                      disabled={!reason.trim()}
                                      onClick={() => {
                                        setGranted(true);
                                        logAct({ actor, role, action: "clan.access", target: p.id, note: reason.trim() });
                                        setReason("");
                                        toast.success("Access granted for 24 hours. Recorded in the log.");
                                      }}
                                    >
                                      Request
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function ConflictIntelligence() {
  return (
    <BreakGlass page="conflict-intelligence">
      <ConflictIntelligenceBody />
    </BreakGlass>
  );
}
