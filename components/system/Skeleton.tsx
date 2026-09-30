"use client";

import { cn } from "@/lib/utils";

/** Shown for ~350ms before a list or dashboard paints. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-[10px] bg-[var(--pms-segmented-track)]"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonBlock({ height = 240, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--pms-radius-card)] bg-[var(--pms-segmented-track)]", className)}
      style={{ height }}
      aria-hidden
    />
  );
}
