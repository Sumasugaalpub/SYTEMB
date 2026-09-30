"use client";

import Link from "next/link";
import { format } from "date-fns";

import { useStore } from "@/lib/store";
import { OfflineBanner } from "./OfflineBanner";

/**
 * Mobile web. On a phone the frame disappears and the app fills the screen;
 * on a desktop it is drawn inside a handset so the demo reads correctly.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const offline = useStore((s) => s.offline);
  return (
    <div className="flex min-h-[calc(100vh/0.9)] items-start justify-center bg-[var(--pms-canvas)] sm:px-4 sm:py-8">
      <div className="relative w-full max-w-none overflow-hidden bg-white sm:max-w-sm sm:rounded-[38px] sm:border-[10px] sm:border-[#171a20] sm:shadow-[0_30px_70px_rgba(16,24,40,.25)] dark:bg-[#111214]">
        <div className="hidden items-center justify-between bg-[#171a20] px-6 pt-1 pb-2 text-[11px] font-semibold text-white sm:flex">
          <span>{format(new Date(), "HH:mm")}</span>
          <span className="h-5 w-24 rounded-full bg-black" />
          <span className="flex items-center gap-1">
            <iconify-icon icon={offline ? "solar:cloud-cross-linear" : "solar:wi-fi-router-linear"} />
            <iconify-icon icon="solar:battery-full-linear" />
          </span>
        </div>
        <div className="flex items-center gap-2 border-b border-[var(--inv-line)] px-4 py-2.5">
          <Link
            href="/district"
            className="grid size-8 place-items-center rounded-[10px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)]"
            aria-label="Home"
          >
            <iconify-icon icon="solar:home-smile-linear" className="text-[18px]" />
          </Link>
          <div className="flex-1 leading-tight">
            <div className="text-[13px] font-bold text-[var(--inv-value)]">Raad-Raac</div>
            <div className="text-[10.5px] text-[var(--inv-muted)]">Berdale · Bay · South West</div>
          </div>
        </div>
        {offline ? <OfflineBanner /> : null}
        <div className="min-h-[70vh] sm:h-[680px] sm:min-h-0 sm:overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
