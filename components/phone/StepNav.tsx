"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { BigButton } from "./BigButton";
import { REPORT_STEPS, stepHref } from "./StepProgress";

/** Back / Next pair at the bottom of every report step. */
export function StepNav() {
  const t = useTranslations("district");
  const pathname = usePathname();
  const i = REPORT_STEPS.findIndex((s) => pathname.endsWith(`/${s.slug}`));
  return (
    <div className="sticky bottom-0 mt-4 grid grid-cols-[1fr_2fr] gap-2 border-t border-[var(--inv-line)] bg-white px-4 py-3 dark:bg-[#111214]">
      <BigButton tone="outline" href={stepHref(i - 1)} className="justify-center [&>span]:flex-none">{t("back")}</BigButton>
      <BigButton tone="brand" href={stepHref(i + 1)} className="justify-center [&>span]:flex-none">{t("next")}</BigButton>
    </div>
  );
}

/** Screen body wrapper with title + audio help. */
export function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-[22px] leading-[1.2] font-extrabold text-[var(--inv-value)]">{title}</h1>
      {children}
    </div>
  );
}

/** Big −/+ counter for low-literacy number entry. */
export function Counter({ label, value, onChange, icon }: { label: string; value: number; onChange: (n: number) => void; icon?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-[var(--inv-card-border)] px-3 py-2.5">
      {icon ? <iconify-icon icon={icon} className="text-[24px] text-[var(--inv-brand-ink)]" /> : null}
      <span className="flex-1 text-[14px] font-bold text-[var(--inv-value)]">{label}</span>
      <button type="button" className="grid size-11 place-items-center rounded-[12px] bg-[#f4f5f7] text-[22px] font-bold dark:bg-[#1c1d22]" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Less ${label}`}>−</button>
      <span className="w-8 text-center text-[22px] font-extrabold tabular-nums">{value}</span>
      <button type="button" className="grid size-11 place-items-center rounded-[12px] bg-[var(--inv-brand)] text-[22px] font-bold text-[var(--inv-brand-on)]" onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>+</button>
    </div>
  );
}
