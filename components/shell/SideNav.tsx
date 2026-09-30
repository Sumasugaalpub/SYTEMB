"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "./Logo";
import { isActive, type NavItem, type RailGroup } from "./nav";

/** Level 1 — the 72px icon rail. */
export function IconRail({ groups, activeKey, onSelect }: { groups: RailGroup[]; activeKey: string; onSelect: (key: string) => void }) {
  const toggle = useStore((s) => s.toggleSidebar);
  const t = useTranslations();

  return (
    <aside className="[&_svg]:block flex min-h-0 flex-col items-center gap-[5px] overflow-y-auto border-r border-[var(--inv-line)] bg-[#fcfcfd] pt-[10px] pb-[14px] max-[900px]:hidden dark:border-[var(--inv-card-border)] dark:bg-[#0c0d10]">
      <button
        type="button"
        className="mb-1.5 hidden size-[42px] shrink-0 cursor-pointer place-items-center rounded-[12px] border-none bg-transparent text-[var(--inv-icon)] group-data-collapsed/shell:grid hover:bg-[#e7e7e9] hover:text-[#4a525e] [&_iconify-icon]:text-[22px]"
        aria-label={t("app.expand")}
        onClick={toggle}
      >
        <iconify-icon icon="solar:sidebar-minimalistic-linear" />
      </button>

      <div className="mb-[14px] grid h-[50px] w-full shrink-0 place-items-center">
        <Link href="/executive" aria-label={t("app.name")} className="grid size-[34px] place-items-center rounded-[10px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_svg]:size-[22px]">
          <Logo />
        </Link>
      </div>

      {groups.map((group) => (
        <Tooltip key={group.key}>
          <TooltipTrigger asChild>
            <a
              role="button"
              tabIndex={0}
              aria-current={activeKey === group.key ? "true" : undefined}
              className={cn(
                "relative grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-[12px] transition-[background-color,color] duration-150 [&_iconify-icon]:text-[21px]",
                group.bottom && "mt-auto",
                activeKey === group.key
                  ? "bg-[#171a20] text-white [&_iconify-icon]:text-white dark:border-[1.5px] dark:border-[rgba(255,255,255,.14)] dark:bg-[#1d1e24]"
                  : "text-[var(--inv-icon)] [&_iconify-icon]:text-[var(--inv-icon)] hover:bg-[#eef0f3] hover:[&_iconify-icon]:text-[var(--inv-dark)] dark:hover:bg-[#1e2027] dark:hover:[&_iconify-icon]:text-[var(--inv-value)]",
              )}
              onClick={() => onSelect(group.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(group.key);
                }
              }}
            >
              <iconify-icon icon={group.icon} />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">{t(`groups.${group.key}`)}</TooltipContent>
        </Tooltip>
      ))}
    </aside>
  );
}

/**
 * The command palette behind the search button and ⌘K / Ctrl+K. Every nav item
 * in the portal, filtered as you type; Enter opens the highlighted one, Escape
 * closes.
 */
