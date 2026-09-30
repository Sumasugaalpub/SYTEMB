import { cn } from "@/lib/utils";
import type { Quality } from "@/data/indicators";

const META: Record<Quality, { label: string; icon: string; cls: string }> = {
  verified: { label: "Verified", icon: "solar:verified-check-linear", cls: "text-[var(--inv-green)]" },
  provisional: { label: "Provisional", icon: "solar:clock-circle-linear", cls: "text-[var(--inv-amber)]" },
  estimated: { label: "Estimated", icon: "solar:calculator-minimalistic-linear", cls: "text-[var(--inv-blue)]" },
};

export function QualityTag({ quality, bare }: { quality: Quality; bare?: boolean }) {
  const m = META[quality];
  return (
    <span className={cn("inline-flex items-center gap-1 font-bold", m.cls, !bare && "rounded-[20px] bg-current/10 px-2.5 py-[3px] text-[11px]")}>
      <iconify-icon icon={m.icon} className="text-[12px]" />
      {m.label}
    </span>
  );
}
