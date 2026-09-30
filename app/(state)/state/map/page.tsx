"use client";

import * as React from "react";

import { REGIONS } from "@/data/geography";
import { ENTITY } from "@/lib/entities";
import { STATUS_LABEL, type SubStatus } from "@/lib/flow";
import type { StoredSubmission } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { BoundaryDisclaimer } from "@/components/map/BoundaryDisclaimer";
import { IconChip, PageHeader, Pill, type PillTone, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

const STATE = "south-west";
const TONE: Record<SubStatus, PillTone> = { approved: "good", pending: "warn", returned: "bad", draft: "neutral", missing: "accent" };

export default function StateMap() {
  const [openExport, exportDialog] = useExportDialog();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const sharing = useStore((s) => s.sharing[STATE]);
  const [selected, setSelected] = React.useState<string | null>(null);

  const regions = REGIONS.filter((r) => r.state === STATE);
  const byDistrict = new Map(rows.map((r) => [r.district, r]));
  const open = selected ? byDistrict.get(selected) : null;

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters onPrint={printPage} onExport={openExport} title="State map" meta="Green where a district reported, grey where it did not." />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <PmsCard title="South West State — 16 districts" className="xl:col-span-8">
          <div className="flex flex-col gap-5">
            {regions.map((r) => (
              <div key={r.id}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]">
                  {r.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {r.districts.map((d) => {
                    const sub = byDistrict.get(d);
                    const reported = Boolean(sub?.submittedAt);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelected(d)}
                        className="flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[13px] font-medium transition-colors"
                        style={{
                          borderColor: selected === d ? "var(--pms-primary)" : "var(--pms-hairline-border)",
                          backgroundColor: reported ? "var(--pms-icon-success-bg)" : "var(--pms-segmented-track)",
                          color: reported ? "var(--pms-icon-success-fg)" : "var(--pms-muted-text)",
                        }}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: "currentColor" }} />
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <BoundaryDisclaimer />
        </PmsCard>

        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-4">
          <PmsCard title={open ? open.district : "Pick a district"}>
            {open ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <IconChip icon="solar:map-point-linear" tone="info" />
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{open.district}</p>
                    <p className="text-[12px] text-[var(--pms-muted-text)]">{open.focalPoint}</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-2 text-[13px]">
                  <li className="flex justify-between"><span className="text-[var(--pms-muted-text)]">Status</span><Pill tone={TONE[open.status as SubStatus]}>{STATUS_LABEL[open.status as SubStatus]}</Pill></li>
                  <li className="flex justify-between"><span className="text-[var(--pms-muted-text)]">Disputes</span><b className="tabular-nums">{open.disputes}</b></li>
                  <li className="flex justify-between"><span className="text-[var(--pms-muted-text)]">Resolved</span><b className="tabular-nums">{open.resolved}</b></li>
                  <li className="flex justify-between"><span className="text-[var(--pms-muted-text)]">Tension</span><b className="tabular-nums">Level {open.tension}</b></li>
                  <li className="flex justify-between"><span className="text-[var(--pms-muted-text)]">Evidence</span><b className="tabular-nums">{open.evidence}</b></li>
                </ul>
              </div>
            ) : (
              <p className="text-[13px] text-[var(--pms-muted-text)]">Tap a district to see its return.</p>
            )}
          </PmsCard>

          <PmsCard title="Released to federal">
            <p className="text-[13px] leading-[1.5] text-[var(--pms-text)]">
              {sharing?.locations
                ? "Exact locations are shared, so federal users see pins."
                : "Exact locations are held. Federal users see the region only, with no pins."}
            </p>
          </PmsCard>
        </div>
      </div>
    </div>
  );
}