function CommandPalette({
  open,
  onOpenChange,
  groups,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: RailGroup[];
}) {
  const router = useRouter();
  const t = useTranslations();
  const [q, setQ] = React.useState("");
  const [cursor, setCursor] = React.useState(0);

  const all = React.useMemo(
    () =>
      groups.flatMap((g) =>
        g.items.map((item) => ({ item, group: t(`groups.${g.key}`), label: t(`nav.${item.key}`) })),
      ),
    [groups, t],
  );

  const needle = q.trim().toLowerCase();
  const hits = needle
    ? all.filter((r) => `${r.label} ${r.group} ${r.item.href}`.toLowerCase().includes(needle))
    : all;

  React.useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
    }
  }, [open]);

  React.useEffect(() => {
    setCursor(0);
  }, [needle]);

  function go(item: NavItem) {
    onOpenChange(false);
    router.push(item.href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-3 p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t("app.search")}</DialogTitle>
        </DialogHeader>
        <div className="border-b border-[color:var(--pms-divide)] px-3 pt-3 pb-3">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("app.search")}
            aria-label={t("app.search")}
            className="h-10 rounded-[10px]"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => (hits.length ? (c + 1) % hits.length : 0));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => (hits.length ? (c - 1 + hits.length) % hits.length : 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (hits[cursor]) go(hits[cursor].item);
              }
            }}
          />
        </div>
        <ul className="max-h-[320px] overflow-y-auto px-2 pb-3">
          {hits.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px] text-[var(--pms-muted-text)]">Nothing matches “{q}”.</li>
          ) : (
            hits.map((r, i) => (
              <li key={r.item.href}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(r.item)}
                  aria-current={i === cursor ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-[13.5px] transition-colors",
                    i === cursor ? "bg-[var(--pms-row-hover)] text-[var(--pms-text-strong)]" : "text-[var(--pms-text)]",
                  )}
                >
                  <iconify-icon icon={r.item.icon} className="shrink-0 text-[18px] text-[var(--pms-muted-text)]" />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                  <span className="shrink-0 text-[11px] text-[var(--pms-muted-text)]">{r.group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Level 2 — the 208px contextual panel for the selected rail group. */
export function SidePanel({
  group,
  groups = [],
  cta,
}: {
  group?: RailGroup;
  /** Every group in this portal — the command palette searches all of them. */
  groups?: RailGroup[];
  cta?: { label: string; href: string };
}) {
  const toggle = useStore((s) => s.toggleSidebar);
  const pathname = usePathname();
  const t = useTranslations();
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <aside className="[&_svg]:block flex min-h-0 flex-col overflow-hidden border-r border-[var(--inv-line)] bg-[#fefeff] px-4 pt-[10px] pb-[14px] whitespace-nowrap transition-opacity duration-[220ms] ease-[ease] group-data-collapsed/shell:pointer-events-none group-data-collapsed/shell:opacity-0 max-[900px]:hidden dark:border-[var(--inv-card-border)] dark:bg-[#0c0d10]">
      <div className="mx-[-16px] mb-[14px] flex h-[50px] shrink-0 items-center justify-between gap-2 border-b border-b-[#edeff2] pr-[22px] pl-6 dark:border-b-[var(--inv-card-border)]">
        <div className="mt-[3px] truncate text-[18px] leading-[1.1] font-bold text-[var(--inv-value)]">
          {group ? t(`groups.${group.key}`) : t("app.menu")}
        </div>
        <button
          type="button"
          className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[var(--inv-card-border)] bg-white text-[var(--inv-icon)] transition-[background-color,color] duration-[120ms] hover:bg-[#f3f3f4] hover:text-[#5a5d63] dark:bg-[#131418] [&_iconify-icon]:text-[16px]"
          aria-label={t("app.collapse")}
          onClick={toggle}
        >
          <iconify-icon icon="solar:sidebar-minimalistic-linear" />
        </button>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={groups.length ? groups : group ? [group] : []} />

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="mb-[14px] flex h-10 w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-[12px] border border-[#E5E7EB] bg-white px-[13px] text-[#6B7280] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[#D1D5DB] hover:bg-[#FCFCFD] focus-visible:border-[var(--inv-brand)] focus-visible:shadow-[0_0_0_3px_rgba(146,194,240,.12)] focus-visible:outline-none dark:border-[var(--inv-card-border)] dark:bg-[#131418] dark:text-[var(--inv-muted)] dark:hover:border-[rgba(255,255,255,.14)] dark:hover:bg-[#17181c]"
        aria-label={t("app.search")}
      >
        <iconify-icon icon="solar:magnifer-linear" className="shrink-0 text-[18px]" />
        <span className="flex-1 overflow-hidden text-left text-[14px] font-medium text-ellipsis whitespace-nowrap">{t("app.search")}</span>
        <span className="flex shrink-0 items-center gap-0.5 rounded-[6px] border border-[#E5E7EB] bg-[#F3F4F6] px-[7px] py-0.5 text-[12px] font-semibold dark:border-[var(--inv-card-border)] dark:bg-[#1c1d22]">⌘ K</span>
      </button>

      <nav className="flex min-h-0 flex-col overflow-y-auto pt-0" aria-label="Main">
        {group?.items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mb-0.5 flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium no-underline transition-[background-color,color] duration-150 [&>span]:overflow-hidden [&>span]:text-ellipsis [&_iconify-icon]:shrink-0 [&_iconify-icon]:text-[19px] [&_iconify-icon]:transition-[font-size,transform] [&_iconify-icon]:duration-150",
                active
                  ? "font-semibold text-[var(--inv-brand-active)] [&_iconify-icon]:text-[var(--inv-brand-active)] [&_iconify-icon]:text-[23px]!"
                  : "text-[#3b424d] [&_iconify-icon]:text-[var(--inv-icon)] hover:bg-[#f2f3f5] hover:text-[#15171c] dark:text-[#9398a1] dark:hover:bg-[#1e2027] dark:hover:text-[var(--inv-value)]",
              )}
            >
              <iconify-icon icon={item.icon} />
              <span className="flex-1">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex-none shrink-0 rounded-[14px] border border-[var(--inv-card-border)] bg-white px-[14px] pt-4 pb-[14px] text-center dark:bg-transparent">
        <div className="relative mb-3 grid aspect-[16/10] place-items-center overflow-hidden rounded-[11px] bg-[#e9eaec] dark:bg-[#17181c]">
          <Link
            href="/welcome"
            aria-label={t("nav.welcome")}
            className="grid size-10 place-items-center rounded-full bg-[rgba(23,26,32,.42)] text-white backdrop-blur-[2px] transition-colors duration-150 hover:bg-[rgba(23,26,32,.58)] [&_iconify-icon]:text-[20px]"
          >
            <iconify-icon icon="solar:play-bold" />
          </Link>
        </div>
        {cta ? (
          <Link className="block rounded-[10px] bg-[#171a20] px-2.5 py-[9.5px] text-[13px] font-semibold text-white no-underline hover:bg-black dark:bg-[var(--inv-brand)] dark:text-[var(--inv-brand-on)]" href={cta.href}>
            {cta.label}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
