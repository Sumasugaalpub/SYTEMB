"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

import { useReportHref, type HistoryItem } from "./actions";
import { useSpeak } from "./audio";
import { useOfficer } from "./officers";
import { useOutbox, usePrefs, useT } from "./state";

/**
 * The district app's building blocks. Same colours, font and Solar icons as
 * the website, read from the `--m-*` tokens so light and dark both work.
 * Every label shows one language — the officer's choice — and nothing more.
 */

export const SHADOW = "shadow-[0_1px_2px_rgba(16,24,40,.04),0_6px_18px_rgba(16,24,40,.05)]";
const SHADOW_BTN = "shadow-[0_1px_2px_rgba(16,24,40,.05),0_4px_12px_rgba(16,24,40,.06)]";
const SELECTED = "bg-[var(--m-soft)] text-[var(--m-ink)] shadow-[0_1px_2px_rgba(16,24,40,.04),0_6px_18px_rgba(16,24,40,.05),inset_0_0_0_2px_var(--m-active)]";

export type Tone = "blue" | "amber" | "red" | "green";
export const TONE: Record<Tone, string> = {
  blue: "bg-[var(--m-soft)] text-[var(--m-ink)]",
  amber: "bg-[var(--m-amber-bg)] text-[var(--m-amber)]",
  red: "bg-[var(--m-red-bg)] text-[var(--m-red)]",
  green: "bg-[var(--m-green-bg)] text-[var(--m-green)]",
};

/** How a sent item's status reads in History and the Outbox. */
export const STATUS_CHIP: Record<HistoryItem["status"], { tone: Tone; so: string; en: string }> = {
  pending: { tone: "amber", so: "Sugaysa ansixinta", en: "Waiting for approval" },
  approved: { tone: "green", so: "La ansixiyay", en: "Approved" },
  returned: { tone: "red", so: "Loo celiyay", en: "Sent back" },
  sent: { tone: "blue", so: "La diray", en: "Sent" },
};

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  return <iconify-icon icon={`solar:${name}`} aria-hidden="true" className={cn("shrink-0", className)} style={{ fontSize: size }} />;
}

// ------------------------------------------------------------------ layout

export type NavKey = "home" | "report" | "outbox" | "history";

/**
 * One phone screen: a fixed top bar, a middle that scrolls, and a fixed
 * bottom nav. Long pages scroll inside; the bars never move.
 */
export function Screen({ top, nav, children, className }: { top?: React.ReactNode; nav?: NavKey; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {top ? <div className="shrink-0">{top}</div> : null}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <main className={cn("flex min-h-full flex-col gap-4 px-[18px] pt-2.5 pb-5", className)}>{children}</main>
      </div>
      {nav ? <NavBar active={nav} /> : null}
    </div>
  );
}

export function TopBar({ title, left, right }: { title: string; left?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-2.5 px-[18px] pt-4 pb-2">
      {left ?? <span className="size-[46px]" />}
      <h1 className="truncate text-center text-[19px] font-extrabold text-[var(--m-text)]">{title}</h1>
      {right ?? <span className="size-[46px]" />}
    </header>
  );
}

export function CircleButton({ icon, label, href, onClick, ink, size = 46 }: { icon: string; label: string; href?: string; onClick?: () => void; ink?: boolean; size?: number }) {
  const cls = cn("grid shrink-0 place-items-center rounded-full bg-[var(--m-card)] no-underline", SHADOW_BTN, ink ? "text-[var(--m-ink)]" : "text-[var(--m-text)]");
  const body = <Icon name={icon} size={size > 42 ? 22 : 20} />;
  if (href)
    return (
      <Link href={href} aria-label={label} className={cls} style={{ width: size, height: size }}>
        {body}
      </Link>
    );
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls} style={{ width: size, height: size }}>
      {body}
    </button>
  );
}

export function BackButton({ href }: { href: string }) {
  const t = useT();
  return <CircleButton icon="alt-arrow-left-linear" label={t("Dib", "Back")} href={href} />;
}

