"use client";

import { useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { Screen, StepNav } from "@/components/phone/StepNav";

const ICONS: Record<string, string> = { "Grazing land": "solar:leaf-linear", "Water point": "solar:waterdrops-linear", "Inheritance / land": "solar:home-2-linear", "Revenge killing (diya)": "solar:danger-triangle-linear" };

/** Screen 4 — step 2. */
export default function DisputesStep() {
  const { disputes, set } = useDraft();
  const up = (i: number, k: "count" | "resolved", v: number) => set("disputes", disputes.map((d, j) => (j === i ? { ...d, [k]: Math.max(0, k === "resolved" ? Math.min(v, d.count) : v) } : d)));
  return (
    <>
      <Screen title="Khilaafaadka · Disputes">
        <AudioHelp clip="disputes" text="Imisa khilaaf ayaa dhacay rubucan, imisase la xalliyay?" />
        {disputes.map((d, i) => (
          <div key={d.type} className="rounded-[16px] border-[1.5px] border-[var(--inv-card-border)] p-3">
            <div className="mb-2 flex items-center gap-2 text-[14px] font-bold"><iconify-icon icon={ICONS[d.type] ?? "solar:scale-linear"} className="text-[22px] text-[var(--inv-brand-ink)]" />{d.type}</div>
            <div className="grid grid-cols-2 gap-2">
              {(["count", "resolved"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between rounded-[12px] bg-[#f4f5f7] px-2 py-1.5 dark:bg-[#1c1d22]">
                  <button type="button" className="size-9 rounded-[12px] bg-white text-[20px] font-bold dark:bg-[#131418]" onClick={() => up(i, k, d[k] - 1)}>−</button>
                  <span className="text-center"><span className="block text-[18px] font-extrabold">{d[k]}</span><span className="text-[10px] font-bold text-[var(--inv-muted)] uppercase">{k === "count" ? "Dhacay" : "Xalliyay"}</span></span>
                  <button type="button" className="size-9 rounded-[12px] bg-[var(--inv-brand)] text-[20px] font-bold text-[var(--inv-brand-on)]" onClick={() => up(i, k, d[k] + 1)}>+</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Screen>
      <StepNav />
    </>
  );
}
