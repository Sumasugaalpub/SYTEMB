"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { ScopeFilters } from "./scope-filters";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportDialog } from "@/components/shell/popups/ExportDialog";

/** One card shell for the whole system — same radius, border, shadow and surface as the dashboard. */
export function PmsCard({
  title,
  action,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-[var(--pms-radius-card)] border border-[color:var(--pms-shell-card-border)] bg-[var(--pms-surface)] py-0 shadow-[var(--pms-card-shadow)] ring-0",
        className,
      )}
    >
      {title ? (
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-[color:var(--pms-divide)] px-5 pb-3 pt-4">
          <CardTitle className="text-base font-semibold text-[var(--pms-text-strong)]">{title}</CardTitle>
          {action}
        </CardHeader>
      ) : null}
      <CardContent className={cn(flush ? "px-0 pb-0 pt-0" : "px-5 pb-5 pt-4", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}

/** Page title row. One line of context, never a paragraph. */
const ROUND =
  "size-9 rounded-[10px] border-[color:var(--pms-icon-button-border)] bg-[var(--pms-icon-button-bg)] text-[var(--pms-icon-button-fg)] shadow-none hover:bg-[var(--pms-sidebar-icon-hover-bg)]";

/** Prints the current page (A4 print styles apply). */
export const printPage = () => window.print();

/** The page's Export dialog: call the opener from the header, render the element anywhere in the page. */
export function useExportDialog() {
  const [open, setOpen] = React.useState(false);
  const openExport = React.useCallback(() => setOpen(true), []);
  return [openExport, <ExportDialog key="export" open={open} onOpenChange={setOpen} />] as const;
}

/**
 * Print and Export icon buttons for the top-right of a page header. They act on
 * this page only, so they live with the page rather than in the global top bar.
 */
export function PageActions({
  onPrint,
  onExport,
  exportDisabled,
}: {
  onPrint?: () => void;
  onExport?: () => void;
  /** Shows Export greyed out, for pages that forbid exports. */
  exportDisabled?: boolean;
}) {
  if (!onPrint && !onExport && !exportDisabled) return null;
  return (
    <div className="flex items-center gap-1.5">
      {onPrint ? (
        <Button variant="outline" size="icon" title="Print this page (A4)" className={ROUND} onClick={onPrint}>
          <iconify-icon icon="solar:printer-minimalistic-linear" className="text-[18px]" />
        </Button>
      ) : null}
      {exportDisabled ? (
        // A disabled button swallows pointer events, so the tooltip sits on a wrapper.
        <span title="Exports are not permitted from this page" className="inline-flex cursor-not-allowed">
          <Button variant="outline" size="icon" disabled aria-label="Export (not permitted)" className={cn(ROUND, "opacity-40")}>
            <iconify-icon icon="solar:download-minimalistic-linear" className="text-[18px]" />
          </Button>
        </span>
      ) : onExport ? (
        <Button variant="outline" size="icon" title="Export" className={ROUND} onClick={onExport}>
          <iconify-icon icon="solar:download-minimalistic-linear" className="text-[18px]" />
        </Button>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  meta,
  actions,
  filters,
  onPrint,
  onExport,
  exportDisabled,
}: {
  title: string;
  meta?: string;
  actions?: React.ReactNode;
  /** Show the as-at date, period and region pickers for this page. */
  filters?: boolean;
  onPrint?: () => void;
  onExport?: () => void;
  exportDisabled?: boolean;
}) {
  const setPageHead = useStore((s) => s.setPageHead);
  // The title lives in the top bar, the same way the reference dashboard does it.
  React.useEffect(() => {
    setPageHead({ title, meta });
  }, [title, meta, setPageHead]);

  const tools = onPrint || onExport || exportDisabled;
  if (!actions && !tools && !filters) return null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      {filters ? <ScopeFilters /> : <span />}
      {actions || tools ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <PageActions onPrint={onPrint} onExport={onExport} exportDisabled={exportDisabled} />
        </div>
      ) : null}
    </header>
  );
}

const PILL_TONE = {
  neutral: "bg-[var(--pms-segmented-track)] text-[var(--pms-muted-text)]",
  info: "bg-[var(--pms-icon-info-bg)] text-[var(--pms-icon-info-fg)]",
  good: "bg-[var(--pms-icon-success-bg)] text-[var(--pms-icon-success-fg)]",
  warn: "bg-[var(--pms-icon-warning-bg)] text-[var(--pms-icon-warning-fg)]",
  bad: "bg-[var(--pms-icon-danger-bg)] text-[var(--pms-icon-danger-fg)]",
  accent: "bg-[var(--pms-icon-accent-bg)] text-[var(--pms-icon-accent-fg)]",
} as const;

export type PillTone = keyof typeof PILL_TONE;

export function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        PILL_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Round icon chip — the same 40px circle used on the dashboard stat strip. */
export function IconChip({
  icon,
  tone = "info",
  size = 40,
}: {
  icon: string;
  tone?: "neutral" | "success" | "info" | "warning" | "danger" | "accent";
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: `var(--pms-icon-${tone}-bg)`,
        color: `var(--pms-icon-${tone}-fg)`,
      }}
    >
      <iconify-icon icon={icon} style={{ fontSize: Math.round(size * 0.5) }} />
    </span>
  );
}

export function EmptyState({ icon = "solar:inbox-linear", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <IconChip icon={icon} tone="neutral" size={48} />
      <p className="text-sm font-semibold text-[var(--pms-text-strong)]">{title}</p>
      {hint ? <p className="max-w-xs text-xs text-[var(--pms-muted-text)]">{hint}</p> : null}
    </div>
  );
}

/** Every figure carries where it came from. Never a bare number. */
export function Provenance({
  reported,
  total,
  source = "District Returns",
  period = "Q1 2026",
  quality,
  className,
}: {
  reported: number;
  total: number;
  source?: string;
  period?: string;
  quality?: string;
  className?: string;
}) {
  const asAt = useStore((s) => s.asAt);
  return (
    <p className={cn("text-[11.5px] leading-[1.5] text-[var(--pms-muted-text)]", className)}>
      {reported} of {total} districts reported · {source} · {period} · as at {fmtDate(asAt)}
      {quality ? ` · ${quality}` : ""}
    </p>
  );
}

export function LinkAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[var(--pms-muted-text)] no-underline underline-offset-4 transition-colors hover:text-[var(--pms-text-strong)] hover:underline"
    >
      {children}
    </Link>
  );
}

/** Grey block — missing data is shown, never rendered as zero. */
export function NoData({ label = "No data received" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-[var(--pms-segmented-track)] px-3 py-2 text-xs font-medium text-[var(--pms-muted-text)]">
      <iconify-icon icon="solar:minus-circle-linear" className="text-[15px]" />
      {label}
    </div>
  );
}