/** Somali audio help. It always speaks Somali: that is who it is for. */
export function ListenButton({ text, clip, small }: { text: string; clip?: string; small?: boolean }) {
  const t = useT();
  const { playing, play } = useSpeak();
  return (
    <button
      type="button"
      aria-label={t("Dhagayso", "Listen in Somali")}
      onClick={() => play(text, clip)}
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-[var(--m-ink)]",
        small ? "size-[38px] bg-[var(--m-soft)]" : cn("size-[46px] bg-[var(--m-card)]", SHADOW_BTN),
        playing && "animate-pulse",
      )}
    >
      <Icon name={playing ? "soundwave-linear" : "volume-loud-linear"} size={small ? 19 : 22} />
    </button>
  );
}

/** SO | EN — the whole app changes language. */
export function LangSwitch() {
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  return (
    <div role="radiogroup" aria-label="Luqadda · Language" className={cn("flex h-10 shrink-0 items-center rounded-full bg-[var(--m-card)] p-1", SHADOW_BTN)}>
      {(["so", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          aria-label={l === "so" ? "Af-Soomaali" : "English"}
          onClick={() => setLang(l)}
          className={cn("h-8 rounded-full px-2.5 text-[12.5px] font-extrabold", lang === l ? "bg-[var(--m-cta)] text-[var(--m-cta-text)]" : "text-[var(--m-muted)]")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Light ↔ dark, shared with the website's own theme switch. */
export function ThemeButton() {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <CircleButton
      size={40}
      icon={dark ? "sun-2-linear" : "moon-linear"}
      label={dark ? t("Iftiin", "Light mode") : t("Mugdi", "Dark mode")}
      onClick={() => setTheme(dark ? "light" : "dark")}
    />
  );
}

// ------------------------------------------------------------------- nav

const NAV: { key: NavKey; so: string; en: string; icon: string; href: string }[] = [
  { key: "home", so: "Hoyga", en: "Home", icon: "home-smile-linear", href: "/mobile/home" },
  { key: "report", so: "Warbixin", en: "Report", icon: "clipboard-check-linear", href: "" },
  { key: "outbox", so: "Sugaya", en: "Outbox", icon: "inbox-linear", href: "/mobile/outbox" },
  { key: "history", so: "Taariikh", en: "History", icon: "history-linear", href: "/mobile/reports" },
];

export function NavBar({ active }: { active?: NavKey }) {
  const t = useT();
  const waiting = useOutbox((s) => s.items.length);
  const reportHref = useReportHref(useOfficer());
  return (
    <nav aria-label={t("Hagaha", "Main")} className="grid shrink-0 grid-cols-4 rounded-t-[24px] bg-[var(--m-card)] px-2 pt-3 pb-[18px] shadow-[0_-6px_20px_rgba(16,24,40,.06)]">
      {NAV.map((n) => {
        const on = n.key === active;
        return (
          <Link
            key={n.key}
            href={n.key === "report" ? reportHref : n.href}
            aria-current={on ? "page" : undefined}
            className={cn("flex flex-col items-center gap-[5px] text-[12.5px] no-underline", on ? "font-extrabold text-[var(--m-ink)]" : "font-bold text-[var(--m-muted)]")}
          >
            <span className={cn("relative grid h-8 w-[54px] place-items-center rounded-full", on && "bg-[var(--m-soft)] text-[var(--m-active)]")}>
              <Icon name={n.icon} size={23} />
              {n.key === "outbox" && waiting ? (
                <span className="absolute -top-px right-2 h-[18px] min-w-[18px] rounded-full bg-[#d98a06] px-[5px] text-center text-[11px] leading-[18px] font-extrabold text-white">{waiting}</span>
              ) : null}
            </span>
            {t(n.so, n.en)}
          </Link>
        );
      })}
    </nav>
  );
}

export function OfflineStrip() {
  const t = useT();
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-[var(--m-amber-bg)] px-[18px] py-[9px] text-[13.5px] font-bold text-[var(--m-amber)]">
      <Icon name="cloud-cross-linear" size={18} />
      {t("Internet ma jiro", "You are offline")}
    </div>
  );
}

// ---------------------------------------------------------------- blocks

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("flex flex-col gap-3 rounded-[16px] bg-[var(--m-card)] p-4", SHADOW, className)}>{children}</section>;
}

export function SectionHead({ title, action }: { title: string; action?: { label: string; href?: string; onClick?: () => void; icon?: string } }) {
  const cls = "inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--m-ink)] no-underline";
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-extrabold text-[var(--m-text)]">{title}</h2>
      {action ? (
        action.href ? (
          <Link href={action.href} className={cls}>
            {action.icon ? <Icon name={action.icon} size={17} /> : null}
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={cls}>
            {action.icon ? <Icon name={action.icon} size={17} /> : null}
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}

export function Question({ so, en, required, listen }: { so: string; en: string; required?: boolean; listen?: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2.5">
      <p className="flex-1 text-[16px] leading-[1.25] font-extrabold text-[var(--m-text)]">
        {t(so, en)}
        {required ? <span className="text-[var(--m-red)]"> *</span> : null}
      </p>
      <ListenButton small text={listen ?? so} />
    </div>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  icon?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  type?: "button" | "submit";
  className?: string;
};

/** The one big button on a screen. Near-black, like the website's main action. */
export function Cta({ children, icon, href, onClick, disabled, busy, type = "button", className }: ButtonProps) {
  const t = useT();
  const cls = cn(
    "flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[var(--m-cta)] px-4 text-[16px] font-bold text-[var(--m-cta-text)] no-underline transition-opacity disabled:opacity-40",
    className,
  );
  const body = (
    <>
      {busy ? t("Fadlan sug…", "Please wait…") : children}
      {busy ? <Icon name="refresh-linear" size={20} className="animate-spin" /> : icon ? <Icon name={icon} size={20} /> : null}
    </>
  );
  if (href && !disabled)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} className={cls}>
      {body}
    </button>
  );
}

/** Secondary action: card-coloured, same size. */
export function Ghost({ children, icon, href, onClick, disabled, className }: ButtonProps) {
  const cls = cn(
    "flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[var(--m-card)] px-4 text-[15.5px] font-bold text-[var(--m-text)] no-underline disabled:opacity-40",
    SHADOW,
    className,
  );
  const body = (
    <>
      {icon ? <Icon name={icon} size={20} /> : null}
      {children}
    </>
  );
  if (href && !disabled)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {body}
    </button>
  );
}

export function SmallButton({ children, icon, onClick, dark, disabled, spin }: { children: React.ReactNode; icon?: string; onClick?: () => void; dark?: boolean; disabled?: boolean; spin?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13.5px] font-bold disabled:opacity-50",
        dark ? "bg-[var(--m-cta)] text-[var(--m-cta-text)]" : "bg-[var(--m-soft)] text-[var(--m-ink)]",
      )}
    >
      {icon ? <Icon name={icon} size={17} className={spin ? "animate-spin" : undefined} /> : null}
      {children}
    </button>
  );
}

