"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { beneficiaryGroupsOf, PROJECTS, type Project } from "@/data/projects";
import { RESULT_AREAS } from "@/data/resultAreas";
import { indicatorById, progress } from "@/data/indicators";
import { EVIDENCE, type Evidence } from "@/data/evidence";
import { DISTRICTS, stateById } from "@/data/geography";
import { TIMELINE } from "@/data/timeline";
import { periodLabel } from "@/data/periods";
import { ENTITY } from "@/lib/entities";
import { useRecord, useRecords } from "@/lib/use-record";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GHOST_BUTTON, GUTTER, PANEL_BODY, Panel, PanelHead, PanelLink } from "@/components/pms/dashboard-sections";
import { Pill, type PillTone } from "@/components/pms/ui";
import { BoundaryDisclaimer } from "@/components/map/BoundaryDisclaimer";
import { SomaliaMap } from "@/components/map/SomaliaMap";
import { SuppressedValue } from "@/components/data/SuppressedValue";

const TONE: Record<Project["status"], PillTone> = {
  "on-track": "good",
  "at-risk": "warn",
  delayed: "bad",
  complete: "info",
};

const QUALITY_TONE: Record<string, PillTone> = { verified: "good", provisional: "warn", estimated: "neutral" };

/** Project detail — all 18 fields. */
export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  // Stored projects merged over the seed registry: a project registered in this
  // browser has a detail page of its own, exactly like a shipped one.
  const { record: p, ready } = useRecord<Project>(ENTITY.projects, PROJECTS, projectId);
  const evidenceRows = useRecords<Evidence>(ENTITY.evidence, EVIDENCE);
  if (!p) {
    if (ready) notFound();
    return null;
  }
  const ra = RESULT_AREAS.find((r) => r.id === p.resultArea) ?? RESULT_AREAS[0];
  const fields: [string, React.ReactNode][] = [
    ["Project ID", <span key="id" className="font-mono text-[11px]">{p.id}</span>],
    ["Title", p.title],
    ["Result area", <Link key="ra" href={`/result-areas?area=${ra.id}`} className="text-[var(--pms-text-strong)] no-underline hover:underline">{ra.code} {ra.name}</Link>],
    ["Lead institution", p.lead],
    ["Implementing partner", p.partner],
    ["Donor", p.donor],
    ["States", p.states.map((s) => stateById(s)?.name).join(", ")],
    ["Districts", p.districts.join(", ")],
    ["Start", fmtDate(p.start)],
    ["End", fmtDate(p.end)],
    ["Budget", fmtMoney(p.budget)],
    ["Spent", `${fmtMoney(p.spent)} (${Math.round((p.spent / p.budget) * 100)}%)`],
    ["Status", <Pill key="st" tone={TONE[p.status]}>{p.status}</Pill>],
    ["Physical progress", `${p.progress}%`],
    ["Beneficiaries", fmtNumber(p.beneficiaries)],
    ["Beneficiary groups", beneficiaryGroupsOf(p)],
    ["Linked KPIs", p.kpis.join(", ")],
    ["Key risks", p.risks],
    ["Last update", fmtDate(p.lastUpdate)],
  ];
  const ev = evidenceRows.filter((e) => e.linked.includes(p.id) || (p.evidence ?? []).includes(e.id));

  /** What the project has actually reported: its linked indicators for the latest complete period. */
  const results = p.kpis
    .map((id) => indicatorById(id))
    .filter((k): k is NonNullable<typeof k> => Boolean(k))
    .map((k) => ({ k, pct: progress(k) }));

  // The map draws the states the project works in and names the districts it reaches.
  const focusState = p.states?.[0];
  const mapped = p.districts.filter((d) => DISTRICTS.some((x) => x.name === d));
  const burn = Math.round((p.spent / p.budget) * 100);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-[var(--pms-muted-text)]">{p.id} · {ra.code}</p>
          <h1 className="mt-0.5 text-[15px] font-semibold leading-snug text-[var(--pms-text-strong)]">{p.title}</h1>
        </div>
        <Link href="/interventions" className={GHOST_BUTTON}>
          All projects
          <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
        </Link>
      </header>

      <div className="grid grid-cols-1 items-start gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHead title="Registry record" action={<PanelLink href={`/result-areas?area=${ra.id}`}>{ra.code}</PanelLink>} />
          <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
            <p className="text-[13px] leading-[1.55] text-[var(--pms-text)]">{p.description}</p>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {fields.map(([k, v]) => (
                <div key={k} className="flex flex-col border-t border-[color:var(--pms-divide)] py-2.5">
                  <dt className="text-[11px] font-medium text-[var(--pms-muted-text)]">{k}</dt>
                  <dd className="mt-1 text-[13px] font-semibold text-[var(--pms-text-strong)]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>

        <div className="flex min-w-0 flex-col gap-3 lg:gap-4 xl:col-span-5">
          <Panel>
            <PanelHead title="Budget burn" />
            <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
              <div className="flex items-end justify-between gap-3">
                <span className="text-[24px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                  {fmtMoney(p.spent)}
                </span>
                <span className="text-[12px] text-[var(--pms-muted-text)]">of {fmtMoney(p.budget)}</span>
              </div>
              <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(2, burn))}%`, backgroundColor: "var(--pms-chart-collected)" }}
                />
              </span>
              <p className="mt-2 text-[11px] text-[var(--pms-muted-text)]">
                Physical progress {p.progress}% · financial {burn}%
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Linked indicators" action={<PanelLink href="/indicators">See all</PanelLink>} />
            <ul className={cn(PANEL_BODY, "pb-2")}>
              {p.kpis.map((id) => {
                const k = indicatorById(id);
                return k ? (
                  <li key={id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                    <Link
                      href={`/indicators/${id}`}
                      className={cn("flex items-center gap-3 py-2.5 no-underline transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
                    >
                      <span className="hidden shrink-0 font-mono text-[11px] text-[var(--pms-muted-text)] sm:inline">{id}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{k.name}</span>
                      <b className="shrink-0 text-[13px] tabular-nums text-[var(--pms-text-strong)]">
                        <SuppressedValue value={k.value} unit={k.unit} peopleCount={k.peopleCount} />
                      </b>
                    </Link>
                  </li>
                ) : null;
              })}
              {p.kpis.length === 0 ? (
                <li className={cn("py-3 text-[12px] text-[var(--pms-muted-text)]", GUTTER)}>No indicator linked.</li>
              ) : null}
            </ul>
          </Panel>

          <Panel>
            <PanelHead title="Where it works" action={<PanelLink href={`/map?project=${p.id}`}>Map</PanelLink>} />
            <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
              <div className="overflow-hidden rounded-2xl border border-[color:var(--pms-hairline-border)]">
                <SomaliaMap height={240} focusState={focusState} layers={{ basemap: true, peace: true, projects: true }} />
              </div>
              <p className="mt-2 text-[11px] leading-[1.5] text-[var(--pms-muted-text)]">
                {stateById(focusState)?.name ?? focusState} · {mapped.length} of {p.districts.length} districts matched to the
                national district list: {p.districts.join(", ")}.
              </p>
              <BoundaryDisclaimer />
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Evidence" action={<PanelLink href="/evidence">See all</PanelLink>} />
            <ul className={cn(PANEL_BODY, "pb-2")}>
              {ev.map((e) => (
                <li key={e.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                  <Link
                    href={`/evidence/${e.id}`}
                    className={cn("flex items-center gap-3 py-2.5 no-underline transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
                  >
                    <span className="hidden shrink-0 font-mono text-[11px] text-[var(--pms-muted-text)] sm:inline">{e.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{e.title}</span>
                    <iconify-icon icon="solar:arrow-right-up-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
                  </Link>
                </li>
              ))}
              {ev.length === 0 ? (
                <li className={cn("py-3 text-[12px] text-[var(--pms-muted-text)]", GUTTER)}>No evidence linked yet.</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHead title="Reported results" action={<PanelLink href="/indicators">Indicators</PanelLink>} />
        {results.length ? (
          <div className={PANEL_BODY}>
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-y border-[color:var(--pms-divide)]">
                    {[
                      ["Indicator", "left"],
                      ["Period", "left"],
                      ["Baseline", "right"],
                      ["Reported", "right"],
                      ["Target", "right"],
                      ["Progress", "right"],
                      ["Quality", "left"],
                    ].map(([h, align]) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]",
                          align === "right" ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(({ k, pct }) => (
                    <tr key={k.id} className="border-b border-[color:var(--pms-divide)] last:border-b-0">
                      <td className="px-4 py-2.5">
                        <Link href={`/indicators/${k.id}`} className="no-underline hover:underline">
                          <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{k.id}</span>{" "}
                          <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{k.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[var(--pms-muted-text)]">{periodLabel(TIMELINE.period)}</td>
                      <td className="px-4 py-2.5 text-right text-[13px] tabular-nums text-[var(--pms-text)]">{k.baseline}</td>
                      <td className="px-4 py-2.5 text-right">
                        {k.value === null ? (
                          <span className="rounded-full bg-[var(--pms-segmented-track)] px-2 py-0.5 text-[11px] font-medium text-[var(--pms-muted-text)]">
                            no data received
                          </span>
                        ) : (
                          <b className="text-[13px] tabular-nums text-[var(--pms-text-strong)]">
                            <SuppressedValue value={k.value} unit={k.unit} peopleCount={k.peopleCount} />
                          </b>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[13px] tabular-nums text-[var(--pms-text)]">{k.target}</td>
                      <td className="px-4 py-2.5 text-right text-[13px] tabular-nums text-[var(--pms-text)]">{pct === null ? "—" : `${pct}%`}</td>
                      <td className="px-4 py-2.5">
                        <Pill tone={QUALITY_TONE[k.quality] ?? "neutral"}>{k.quality}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={cn("py-3 text-[11px] text-[var(--pms-muted-text)]", GUTTER)}>
              Reported through district returns for {periodLabel(TIMELINE.period)}, the latest complete period · {ev.length}{" "}
              evidence {ev.length === 1 ? "item" : "items"} filed against this project.
            </p>
          </div>
        ) : (
          <p className={cn("pb-5 text-[12px] text-[var(--pms-muted-text)]", GUTTER)}>
            No indicators are linked to this project yet, so it has reported no results.
          </p>
        )}
      </Panel>
    </div>
  );
}
