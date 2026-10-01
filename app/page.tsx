"use client";

import Link from "next/link";
import { useTheme } from "next-themes";

import { Logo } from "@/components/shell/Logo";

/**
 * Demo sign-in for the whole system: pick the portal you work in.
 * No password is checked anywhere in this prototype, and the page says so.
 */
const PORTALS = [
  {
    href: "/executive",
    icon: "solar:chart-square-linear",
    name: "Federal Executive",
    text: "National monitoring, conflict intelligence, reports and maps.",
    who: "Federal ministries",
  },
  {
    href: "/state",
    icon: "solar:map-arrow-square-linear",
    name: "Federal Member State",
    text: "Review district reports, manage state data and sharing.",
    who: "State offices",
  },
  {
    href: "/mobile",
    icon: "solar:smartphone-2-linear",
    name: "District Field App",
    text: "Send reports and evidence from the field, even offline.",
    who: "District officers",
  },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-11 place-items-center rounded-full border border-[var(--pms-border-card)] bg-[var(--pms-surface)] text-[var(--pms-text-strong)]"
    >
      <iconify-icon icon={dark ? "solar:sun-2-linear" : "solar:moon-linear"} className="text-[20px]" />
    </button>
  );
}

export default function SignIn() {
  return (
    <div className="h-[calc(100dvh/0.9)] overflow-y-auto bg-[var(--pms-canvas)] font-display text-[var(--pms-text-strong)]">
      <div className="mx-auto flex min-h-full max-w-[1080px] flex-col px-4 sm:px-8">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[12px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_svg]:size-6">
              <Logo />
            </span>
            <span className="text-[18px] font-extrabold tracking-[-0.01em]">Raad-Raac</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 flex-col justify-center gap-8 pt-4 pb-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <svg viewBox="0 0 64 64" width={64} height={64} aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="#4189dd" />
              <path d="M32 12l4.7 14.4H52l-12.3 8.9 4.7 14.4L32 40.8l-12.3 8.9 4.7-14.4L12 26.4h15.3z" fill="#fff" />
            </svg>
            <h1 className="text-[34px] leading-tight font-extrabold tracking-[-0.02em]">Sign in</h1>
            <p className="text-[16px] font-semibold text-[var(--pms-muted-text)]">Choose the portal you work in.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PORTALS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group flex flex-col gap-5 rounded-[18px] border border-[var(--pms-border-card)] bg-[var(--pms-surface)] p-6 text-[var(--pms-text-strong)] no-underline shadow-[var(--pms-card-shadow)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--inv-brand)] focus-visible:border-[var(--inv-brand)] focus-visible:outline-none"
              >
                <span className="grid size-14 place-items-center rounded-[16px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)]">
                  <iconify-icon icon={p.icon} className="text-[28px]" />
                </span>
                <span className="flex flex-col gap-2">
                  <span className="text-[20px] font-extrabold tracking-[-0.01em]">{p.name}</span>
                  <span className="text-[15px] leading-[1.45] text-[var(--pms-muted-text)]">{p.text}</span>
                </span>
                <span className="mt-auto flex items-center justify-between">
                  <span className="rounded-full bg-[var(--pms-surface-muted)] px-3 py-1 text-[13px] font-bold text-[var(--pms-text)]">{p.who}</span>
                  <span className="grid size-10 place-items-center rounded-full bg-[var(--pms-cta-bg)] text-[var(--pms-cta-fg)] transition-transform group-hover:translate-x-0.5">
                    <iconify-icon icon="solar:alt-arrow-right-linear" className="text-[20px]" />
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <p className="flex items-center justify-center gap-2 text-[14px] font-semibold text-[var(--pms-muted-text)]">
            <span className="rounded-full border border-[var(--pms-border-card)] px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase">Demo</span>
            No password is checked in this prototype.
          </p>
        </main>
      </div>
    </div>
  );
}