export function Chip({ tone, icon, children }: { tone: Tone; icon?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[12.5px] font-bold", TONE[tone])}>
      {icon ? <Icon name={icon} size={15} /> : <span className="size-[7px] rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Note({ tone = "blue", icon = "info-circle-linear", so, en, children }: { tone?: Tone; icon?: string; so: string; en: string; children?: React.ReactNode }) {
  const t = useT();
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[14px] px-3.5 py-3", TONE[tone])}>
      <Icon name={icon} size={20} />
      <div className="flex-1 text-[14px] leading-[1.35] font-bold">
        {t(so, en)}
        {children}
      </div>
    </div>
  );
}

export function IconChip({ icon, tone = "blue", size = 44 }: { icon: string; tone?: Tone; size?: number }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-[14px]", TONE[tone])} style={{ width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.52)} />
    </span>
  );
}

export function ProgressCard({ step, total = 6, so, en, complete }: { step: number; total?: number; so: string; en: string; complete?: boolean }) {
  const t = useT();
  return (
    <Card className="gap-3.5 px-[18px] pt-4 pb-[18px]">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-[var(--m-line)]" role="progressbar" aria-label={t("Horumarka", "Progress")} aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
          <div className={cn("h-2 rounded-full transition-[width]", complete ? "bg-[#159a52]" : "bg-[var(--m-active)]")} style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <span className="text-[14px] font-extrabold">
          {step}/{total}
        </span>
      </div>
      <p className="text-center text-[23px] font-extrabold tracking-[-0.015em]">{t(so, en)}</p>
    </Card>
  );
}

