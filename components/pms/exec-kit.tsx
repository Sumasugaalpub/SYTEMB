"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   The dashboard's vocabulary, reused by the executive pages: counter tiles,
   hairline rows, definition grids, tinted strips and toolbar controls.
--------------------------------------------------------------------------- */

export type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "accent";

/** Tinted tones cycled across a row of counter tiles, in the dashboard's order. */
export const TILE_TONE: readonly Tone[] = ["success", "warning", "info", "accent", "neutral"] as const;

export function toneStyle(tone: Tone) {
  return { backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` };
}

const TILE =
  "rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]";

/** A counter tile: 12px muted label, 20px bold value, tinted pill right. */
export function CounterTile({
  icon,
  label,
  value,
  pill,
  tone = "info",
  href,
  onClick,
  active,
  className,
}: {
  icon?: string;
  label: string;
  value: React.ReactNode;
  pill?: React.ReactNode;
  tone?: Tone;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        {icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle(tone)}>
            <iconify-icon icon={icon} className="text-[15px]" />
          </span>
        ) : null}
        <span className="min-w-0 truncate text-xs font-medium text-[var(--pms-muted-text)]">{label}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{value}</span>
        {pill !== undefined && pill !== null ? (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums" style={toneStyle(tone)}>
            {pill}
          </span>
        ) : null}
      </div>
    </>
  );
  const shell = cn(
    TILE,
    "block min-w-0 text-left no-underline",
    (href || onClick) && "transition-colors hover:bg-[var(--pms-row-hover)]",
    active && "border-[color:var(--pms-primary)]",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={cn(shell, "w-full")}>
        {body}
      </button>
    );
  }
  return <div className={shell}>{body}</div>;
}

/** A hairline-separated row: tinted square left, 13px semibold label, 11px meta, value right. */
export function Row({
  icon,
  tone = "neutral",
  badge,
  title,
  meta,
  right,
  href,
  onClick,
  active,
}: {
  icon?: string;
  tone?: Tone;
  badge?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <>
      {icon || badge ? (
        <span
          className="grid size-8 shrink-0 place-items-center rounded-[9px] text-[12px] font-bold"
          style={toneStyle(tone)}
        >
          {icon ? <iconify-icon icon={icon} className="text-[16px]" /> : badge}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-[11px] text-[var(--pms-muted-text)]">{meta}</span> : null}
      </span>
      {right ? <span className="flex shrink-0 items-center gap-2">{right}</span> : null}
    </>
  );
  const shell = cn(
    "flex w-full items-center gap-3 px-5 py-2.5 text-left no-underline sm:px-6",
    (href || onClick) && "transition-colors hover:bg-[var(--pms-row-hover)]",
    active && "bg-[var(--pms-row-hover)]",
  );
  const inner = href ? (
    <Link href={href} className={shell}>
      {body}
    </Link>
  ) : onClick ? (
    <button type="button" onClick={onClick} className={shell}>
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  );
  return <li className="border-t border-[color:var(--pms-divide)] first:border-t-0">{inner}</li>;
}

/** Definition grid — label above value, two columns on anything wider than a phone. */
export function DefGrid({
  items,
  className,
}: {
  items: readonly (readonly [string, React.ReactNode])[];
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2", className)}>
      {items.map(([k, v], i) => (
        <div
          key={k}
          className={cn(
            "flex items-center justify-between gap-3 border-t border-[color:var(--pms-divide)] py-2.5",
            i < 2 && "sm:border-t-0",
            i === 0 && "border-t-0",
          )}
        >
          <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--pms-muted-text)]">
            {k}
          </dt>
          <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-[var(--pms-text-strong)]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One tinted inline strip — a warning, a status or a result, never a paragraph block. */
export function Strip({
  tone = "warning",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-start gap-2.5 rounded-[12px] px-3.5 py-2.5 text-[12.5px] font-medium", className)}
      style={toneStyle(tone)}
    >
      {icon ? <iconify-icon icon={icon} className="mt-[1px] shrink-0 text-[16px]" /> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

/** Toolbar select / input — the compact control used inside a card header. */
export const TOOLBAR_FIELD =
  "h-8 min-w-0 max-w-full rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] bg-[var(--pms-surface)] px-2 text-[12px] text-[var(--pms-text)]";

/** Form field inside a dialog or a step. */
export const FORM_FIELD =
  "h-9 w-full min-w-0 rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-2.5 text-[13px] text-[var(--pms-text)]";

/** Small field label. */
export const FIELD_LABEL = "text-[12px] font-semibold text-[var(--pms-text-strong)]";

/** Caption line under a card body. */
export const CAPTION = "text-[11px] text-[var(--pms-muted-text)]";

/** Wraps a card header toolbar so it wraps instead of scrolling on a phone. */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>{children}</div>;
}
