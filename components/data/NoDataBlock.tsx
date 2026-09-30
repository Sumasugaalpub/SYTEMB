"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** Grey "no data received" — never a zero, never a blank. */
export function NoDataBlock({ note, compact, className }: { note?: string; compact?: boolean; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={cn("flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#d3d8de] bg-[repeating-linear-gradient(45deg,#f4f5f7_0_6px,#eef0f3_6px_12px)] text-[var(--inv-muted)] dark:border-[rgba(255,255,255,.1)] dark:bg-[repeating-linear-gradient(45deg,#131418_0_6px,#17181c_6px_12px)]", compact ? "px-2 py-1 text-[11px]" : "px-4 py-6 text-[12.5px]", className)}>
      <iconify-icon icon="solar:cloud-cross-linear" className={compact ? "text-[13px]" : "text-[18px]"} />
      <span className="font-semibold">{t("noData")}</span>
      {note ? <span>· {note}</span> : null}
    </div>
  );
}