// ---------------------------------------------------------------- inputs

function StepButton({ plus, label, onClick, disabled }: { plus?: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 min-w-11 rounded-[12px] text-[22px] font-bold disabled:opacity-35",
        plus ? "bg-[var(--m-cta)] text-[var(--m-cta-text)]" : "bg-[var(--m-field)] text-[var(--m-text)]",
      )}
    >
      {plus ? "+" : "−"}
    </button>
  );
}

type CounterProps = { so: string; en: string; value: number; onChange: (n: number) => void; min?: number; max?: number };

/** Square card with a big number and −/+ underneath. */
export function CounterSquare({ so, en, value, onChange, min = 0, max = 999 }: CounterProps) {
  const t = useT();
  const label = t(so, en);
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-[16px] bg-[var(--m-card)] p-3.5", SHADOW)}>
      <p className="text-[15px] leading-[1.25] font-extrabold">{label}</p>
      <output aria-live="polite" className="text-center text-[36px] leading-[1.1] font-extrabold tabular-nums">
        {value}
      </output>
      <div className="grid grid-cols-2 gap-2">
        <StepButton label={`${t("Ka yaree", "Less")}: ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} />
        <StepButton plus label={`${t("Ku dar", "More")}: ${label}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} />
      </div>
    </div>
  );
}

/** Full-width counter: label left, −/value/+ right. */
export function CounterWide({ so, en, value, onChange, min = 0, max = 999 }: CounterProps) {
  const t = useT();
  const label = t(so, en);
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <p className="flex-1 text-[15px] leading-[1.25] font-extrabold">{label}</p>
        <StepButton label={`${t("Ka yaree", "Less")}: ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} />
        <output aria-live="polite" className="w-11 text-center text-[28px] font-extrabold tabular-nums">
          {value}
        </output>
        <StepButton plus label={`${t("Ku dar", "More")}: ${label}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} />
      </div>
    </Card>
  );
}

type Option<T> = { value: T; so: string; en: string };

