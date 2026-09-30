"use client";

import * as React from "react";
import { toast } from "sonner";

import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { ENTITY } from "@/lib/entities";
import type { StoredSubmission } from "@/lib/seed";
import { useStore, type SharingFlags } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IconChip, PageHeader, Pill, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

const STATE = "south-west";
const OWNER = "Sahra Aadan";

const ITEMS: { key: keyof SharingFlags; label: string; detail: string; icon: string }[] = [
  { key: "counts", label: "Counts and totals", detail: "Disputes, resolutions, committee and council figures.", icon: "solar:calculator-minimalistic-linear" },
  { key: "districtNames", label: "District names", detail: "Off means federal users see one shaded region, not pins.", icon: "solar:map-point-linear" },
  { key: "locations", label: "Exact locations", detail: "Coordinates of incidents and mediation sites.", icon: "solar:gps-linear" },
  { key: "evidence", label: "Evidence files", detail: "Off means federal users see only that evidence exists.", icon: "solar:gallery-wide-linear" },
  { key: "notes", label: "Written narrative", detail: "The four story fields the district writes.", icon: "solar:notes-linear" },
];

export default function SharingControl() {
  const [openExport, exportDialog] = useExportDialog();
  const sharing = useStore((s) => s.sharing[STATE]);
  const setSharing = useStore((s) => s.setSharing);
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const [saving, setSaving] = React.useState<string | null>(null);

  const approved = rows.filter((r) => r.status === "approved");

  async function toggle(key: keyof SharingFlags, value: boolean) {
    setSaving(key);
    await wait(500);
    setSharing(STATE, key, value);
    logAct({
      actor: OWNER,
      role: "state-admin",
      action: "sharing.update",
      target: `${STATE}.${key}`,
      note: value ? "Released to federal users." : "Withheld from federal users.",
    });
    setSaving(null);
    toast.success(value ? "Released to Mogadishu" : "Withheld from Mogadishu");
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title="Sharing control"
        meta="This state decides what leaves it. The setting cannot be changed from Mogadishu."
      />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <PmsCard title="What South West sends to Mogadishu" className="xl:col-span-7" flush>
          <ul className="flex flex-col">
            {ITEMS.map((it) => {
              const on = sharing?.[it.key] ?? false;
              return (
                <li
                  key={it.key}
                  className="flex items-center gap-3 border-b border-[color:var(--pms-divide)] px-5 py-4 last:border-b-0"
                >
                  <IconChip icon={it.icon} tone={on ? "success" : "neutral"} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-[var(--pms-text-strong)]">{it.label}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--pms-muted-text)]">{it.detail}</p>
                  </div>
                  <Pill tone={on ? "good" : "neutral"}>{on ? "Shared" : "Held"}</Pill>
                  <Switch checked={on} disabled={saving === it.key} onCheckedChange={(v) => toggle(it.key, v)} aria-label={it.label} />
                </li>
              );
            })}
          </ul>
          <p className="border-t border-[color:var(--pms-divide)] px-5 py-4 text-[13px] font-semibold text-[var(--pms-text-strong)]">
            This state controls this setting. It cannot be changed from Mogadishu.
          </p>
        </PmsCard>

        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-5">
          <PmsCard title="What Mogadishu sees right now">
            <ul className="flex flex-col gap-2.5 text-[13px]">
              <li className="flex items-center justify-between">
                <span className="text-[var(--pms-muted-text)]">Approved returns</span>
                <b className="tabular-nums text-[var(--pms-text-strong)]">{approved.length}</b>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--pms-muted-text)]">Districts named</span>
                <b className="text-[var(--pms-text-strong)]">
                  {sharing?.districtNames ? `${approved.length} named` : "Region only"}
                </b>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--pms-muted-text)]">Map pins</span>
                <b className="text-[var(--pms-text-strong)]">{sharing?.locations ? "Visible" : "Hidden"}</b>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--pms-muted-text)]">Evidence</span>
                <b className="text-[var(--pms-text-strong)]">{sharing?.evidence ? "Files released" : "Existence only"}</b>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--pms-muted-text)]">Narrative</span>
                <b className="text-[var(--pms-text-strong)]">{sharing?.notes ? "Released" : "Not shared"}</b>
              </li>
            </ul>
            <Button
              variant="outline"
              className="mt-4 h-9 w-full rounded-[var(--pms-radius-control)]"
              onClick={() => window.open("/map", "_blank")}
            >
              Preview the federal map
            </Button>
          </PmsCard>

          <PmsCard title="Why this exists">
            <p className="text-[13px] leading-[1.55] text-[var(--pms-text)]">
              Two states have been in dispute with Mogadishu since 2024. A system that takes everything
              automatically would simply not be used. Every access is written to the log, so this state can
              prove what was and was not read.
            </p>
          </PmsCard>
        </div>
      </div>
    </div>
  );
}
