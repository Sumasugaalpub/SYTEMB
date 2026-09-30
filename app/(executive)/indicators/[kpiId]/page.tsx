"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { INDICATORS, type Indicator, progress } from "@/data/indicators";
import { RESULT_AREAS } from "@/data/resultAreas";
import { PROJECTS, type Project } from "@/data/projects";
import { useStore } from "@/lib/store";
import { roleById } from "@/data/users";
import { canSee } from "@/lib/visibility";
import { getDenominator, scopedReportedFor } from "@/lib/coverage";
import { ENTITY } from "@/lib/entities";
import { useSuppressionThreshold } from "@/lib/settings";
import { useRecord, useRecords } from "@/lib/use-record";
import { cn } from "@/lib/utils";
import { GHOST_BUTTON, GUTTER, PANEL_BODY, Panel, PanelHead, PanelLink } from "@/components/pms/dashboard-sections";
import { ProvenanceLine } from "@/components/data/ProvenanceLine";
import { SuppressedValue } from "@/components/data/SuppressedValue";
import { VisibilityTag } from "@/components/data/VisibilityTag";
import { QualityTag } from "@/components/data/QualityTag";
import { TrendLine } from "@/components/charts/TrendLine";
import { RestrictedGate } from "@/components/data/RestrictedGate";

/** Indicator method sheet. */
export default function MethodSheet() {
  const { kpiId } = useParams<{ kpiId: string }>();
  // Stored indicators merged over the national set, so an indicator added to
  // the register resolves here instead of 404ing.
  const { record: k, ready } = useRecord<Indicator>(ENTITY.indicators, INDICATORS, kpiId);
  const { region, period, role } = useStore();
  const threshold = useSuppressionThreshold();
  const projects = useRecords<Project>(ENTITY.projects, PROJECTS);
  if (!k) {
    if (ready) notFound();
    return null;
  }
  const ra = RESULT_AREAS.find((r) => r.id === k.resultArea) ?? RESULT_AREAS[0];
  const p = progress(k);
  const ok = canSee(roleById(role).clearance, k.visibility);
  const v = k.value ?? k.baseline;
  const series = [
    { label: "Baseline", actual: k.baseline, target: k.baseline },
    { label: "Q3 25", actual: Math.round(k.baseline + (v - k.baseline) * 0.35), target: Math.round(k.baseline + (k.target - k.baseline) * 0.1) },
    { label: "Q4 25", actual: Math.round(k.baseline + (v - k.baseline) * 0.7), target: Math.round(k.baseline + (k.target - k.baseline) * 0.2) },
    { label: "Q1 26", actual: k.value, target: Math.round(k.baseline + (k.target - k.baseline) * 0.3) },
    { label: "2033", actual: null, target: k.target },
  ];
  const sheet: [string, React.ReactNode][] = [
    ["Result area", `${ra.code} ${ra.name}`],
    ["Unit", k.unit],
    ["Frequency", k.frequency],
    ["Data source", k.source],
    ["Owner", k.owner],
    ["Baseline (2025)", k.baseline],
    ["Target (2033)", k.target],
    ["Visibility", <VisibilityTag key="v" level={k.visibility} />],
    ["Quality", <QualityTag key="q" quality={k.quality} />],
    ["Disaggregation", "State · region · district · sex · age band"],
    ["Suppression", k.peopleCount ? `People count — values below ${threshold} suppressed` : "Not a people count"],
  ];
  const linked = projects.filter((x) => (x.kpis ?? []).includes(k.id));

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-[var(--pms-muted-text)]">{k.id} · Method sheet</p>
          <h1 className="mt-0.5 text-[15px] font-semibold leading-snug text-[var(--pms-text-strong)]">{k.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/indicators" className={GHOST_BUTTON}>
            All indicators
            <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
          </Link>
          <button type="button" className={GHOST_BUTTON} onClick={() => window.print()}>
            Print sheet
            <iconify-icon icon="solar:printer-minimalistic-linear" className="text-[15px]" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-5">
          <PanelHead title="Definition & method" action={<PanelLink href={`/result-areas?area=${ra.id}`}>{ra.code}</PanelLink>} />
          <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
            <p className="text-[13px] leading-[1.55] text-[var(--pms-text)]">{k.method}</p>
            <dl className="mt-3 flex flex-col">
              {sheet.map(([a, b]) => (
                <div key={a} className="flex items-start justify-between gap-4 border-t border-[color:var(--pms-divide)] py-2.5">
                  <dt className="shrink-0 text-[12px] text-[var(--pms-muted-text)]">{a}</dt>
                  <dd className="min-w-0 text-right text-[12px] font-semibold text-[var(--pms-text-strong)]">{b}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>

        <div className="flex min-w-0 flex-col gap-3 lg:gap-4 xl:col-span-7">
          <RestrictedGate level={k.visibility}>
            <Panel>
              <PanelHead title="Current value" action={<PanelLink href="/analytics">Analytics</PanelLink>} />
              <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
                <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                  <span className="text-[24px] font-bold leading-none tabular-nums tracking-tight text-[var(--pms-text-strong)]">
                    <SuppressedValue value={k.value} unit={k.unit} peopleCount={k.peopleCount} />
                  </span>
                  <span className="text-[12px] text-[var(--pms-muted-text)]">
                    {p === null ? "No progress computed" : `${p}% of the way from baseline to target`}
                  </span>
                </div>
                <div className="mt-3 min-w-0">
                  <TrendLine
                    data={series}
                    series={[
                      { key: "actual", name: "Actual", color: "var(--pms-chart-collected)" },
                      { key: "target", name: "Trajectory", color: "var(--pms-muted-text)", dashed: true },
                    ]}
                    height={200}
                  />
                </div>
                <ProvenanceLine
                  className="mt-2"
                  reported={scopedReportedFor(k.reported, region, period)}
                  total={getDenominator(region)}
                  source={k.source}
                  period={period}
                  quality={k.quality}
                />
              </div>
            </Panel>
          </RestrictedGate>

          {!ok ? null : (
            <Panel>
              <PanelHead title="Projects moving this KPI" action={<PanelLink href="/interventions">See all</PanelLink>} />
              <ul className={cn(PANEL_BODY, "pb-2")}>
                {linked.map((x) => (
                  <li key={x.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                    <Link
                      href={`/interventions/${x.id}`}
                      className={cn("flex items-center gap-3 py-2.5 no-underline transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
                    >
                      <span className="shrink-0 font-mono text-[11px] text-[var(--pms-muted-text)]">{x.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{x.title}</span>
                      <iconify-icon icon="solar:arrow-right-up-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
                    </Link>
                  </li>
                ))}
                {linked.length === 0 ? (
                  <li className={cn("py-3 text-[12px] text-[var(--pms-muted-text)]", GUTTER)}>No project linked.</li>
                ) : null}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
