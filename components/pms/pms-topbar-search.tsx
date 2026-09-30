"use client";

import type { Ref } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Matches `dashboard-main` header search — use everywhere for one consistent navbar search. */
export const PMS_TOPBAR_SEARCH_MAX = 256;

/** Round icon buttons (profile, messages, notifications) — matches dashboard `size="icon"` row. */
export const PMS_TOPBAR_ROUND_ICON_BUTTON_CLASS =
  "size-11 rounded-[10px] border-[color:var(--pms-icon-button-border)] bg-[var(--pms-icon-button-bg)] text-[var(--pms-icon-button-fg)] shadow-none transition-colors hover:bg-[var(--pms-sidebar-icon-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--pms-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pms-canvas)]";

export type PmsTopbarSearchFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hint?: string;
  hintId?: string;
  onSubmit?: () => void;
  labelRef?: Ref<HTMLLabelElement>;
  size?: "default" | "compact";
  className?: string;
  inputClassName?: string;
};

export function PmsTopbarSearchField({
  value,
  onChange,
  placeholder = "Search Anything...",
  hint,
  hintId = "pms-topbar-search-hint",
  onSubmit,
  labelRef,
  size = "default",
  className,
  inputClassName,
}: PmsTopbarSearchFieldProps) {
  const compact = size === "compact";

  return (
    <label
      ref={labelRef}
      className={cn(
        "relative flex items-center",
        compact
          ? "h-9 min-w-[10.5rem] shrink-0 sm:min-w-[12rem]"
          : "min-h-11 min-w-[200px] flex-1 lg:min-w-[320px]",
        className,
      )}
    >
      <span className="sr-only">Search</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, PMS_TOPBAR_SEARCH_MAX))}
        maxLength={PMS_TOPBAR_SEARCH_MAX}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-describedby={hint ? hintId : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={cn(
          "border-[color:var(--pms-search-border)] bg-[var(--pms-search-bg)] text-[var(--pms-text)] placeholder:text-[var(--pms-muted-text)] focus-visible:border-[var(--pms-primary)] focus-visible:ring-[var(--pms-primary)]/25",
          compact
            ? "h-9 rounded-[var(--pms-radius-control)] pr-9 pl-2.5 text-[12px] leading-normal shadow-none"
            : "h-11 rounded-[var(--pms-radius-control)] pr-12 pl-4 text-sm",
          inputClassName,
        )}
      />
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
      <Button
        type="button"
        size="icon"
        title="Search"
        onClick={() => onSubmit?.()}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-[10px] border-0 bg-[var(--pms-cta-bg)] text-[var(--pms-cta-fg)] hover:bg-[var(--pms-cta-hover)] focus-visible:ring-2 focus-visible:ring-[var(--pms-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pms-search-bg)]",
          compact ? "right-1 size-7" : "right-1.5 size-8",
        )}
      >
        <Search className={compact ? "size-3 stroke-[1.75]" : "size-4"} aria-hidden />
        <span className="sr-only">Submit search</span>
      </Button>
    </label>
  );
}
