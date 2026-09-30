"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const REPORT_STEPS = [
  { slug: "committee", label: "Committee", icon: "solar:users-group-rounded-linear" },
  { slug: "disputes", label: "Disputes", icon: "solar:scale-linear" },
  { slug: "council", label: "Council", icon: "solar:shield-check-linear" },
  { slug: "tension", label: "Tension", icon: "solar:danger-triangle-linear" },
  { slug: "evidence", label: "Evidence", icon: "solar:camera-linear" },
  { slug: "narrative", label: "Story", icon: "solar:pen-new-square-linear" },
] as const;

export function stepHref(i: number) {
  if (i < 0) return "/district";
  if (i >= REPORT_STEPS.length) return "/district/report/review";
  return `/district/report/${REPORT_STEPS[i].slug}`;
}

export function StepProgress() {
  const pathname = usePathname();
  const current = REPORT_STEPS.findIndex((s) => pathname.endsWith(`/${s.slug}`));
  const done = current === -1 ? REPORT_STEPS.length : current;
  return (
    <div className="border-b border-[var(--inv-line)] px-4 pt-3 pb-3">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-[.05em] text-[var(--inv-muted)] uppercase">
        <span>{current === -1 ? "Review" : `Step ${current + 1} of ${REPORT_STEPS.length}`}</span>
        <span className="text-[var(--inv-brand-ink)]">{current === -1 ? "" : REPORT_STEPS[current].label}</span>
      </div>
      <div className="flex gap-1.5">
        {REPORT_STEPS.map((s, i) => (
          <span key={s.slug} className={cn("h-2 flex-1 rounded-full", i < done ? "bg-[var(--inv-brand)]" : i === done ? "bg-[var(--inv-brand-bd)]" : "bg-[var(--inv-line)]")} />
        ))}
      </div>
    </div>
  );
}
