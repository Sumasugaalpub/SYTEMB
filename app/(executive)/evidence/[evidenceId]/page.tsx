"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { EVIDENCE, type Evidence } from "@/data/evidence";
import { EVIDENCE_TYPES } from "@/data/evidenceTypes";
import { RESULT_AREAS } from "@/data/resultAreas";
import { useStore } from "@/lib/store";
import { ENTITY } from "@/lib/entities";
import { useRecord } from "@/lib/use-record";
import { fmtDate } from "@/lib/format";
import { regionById } from "@/data/geography";
import { cn } from "@/lib/utils";
import { RestrictedGate } from "@/components/data/RestrictedGate";
import { NoDataBlock } from "@/components/data/NoDataBlock";
import { GUTTER, GHOST_BUTTON, Panel, PanelHead, Rule } from "@/components/pms/dashboard-sections";
import { CAPTION, DefGrid, toneStyle } from "@/components/pms/exec-kit";
import { PageHeader, Pill, type PillTone } from "@/components/pms/ui";
import type { Visibility } from "@/lib/visibility";

const VIS_TONE: Record<Visibility, PillTone> = { public: "good", aggregated: "info", authorized: "warn", restricted: "bad" };

/** Evidence item panel. */
export default function EvidenceItem() {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  // Uploaded items live in storage; the seed library is only the starting set.
  const { record: e, ready } = useRecord<Evidence>(ENTITY.evidence, EVIDENCE, evidenceId);
  const sharing = useStore((s) => s.sharing);
  if (!e) {
    if (ready) notFound();
    return null;
  }
  const t = EVIDENCE_TYPES.find((x) => x.id === e.type) ?? EVIDENCE_TYPES[0];
  const st = regionById(e.region)?.state ?? "";
  const stateShares = sharing[st]?.evidence ?? false;
  const linkHref = (id: string) => (id.startsWith("PRJ") ? `/interventions/${id}` : id.startsWith("KPI") ? `/indicators/${id}` : id.startsWith("SUB") ? `/state/submissions/${id}` : "/early-warning");

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title={e.id}
        meta={`${t.label} · ${e.title}`}
        actions={
          <>
            <Pill tone={VIS_TONE[e.visibility]}>{e.visibility}</Pill>
            <Link href="/evidence" className={GHOST_BUTTON}>
              Library
              <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
            </Link>
          </>
        }
      />

      <RestrictedGate level={e.visibility}>
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-7">
            <PanelHead title="Preview" action={<span className={CAPTION}>{t.label} · {e.size}</span>} />
            <div className={cn("pb-4", GUTTER)}>
              {e.visibility !== "public" && !stateShares ? (
                <NoDataBlock note="the state has not shared evidence files with federal users" />
              ) : (
                <div className="grid aspect-[16/9] place-items-center rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-chart-well-bg)]">
                  <div className="text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl" style={toneStyle("info")}>
                      <iconify-icon icon={t.icon} className="text-[28px]" />
                    </span>
                    <p className={cn(CAPTION, "mt-2.5")}>{t.label} · {e.size} · {t.formats.join(", ")}</p>
                  </div>
                </div>
              )}
              <p className="mt-3 text-[13px] leading-[1.55] text-[var(--pms-text)]">{e.description}</p>
            </div>
          </Panel>

          <Panel className="xl:col-span-5">
            <PanelHead title="Record" action={<span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{e.id}</span>} />
            <div className={cn("pb-4", GUTTER)}>
              <DefGrid
                className="sm:grid-cols-1"
                items={[
                  ["Visibility", <Pill key="v" tone={VIS_TONE[e.visibility]}>{e.visibility}</Pill>],
                  ["District", e.district],
                  ["Date", fmtDate(e.date)],
                  ["Submitted by", e.submittedBy],
                  ["Result area", RESULT_AREAS.find((r) => r.id === e.resultArea)?.code ?? "—"],
                  ["Size", e.size],
                ]}
              />
            </div>
            <Rule />
            <div className={cn("py-4", GUTTER)}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]">Linked records</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(e.linked ?? []).length ? (
                  (e.linked ?? []).map((id) => (
                    <Link
                      key={id}
                      href={linkHref(id)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold no-underline transition-opacity hover:opacity-80"
                      style={toneStyle("info")}
                    >
                      {id}
                      <iconify-icon icon="solar:arrow-right-up-linear" className="text-[12px]" />
                    </Link>
                  ))
                ) : (
                  <span className={CAPTION}>Nothing linked yet.</span>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </RestrictedGate>
    </div>
  );
}
