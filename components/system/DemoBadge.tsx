import { cn } from "@/lib/utils";

/** Anything not real wears this. Honesty, visibly. */
export function DemoBadge({ label, className }: { label?: string; className?: string }) {
  return (
    <span
      title="Simulated in this prototype"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-[color:var(--pms-hairline-border)] bg-[var(--pms-segmented-track)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--pms-muted-text)]",
        className,
      )}
    >
      Demo{label ? ` · ${label}` : ""}
    </span>
  );
}