/** Big square choice tiles (Yes / No, Rising / Unchanged / Falling). */
export function ChoiceGrid<T extends string | boolean>({
  label, options, value, onChange, cols = 2, height = 96,
}: {
  label: string;
  options: (Option<T> & { icon: string; color?: string })[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: 2 | 3;
  height?: number;
}) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-3", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            style={{ height }}
            className={cn("flex flex-col items-center justify-center gap-1.5 rounded-[16px] px-1", on ? SELECTED : cn("bg-[var(--m-card)] text-[var(--m-text)]", SHADOW))}
          >
            <Icon name={o.icon} size={30} className={o.color ?? (on ? "text-[var(--m-active)]" : "text-[var(--m-ink)]")} />
            <span className="text-[16px] leading-[1.15] font-extrabold">{t(o.so, o.en)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Round radio buttons in two columns. */
export function RadioGrid<T extends string>({ label, options, value, onChange }: { label: string; options: Option<T>[]; value: T | null; onChange: (v: T) => void }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-x-2.5 gap-y-1">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className="flex min-h-12 items-center gap-2.5 text-left">
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-[var(--m-active)]" : "border-[var(--m-radio)]")}>
              {on ? <span className="size-2.5 rounded-full bg-[var(--m-active)]" /> : null}
            </span>
            <span className={cn("text-[15px] leading-[1.2]", on ? "font-extrabold text-[var(--m-ink)]" : "font-bold text-[var(--m-text)]")}>{t(o.so, o.en)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A row of equal buttons, one selected. `onPage` gives the unselected ones a card face. */
export function Segmented<T extends string>({ label, options, value, onChange, onPage }: { label: string; options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; onPage?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-11 rounded-[12px] px-1 text-[14px]",
              on
                ? "bg-[var(--m-soft)] font-extrabold text-[var(--m-ink)] shadow-[inset_0_0_0_2px_var(--m-active)]"
                : cn("font-bold text-[var(--m-text)]", onPage ? cn("bg-[var(--m-card)]", SHADOW) : "bg-[var(--m-field)]"),
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function InputRow({ icon, label, ...input }: { icon: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex h-[52px] items-center gap-2.5 rounded-[12px] bg-[var(--m-field)] px-3.5 focus-within:shadow-[inset_0_0_0_2px_var(--m-active)]">
      <Icon name={icon} size={20} className="text-[var(--m-muted)]" />
      <span className="sr-only">{label}</span>
      <input
        {...input}
        className="min-w-0 flex-1 border-none bg-transparent text-[16px] font-bold text-[var(--m-text)] outline-none [color-scheme:light] placeholder:font-medium placeholder:text-[var(--m-faint)] dark:[color-scheme:dark]"
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, rows = 3, max = 400, invalid }: { label: string; value: string; onChange: (v: string) => void; rows?: number; max?: number; invalid?: boolean }) {
  const t = useT();
  const left = max - value.length;
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={value}
        maxLength={max}
        rows={rows}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={t("Halkan ku qor…", "Write here…")}
        className={cn(
          "w-full resize-none rounded-[14px] bg-[var(--m-card)] px-3.5 py-3 text-[15px] leading-[1.45] text-[var(--m-text)] outline-none placeholder:text-[var(--m-faint)] focus:shadow-[inset_0_0_0_2px_var(--m-active)]",
          invalid ? "shadow-[inset_0_0_0_2px_#d94a4a]" : SHADOW,
        )}
      />
      {/* The limit is always enforced; the count only appears when it is close. */}
      {left <= 60 ? (
        <span aria-live="polite" className={cn("self-end text-[13px] font-bold", left <= 10 ? "text-[var(--m-red)]" : "text-[var(--m-amber)]")}>
          {t(`${left} xaraf ayaa haray`, `${left} characters left`)}
        </span>
      ) : null}
    </div>
  );
}

/** A photo, or a drawn landscape when there is no picture to show. */
export function PhotoThumb({ src, size = 72, alt = "" }: { src?: string; size?: number; alt?: string }) {
  if (src)
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- data URIs from the phone camera */
      <img src={src} alt={alt} className="shrink-0 rounded-[12px] object-cover" style={{ width: size, height: size }} />
    );
  return (
    <span className="block shrink-0 overflow-hidden rounded-[12px] bg-[#d6e5f5]" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true">
        <circle cx="52" cy="20" r="8" fill="#f5c96a" />
        <path d="M0 56 22 34l16 16 10-10 24 24v8H0z" fill="#8fb6e0" />
        <path d="M0 62 18 48l14 10 12-8 28 14v8H0z" fill="#5f8fc4" />
      </svg>
    </span>
  );
}

/** The website's museum mark: a star over columns. */
export function Logo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 2.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L12 10.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" />
      <path d="M4 21.5h16M5.5 21.5v-6M9.8 21.5v-6M14.2 21.5v-6M18.5 21.5v-6M3.5 15.5h17" />
    </svg>
  );
}

/** Somali star emblem, from public/img/coat-of-arms.svg. */
export function Emblem({ size = 74 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#4189dd" />
      <path d="M32 12l4.7 14.4H52l-12.3 8.9 4.7 14.4L32 40.8l-12.3 8.9 4.7-14.4L12 26.4h15.3z" fill="#fff" />
    </svg>
  );
}
