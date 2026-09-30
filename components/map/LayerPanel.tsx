"use client";

import { GIS_LAYERS } from "@/data/gisLayers";
import { useStore } from "@/lib/store";
import { roleById } from "@/data/users";
import { canSee } from "@/lib/visibility";
import { Switch } from "@/components/ui/switch";
import { SWITCH } from "@/lib/skin";

/** The 8 GIS layers. Restricted layers lock for roles without clearance. */
export function LayerPanel({ on, onToggle }: { on: Record<string, boolean>; onToggle: (id: string, v: boolean) => void }) {
  const role = useStore((s) => s.role);
  const clear = canSee(roleById(role).clearance, "restricted");
  return (
    <div className="flex flex-col">
      {GIS_LAYERS.map((l) => {
        const locked = l.restricted && !clear;
        return (
          <label key={l.id} className="flex cursor-pointer items-center gap-3 border-t border-[var(--inv-line)] py-2.5 first:border-t-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f4f5f7] text-[16px] text-[var(--inv-icon)] dark:bg-[#1c1d22]"><iconify-icon icon={l.icon} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--inv-value)]">
                {l.name}
                {l.restricted ? <iconify-icon icon="solar:lock-keyhole-linear" className="text-[12px] text-[var(--inv-red)]" /> : null}
              </span>
              <span className="block truncate text-[11px] text-[var(--inv-muted)]">{locked ? "Requires restricted clearance" : l.description}</span>
            </span>
            <Switch className={SWITCH} checked={!!on[l.id] && !locked} disabled={locked} onCheckedChange={(v) => onToggle(l.id, v)} />
          </label>
        );
      })}
    </div>
  );
}
