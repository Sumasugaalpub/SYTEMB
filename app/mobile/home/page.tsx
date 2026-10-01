"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

import { TIMELINE } from "@/data/timeline";
import { fmtPeriod } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { REPORT_PERIOD, answersFromSubmission, itemTitle, receiptHref, sendItem, useReportStatus } from "@/components/mobile/actions";
import { useOfficer } from "@/components/mobile/officers";
import { STEPS, useDraft, useOnline, useOutbox, useResumeHref, useSession, useT } from "@/components/mobile/state";
import { Card, Chip, Cta, Emblem, Icon, IconChip, LangSwitch, ListenButton, Logo, Screen, SectionHead, SHADOW, SmallButton, ThemeButton } from "@/components/mobile/ui";

type Hero = "draft" | "queued" | "pending" | "approved" | "returned";

const HERO_TEXT: Record<Exclude<Hero, "draft">, [string, string]> = {
  queued: ["Sugaya", "Waiting"],
  pending: ["La diray", "Sent"],
  approved: ["La ansixiyay", "Approved"],
  returned: ["Loo celiyay", "Sent back"],
};

/** Screen 2 — home. What is due, what is waiting, and the way to everything else. */
export default function HomePage() {
  const t = useT();
  const router = useRouter();
  const officer = useOfficer();
  const online = useOnline();
  const setOffline = useStore((s) => s.setOffline);
  const signOut = useSession((s) => s.signOut);
  const done = useDraft((s) => s.done.length);
  const started = useDraft((s) => s.answers !== null);
  const load = useDraft((s) => s.load);
  const resume = useResumeHref();
  const items = useOutbox((s) => s.items);
  const { sub, queued } = useReportStatus(officer);
  const [menu, setMenu] = React.useState(false);
  const [sending, setSending] = React.useState<string | null>(null);

  const daysLeft = differenceInCalendarDays(parseISO(TIMELINE.periodOpenDue), parseISO(TIMELINE.today));
  const hero: Hero =
    sub?.status === "pending" ? "pending" : sub?.status === "approved" ? "approved" : queued ? "queued" : sub?.status === "returned" ? "returned" : "draft";

  async function send(id: string) {
    setSending(id);
    const res = await sendItem(id, online);
    setSending(null);
    if (res.ok) toast.success(`${t("Waa la diray", "Sent")} · ${res.ref}`);
    else toast.error(t(res.error.so, res.error.en));
  }

  function fixAndResend() {
    const answers = sub ? answersFromSubmission(sub) : null;
    if (answers) load(answers);
    router.push(answers ? "/mobile/report/review" : resume);
  }

  function leave() {
    signOut();
    router.replace("/mobile/login");
  }

  const first = items[0];
  const cta =
    hero === "draft"
      ? { label: done || started ? t("Sii wad warbixinta", "Continue report") : t("Bilow warbixinta", "Start report"), href: resume }
      : hero === "queued"
        ? { label: t("Tag Sugaya", "Open Outbox"), href: "/mobile/outbox" }
        : hero === "returned"
          ? null
          : { label: t("Eeg rasiidka", "View receipt"), href: sub ? receiptHref(sub) : "/mobile/reports" };

  return (
    <Screen
      nav="home"
      top={
        <header className="flex items-center gap-1.5 px-[18px] pt-4 pb-2">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-[var(--m-card)] text-[var(--m-ink)]", SHADOW)}>
            <Logo size={21} />
          </span>
          <span className="ml-1 flex-1 truncate text-[18px] font-extrabold tracking-[-0.01em]">Raad-Raac</span>
          <LangSwitch />
          <ThemeButton />
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-label={t("Akoonkaaga", "Your account")}
            className="relative grid size-[42px] shrink-0 place-items-center rounded-full bg-[#1f4263] text-[14px] font-extrabold text-white"
          >
            {officer.initials}
            <span className={cn("absolute right-0 bottom-0 size-3 rounded-full border-2 border-[var(--m-bg)]", online ? "bg-[#159a52]" : "bg-[#d98a06]")} />
          </button>
        </header>
      }
    >
      {menu ? (
        <Card className="flex-row items-center gap-3">
          <p className="flex-1 text-[16px] font-extrabold">{officer.name}</p>
          <SmallButton icon="logout-2-linear" onClick={leave}>
            {t("Ka bax", "Sign out")}
          </SmallButton>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[25px] font-extrabold tracking-[-0.015em]">
            {t("Salaan", "Hello")}, {officer.name.split(" ")[0]}
          </h1>
          <ListenButton small clip="home" text="Riix Bilow warbixinta si aad u buuxiso warbixinta rubuca. Riix Dhacdo si aad u soo sheegto dhacdo degdeg ah." />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--m-muted)]">
            <Icon name="map-point-linear" size={17} className="text-[var(--m-ink)]" />
            {officer.district}, {officer.regionName}
          </span>
          <button
            type="button"
            onClick={() => setOffline(online)}
            aria-pressed={!online}
            aria-label={online ? t("Online — riix si aad u jarto (demo)", "Online — tap to go offline (demo)") : t("Offline — riix si aad ugu xirto (demo)", "Offline — tap to go online (demo)")}
            className={cn(
              "inline-flex shrink-0 items-center gap-[7px] rounded-[12px] bg-[var(--m-card)] px-3 py-2 text-[13px] font-bold",
              SHADOW,
              online ? "text-[var(--m-green)]" : "text-[var(--m-amber)]",
            )}
          >
            <span className={cn("size-2 rounded-full", online ? "bg-[#159a52]" : "bg-[#d98a06]")} />
            {online ? "Online" : "Offline"}
          </button>
        </div>
      </div>

      <Card className="gap-4 p-[18px]">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-[14.5px] font-semibold text-[var(--m-muted)]">
              {t("Warbixinta rubuca", "Quarterly report")} · {fmtPeriod(REPORT_PERIOD)}
            </span>
            {hero === "draft" ? (
              <>
                <span className="text-[42px] leading-none font-extrabold tracking-[-0.02em]">
                  {done}/{STEPS.length} <span className="text-[16px] font-bold tracking-normal text-[var(--m-muted)]">{t("tallaabo", "steps")}</span>
                </span>
                <Chip tone={daysLeft <= 14 ? "amber" : "blue"} icon="clock-circle-linear">
                  {t(`${daysLeft} maalmood ayaa haray`, `Due in ${daysLeft} days`)}
                </Chip>
              </>
            ) : (
              <span
                className={cn(
                  "text-[30px] leading-[1.05] font-extrabold tracking-[-0.02em]",
                  hero === "returned" && "text-[var(--m-red)]",
                  hero === "approved" && "text-[var(--m-green)]",
                  hero === "queued" && "text-[var(--m-amber)]",
                )}
              >
                {t(...HERO_TEXT[hero])}
              </span>
            )}
          </div>
          <span className="grid size-[100px] shrink-0 place-items-center rounded-[16px] bg-[var(--m-soft)]">
            <Emblem size={72} />
          </span>
        </div>

        {hero === "returned" && sub?.note ? <p className="rounded-[12px] bg-[var(--m-red-bg)] px-3 py-2.5 text-[14px] leading-[1.4] font-bold text-[var(--m-red)]">{sub.note}</p> : null}

        <div className="flex items-center justify-between gap-3">
          {cta ? (
            <Cta icon="alt-arrow-right-linear" href={cta.href} className="h-[46px] rounded-[12px] px-[18px] text-[15px]">
              {cta.label}
            </Cta>
          ) : (
            <Cta icon="pen-linear" onClick={fixAndResend} className="h-[46px] rounded-[12px] px-[18px] text-[15px]">
              {t("Sax oo dib u dir", "Fix and resend")}
            </Cta>
          )}
          <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--m-ink)]" title={t("Ugu dambayn", "Due date")}>
            <Icon name="calendar-linear" size={18} />
            {format(parseISO(TIMELINE.periodOpenDue), "dd.MM.yyyy")}
          </span>
        </div>
      </Card>

      <SectionHead title={t("Ficillo degdeg ah", "Quick actions")} />
      <div className="-mt-1 grid grid-cols-3 gap-3">
        {[
          { href: "/mobile/event", icon: "danger-triangle-linear", tone: "red" as const, label: t("Dhacdo", "Event") },
          { href: "/mobile/outbox", icon: "inbox-linear", tone: "amber" as const, label: t("Sugaya", "Outbox"), badge: items.length },
          { href: "/mobile/reports", icon: "history-linear", tone: "blue" as const, label: t("Taariikh", "History") },
        ].map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={cn("relative flex h-[104px] flex-col items-center justify-center gap-2.5 rounded-[16px] bg-[var(--m-card)] text-[var(--m-text)] no-underline", SHADOW)}
          >
            {tile.badge ? (
              <span className="absolute top-2.5 right-2.5 h-5 min-w-5 rounded-full bg-[#d98a06] px-1.5 text-center text-[12px] leading-5 font-extrabold text-white">{tile.badge}</span>
            ) : null}
            <IconChip icon={tile.icon} tone={tile.tone} size={46} />
            <span className="text-[14.5px] font-extrabold">{tile.label}</span>
          </Link>
        ))}
      </div>

      <SectionHead
        title={items.length ? t(`${items.length} sugaya in la diro`, `${items.length} waiting to send`) : t("Sugaya in la diro", "Waiting to send")}
        action={{ label: t("Dhammaan", "See all"), href: "/mobile/outbox" }}
      />
      {first ? (
        <Card className="-mt-1 flex-row items-center gap-3">
          <div className="flex flex-1 flex-col items-start gap-3">
            <span className="text-[16px] font-extrabold">{itemTitle(first, t)}</span>
            <SmallButton dark icon={sending === first.id ? "refresh-linear" : undefined} spin disabled={sending === first.id} onClick={() => send(first.id)}>
              {sending === first.id ? t("Waa la dirayaa…", "Sending…") : t("Dir hadda", "Send now")}
            </SmallButton>
          </div>
          <span className="grid size-[78px] shrink-0 place-items-center rounded-[16px] bg-[var(--m-amber-bg)] text-[var(--m-amber)]">
            <Icon name="cloud-upload-linear" size={38} />
          </span>
        </Card>
      ) : (
        <Card className="-mt-1 flex-row items-center gap-3">
          <IconChip icon="check-circle-linear" tone="green" />
          <p className="text-[15px] font-extrabold">{t("Wax sugaya ma jiraan", "Nothing waiting to send")}</p>
        </Card>
      )}
    </Screen>
  );
}
