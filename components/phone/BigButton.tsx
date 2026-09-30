import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = { icon?: string; children: React.ReactNode; sub?: string; tone?: "brand" | "dark" | "outline" | "red"; href?: string; onClick?: () => void; disabled?: boolean; selected?: boolean; className?: string };

const TONES = {
  brand: "bg-[var(--inv-brand)] text-[var(--inv-brand-on)] border-[var(--inv-brand)] hover:bg-[var(--inv-brand-hover)]",
  dark: "bg-[#171a20] text-white border-[#171a20] hover:bg-black",
  outline: "bg-white text-[var(--inv-value)] border-[var(--inv-card-border)] hover:bg-[#f7f8fa] dark:bg-[#131418]",
  red: "bg-[#fdecec] text-[var(--inv-red)] border-[#f6c9c9] dark:bg-[rgba(217,74,74,.14)]",
};

/** 60px+ touch target for low-literacy, one-thumb use. */
export function BigButton({ icon, children, sub, tone = "brand", href, onClick, disabled, selected, className }: Props) {
  const cls = cn(
    "flex min-h-[60px] w-full items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-3 text-left text-[15px] font-bold no-underline transition-colors disabled:opacity-40",
    TONES[tone],
    selected && "border-[var(--inv-brand)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] ring-2 ring-[var(--inv-brand-bd)]",
    className,
  );
  const body = (
    <>
      {icon ? <iconify-icon icon={icon} className="shrink-0 text-[26px]" /> : null}
      <span className="flex-1">
        {children}
        {sub ? <span className="mt-0.5 block text-[12px] font-medium opacity-75">{sub}</span> : null}
      </span>
      {href ? <iconify-icon icon="solar:alt-arrow-right-linear" className="text-[20px] opacity-70" /> : null}
    </>
  );
  if (href && !disabled) return <Link href={href} className={cls}>{body}</Link>;
  return <button type="button" className={cls} onClick={onClick} disabled={disabled}>{body}</button>;
}
