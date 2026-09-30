import Link from "next/link";

import { cn } from "@/lib/utils";
import { CARD, PANEL, PANEL_FLUSH, SEE_ALL, THEAD, THEAD_TITLE } from "@/lib/skin";

/** Hatch-header card with white inset — the Inventory System's signature surface. */
export function Panel({ title, icon, href, linkLabel = "See all", action, flush, className, bodyClassName, children }: {
  title: React.ReactNode; icon?: string; href?: string; linkLabel?: string; action?: React.ReactNode; flush?: boolean; className?: string; bodyClassName?: string; children: React.ReactNode;
}) {
  return (
    <section className={cn(CARD, "flex min-w-0 flex-col", className)}>
      <div className={THEAD}>
        <div className={THEAD_TITLE}>
          {icon ? <iconify-icon icon={icon} /> : null}
          {title}
        </div>
        <div className="flex items-center gap-3">
          {action}
          {href ? (
            <Link href={href} className={SEE_ALL}>
              {linkLabel}
              <iconify-icon icon="solar:arrow-right-linear" className="text-[13px]" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className={cn(flush ? PANEL_FLUSH : PANEL, "flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Section heading row used above grids on long pages. */
export function SectionHead({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mt-7 mb-3.5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[16px] font-bold text-[var(--inv-value)]">{title}</h2>
        {sub ? <p className="mt-0.5 text-[12.5px] text-[var(--inv-muted)]">{sub}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** Page intro row: kicker + description + actions. */
export function PageIntro({ kicker, description, children }: { kicker?: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-[760px]">
        {kicker ? <div className="mb-1.5 text-[10.5px] font-bold tracking-[.08em] text-[var(--inv-brand-ink)] uppercase">{kicker}</div> : null}
        {description ? <p className="text-[13.5px] leading-[1.55] text-[var(--inv-muted)]">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-[9px]">{children}</div> : null}
    </div>
  );
}

export function Tag({ tone = "neutral", icon, children, className }: { tone?: "neutral" | "brand" | "green" | "amber" | "red" | "blue" | "violet"; icon?: string; children: React.ReactNode; className?: string }) {
  const TONES = {
    neutral: "bg-[#eef0f4] text-[var(--inv-muted)] dark:bg-[#1c1d22]",
    brand: "bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)]",
    green: "bg-[#e7f6ee] text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.16)]",
    amber: "bg-[#fdf3e1] text-[var(--inv-amber)] dark:bg-[rgba(217,138,6,.16)]",
    red: "bg-[#fdecec] text-[var(--inv-red)] dark:bg-[rgba(217,74,74,.16)]",
    blue: "bg-[#eaf1fd] text-[var(--inv-blue)] dark:bg-[rgba(47,119,230,.16)]",
    violet: "bg-[#efecfd] text-[var(--inv-violet)] dark:bg-[rgba(122,108,240,.16)]",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[20px] px-2.5 py-[3px] text-[11px] font-bold whitespace-nowrap [&_iconify-icon]:text-[12px]", TONES[tone], className)}>
      {icon ? <iconify-icon icon={icon} /> : null}
      {children}
    </span>
  );
}
