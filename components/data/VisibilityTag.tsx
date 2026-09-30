import { cn } from "@/lib/utils";
import { VISIBILITY_META, type Visibility } from "@/lib/visibility";

export function VisibilityTag({ level }: { level: Visibility }) {
  const m = VISIBILITY_META[level];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[20px] px-2.5 py-[3px] text-[11px] font-bold whitespace-nowrap", m.tone)}>
      <iconify-icon icon={m.icon} className="text-[12px]" />
      {m.label}
    </span>
  );
}
