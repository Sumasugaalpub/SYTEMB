"use client";

import * as React from "react";
import Link from "next/link";

import { roleById, USERS } from "@/data/users";
import type { Notification } from "@/data/notifications";
import { TIMELINE } from "@/data/timeline";
import { ENTITY } from "@/lib/entities";
import { useEnabledLanguages } from "@/lib/settings";
import { hasMessages, useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PmsThemeToggle } from "@/components/pms/pms-theme";
import { NotificationsPanel } from "./popups/NotificationsPanel";

const ROUND =
  "size-11 rounded-full border-[color:var(--pms-icon-button-border)] bg-[var(--pms-icon-button-bg)] text-[var(--pms-icon-button-fg)] shadow-none hover:bg-[var(--pms-sidebar-icon-hover-bg)]";

/**
 * The language control. It offers exactly the languages System settings has
 * switched on — when English is the only one enabled it says so, rather than
 * listing options that go nowhere.
 */
function LanguagePicker() {
  const languages = useEnabledLanguages();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", down);
    return () => window.removeEventListener("mousedown", down);
  }, [open]);

  const current = languages.find((l) => l.id === lang) ?? languages[0];

  if (languages.length < 2) {
    return (
      <Link
        href="/settings"
        title={`${current?.label ?? "English"} is the only language enabled in system settings`}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--pms-icon-button-border)] bg-[var(--pms-icon-button-bg)] px-3.5 text-[12.5px] font-medium text-[var(--pms-icon-button-fg)] no-underline hover:bg-[var(--pms-sidebar-icon-hover-bg)]"
      >
        <iconify-icon icon="solar:global-linear" className="text-[18px]" />
        <span className="hidden sm:inline">{current?.label ?? "English"} only</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        title="Language"
        className="h-11 gap-2 rounded-full border-[color:var(--pms-icon-button-border)] bg-[var(--pms-icon-button-bg)] px-3.5 text-[12.5px] font-medium text-[var(--pms-icon-button-fg)] shadow-none hover:bg-[var(--pms-sidebar-icon-hover-bg)]"
        onClick={() => setOpen((v) => !v)}
      >
        <iconify-icon icon="solar:global-linear" className="text-[18px]" />
        <span className="hidden sm:inline">{current?.label ?? "English"}</span>
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-56 rounded-[12px] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-surface)] p-1.5 shadow-[var(--pms-card-shadow)]">
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--pms-muted-text)]">
            Language
          </p>
          {languages.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setLang(l.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm text-[var(--pms-text)] hover:bg-[var(--pms-row-hover)]"
            >
              <span className="min-w-0 flex-1 truncate">
                {l.label}
                {hasMessages(l.id) ? null : (
                  <span className="ml-1.5 text-[11px] text-[var(--pms-muted-text)]">
                    {l.complete}% translated
                  </span>
                )}
              </span>
              {l.id === current?.id ? (
                <iconify-icon icon="solar:check-circle-bold" className="text-[16px] text-[var(--pms-icon-info-fg)]" />
              ) : null}
            </button>
          ))}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[12px] text-[var(--pms-muted-text)] no-underline hover:bg-[var(--pms-row-hover)]"
          >
            <iconify-icon icon="solar:settings-linear" className="text-[15px]" />
            Manage languages
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** The global top bar. Wraps every page in the executive and state portals. */
export function TopBar() {
  const { region, role, pageHead } = useStore();
  const signedIn = USERS.find((u) => u.role === role);
  const notifications = useCollection<Notification>(ENTITY.notifications);
  const [notif, setNotif] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => n.unread).length;

  React.useEffect(() => {
    if (!menu) return;
    const down = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("mousedown", down);
    return () => window.removeEventListener("mousedown", down);
  }, [menu]);

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2.5 border-none bg-[var(--pms-canvas)]/95 px-3 pt-2.5 pb-4 backdrop-blur lg:gap-3 lg:px-5 lg:pt-3 lg:pb-5">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--pms-text-strong)] lg:text-[28px] lg:leading-tight">
          {pageHead.title}
        </h1>
        {pageHead.meta ? (
          <p className="mt-1 truncate text-sm text-[var(--pms-muted-text)] lg:text-[15px]">{pageHead.meta}</p>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="outline" size="icon" title="Notifications" className={ROUND} onClick={() => setNotif(true)}>
          <span className="relative inline-flex">
            <iconify-icon icon="solar:bell-linear" className="text-[20px]" />
            {unread ? (
              <span className="absolute -right-1.5 -top-1.5 grid size-[18px] place-items-center rounded-full bg-[var(--pms-danger)] text-[10px] font-bold leading-none text-white ring-2 ring-[var(--pms-badge-ring)]">
                {unread}
              </span>
            ) : null}
          </span>
        </Button>

        <LanguagePicker />

        <PmsThemeToggle className="size-11" />

        <div ref={menuRef} className="relative">
          <Button variant="outline" size="icon" title="Account" className={ROUND} onClick={() => setMenu((m) => !m)}>
            <iconify-icon icon="solar:user-circle-linear" className="text-[20px]" />
          </Button>
          {menu ? (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-56 rounded-[12px] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-surface)] p-1.5 shadow-[var(--pms-card-shadow)]">
              <div className="rounded-[10px] px-3 pb-2 pt-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--pms-muted-text)]">Account</p>
                <p className="mt-1 text-sm font-semibold text-[var(--pms-text-strong)]">{signedIn?.name ?? "Admin User"}</p>
                <p className="text-[11.5px] text-[var(--pms-muted-text)]">
                  {roleById(role).name} · {signedIn?.institution ?? "MOIFAR"}
                </p>
                <p className="text-[11.5px] text-[var(--pms-muted-text)]">
                  Clearance: {roleById(role).clearance} · scope: {region === "all" ? "national" : region}
                </p>
              </div>
              <Link href="/audit-log?mine=1" onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm text-[var(--pms-text)] no-underline hover:bg-[var(--pms-row-hover)]">
                <iconify-icon icon="solar:history-2-linear" className="text-[16px] text-[var(--pms-muted-text)]" />
                My activity
              </Link>
              <Link
                href="/district/sign-in"
                onClick={() => setMenu(false)}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm text-[var(--pms-text)] no-underline hover:bg-[var(--pms-row-hover)]"
              >
                <iconify-icon icon="solar:logout-3-linear" className="text-[16px] text-[var(--pms-muted-text)]" />
                Sign out
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <NotificationsPanel open={notif} onOpenChange={setNotif} />
    </div>
  );
}
