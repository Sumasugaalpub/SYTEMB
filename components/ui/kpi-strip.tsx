import * as React from "react";

import { cn } from "@/lib/utils";
import { CARD } from "@/lib/skin";

/** Column counts the strip supports — spelled out so Tailwind keeps the classes. */
const COLS: Record<3 | 4 | 5, string> = {
  3: "grid-cols-[repeat(3,minmax(0,1fr))]",
  4: "grid-cols-[repeat(4,minmax(0,1fr))]",
  5: "grid-cols-[repeat(5,minmax(0,1fr))]",
};

/** KPI card row — hatch-header cards with a white inset, per the design system. */
export function KpiStrip({
  children,
  cols = 5,
  className,
}: {
  children: React.ReactNode;
  cols?: 3 | 4 | 5;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", COLS[cols], className)}>{children}</div>
  );
}

export type StatCellAccent =
  | "brand"
  | "green"
  | "amber"
  | "violet"
  | "red"
  | "teal";

/** Accent drives the spark tint; dark mode uses the softened variant. */
const accentClass: Record<StatCellAccent, string> = {
  brand: "text-[var(--inv-brand-ink)] dark:text-[#8891ee]",
  green: "text-[var(--inv-green)] dark:text-[#57b07f]",
  amber: "text-[var(--inv-amber)] dark:text-[#d2a24a]",
  violet: "text-[var(--inv-violet)] dark:text-[#9a8ff0]",
  red: "text-[var(--inv-red)] dark:text-[#e57e7e]",
  teal: "text-[var(--inv-teal)] dark:text-[#4fb3a6]",
};

const DOT = "absolute rounded-full bg-current opacity-40";

/**
 * Single KPI card — white inset holding the value, a haloed "spark" icon and
 * the footer line, with the uppercase label on a hatched strip underneath.
 */
export function StatCell({
  label,
  accent = "brand",
  value,
  graphic,
  headIcon,
  foot,
  dots = true,
}: {
  label: React.ReactNode;
  accent?: StatCellAccent;
  value: React.ReactNode;
  graphic?: React.ReactNode;
  /** Small outline mark shown on the right of the hatch header. */
  headIcon?: React.ReactNode;
  foot?: React.ReactNode;
  /** Speckles around the spark halo — off on the denser 8-card grids. */
  dots?: boolean;
}) {
  return (
    <div className={cn(CARD, "flex min-w-0 flex-col p-0.5 text-inherit no-underline")}>
      <div className="order-1 flex min-h-[92px] flex-col justify-center rounded-[11px] border border-[#e6e8ee] bg-white px-4 py-[16px] dark:border-[var(--inv-card-border)] dark:bg-[#131418]">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="text-[25px] leading-none font-bold tracking-[-.02em] text-[#363b44] dark:text-[var(--inv-value)]">
            {value}
          </div>
          {graphic ? (
            <div
              className={cn(
                "relative grid h-[46px] w-[48px] shrink-0 place-items-center",
                "[&_iconify-icon]:relative [&_iconify-icon]:z-1 [&_iconify-icon]:[grid-area:1/1] [&_iconify-icon]:size-[27px] [&_iconify-icon]:place-self-center [&_iconify-icon]:text-[27px] [&_iconify-icon]:leading-none [&_iconify-icon]:text-current",
                "[&_svg]:relative [&_svg]:z-1 [&_svg]:[grid-area:1/1] [&_svg]:size-[27px] [&_svg]:place-self-center [&_svg]:text-current",
                accentClass[accent],
              )}
            >
              <span className="absolute size-[46px] rounded-full bg-current opacity-10" />
              {dots ? (
                <>
                  <span className={cn(DOT, "top-0.5 right-1.5 size-[5px]")} />
                  <span className={cn(DOT, "bottom-[5px] left-1 size-1")} />
                  <span className={cn(DOT, "top-[18px] right-0 size-[3px]")} />
                </>
              ) : null}
              {graphic}
            </div>
          ) : null}
        </div>
        {foot ? (
          <div className="mt-1.5 text-[11px] font-medium text-[#828b9b] [&_a]:font-bold [&_a]:text-[var(--inv-brand-ink)] [&_a]:hover:underline">
            {foot}
          </div>
        ) : null}
      </div>
      <div className="order-2 mx-[7px] mt-[7px] mb-[5px] flex items-center justify-between bg-[image:var(--inv-hatch)]">
        <div className="text-[10.5px] font-bold tracking-[.05em] text-[#5a6474] uppercase dark:text-[var(--inv-title)]">
          {label}
        </div>
        {headIcon ? (
          <span className="grid shrink-0 place-items-center [&_iconify-icon]:block [&_iconify-icon]:text-[14px] [&_iconify-icon]:text-[#98a0af] [&_svg]:size-[14px] [&_svg]:text-[#98a0af]">
            {headIcon}
          </span>
        ) : null}
      </div>
    </div>
  );
}
