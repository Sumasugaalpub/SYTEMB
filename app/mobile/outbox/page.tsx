"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { itemTitle, sendAll, sendItem, useHistory, type HistoryItem } from "@/components/mobile/actions";
import { useOfficer } from "@/components/mobile/officers";
import { useOnline, useOutbox, useT, type OutboxItem } from "@/components/mobile/state";
import { BackButton, Card, Chip, CircleButton, Icon, IconChip, Screen, SectionHead, SHADOW, SmallButton, STATUS_CHIP, TopBar } from "@/components/mobile/ui";

/** Outbox — what was saved without signal, and a way to send it again. */
export default function OutboxPage() {
  const t = useT();
  const router = useRouter();
  const officer = useOfficer();
  const online = useOnline();
  const items = useOutbox((s) => s.items);
  const recent = useHistory(officer).slice(0, 2);
  const [busy, setBusy] = React.useState(false);

  async function retryAll() {
    if (!items.length) return;
    setBusy(true);
    const sent = await sendAll(online);
    setBusy(false);
    if (sent) toast.success(t(`${sent} waa la diray`, `${sent} sent`));
    else toast.error(online ? t("Lama dirin", "Nothing was sent") : t("Internet ma jiro", "No signal"));
  }

  async function retry(item: OutboxItem) {
    const res = await sendItem(item.id, online);
    if (!res.ok) return toast.error(t(res.error.so, res.error.en));
    const href = item.kind === "report" ? `/mobile/receipt?ref=${encodeURIComponent(res.ref)}` : `/mobile/receipt?event=${encodeURIComponent(res.ref)}`;
    toast.success(`${t("Waa la diray", "Sent")} · ${res.ref}`, { action: { label: t("Rasiid", "Receipt"), onClick: () => router.push(href) } });
  }

  return (
    <Screen
      nav="outbox"
      top={
        <TopBar
          title={t("Sugaya", "Outbox")}
          left={<BackButton href="/mobile/home" />}
          right={<CircleButton icon="refresh-linear" label={t("Isku day dhammaan", "Retry all")} ink onClick={retryAll} />}
        />
      }
    >
      <Card className="gap-4 p-[18px]">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-2.5">
            <span className="text-[42px] leading-none font-extrabold">
              {items.length} <span className="text-[16px] font-bold text-[var(--m-muted)]">{t("sugaya", "waiting")}</span>
            </span>
            {online ? (
              <Chip tone="green" icon="wi-fi-router-minimalistic-linear">
                Online
              </Chip>
            ) : (
              <Chip tone="amber" icon="cloud-cross-linear">
                {t("Internet ma jiro", "Offline")}
              </Chip>
            )}
          </div>
          <span className="grid size-[96px] shrink-0 place-items-center rounded-[16px] bg-[var(--m-amber-bg)] text-[var(--m-amber)]">
            <Icon name="cloud-upload-linear" size={44} />
          </span>
        </div>
        <SmallButton dark icon="refresh-linear" spin={busy} onClick={retryAll} disabled={busy || !items.length}>
          {busy ? t("Waa la dirayaa…", "Sending…") : t("Isku day hadda", "Retry now")}
        </SmallButton>
      </Card>

      <SectionHead title={t("Liiska", "List")} />
      {items.length ? (
        items.map((item) => (
          <Card key={item.id} className="-mt-1 flex-row items-center gap-3 p-3.5">
            <IconChip icon={item.kind === "report" ? "clipboard-check-linear" : "danger-triangle-linear"} tone={item.status === "failed" ? "red" : "blue"} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-[15px] font-extrabold">{itemTitle(item, t)}</span>
              {item.status === "failed" ? (
                <Chip tone="red">{t("Fashilmay", "Failed")}</Chip>
              ) : item.status === "sending" ? (
                <Chip tone="blue" icon="refresh-linear">
                  {t("Waa la dirayaa", "Sending")}
                </Chip>
              ) : (
                <Chip tone="amber">{t("Sugaya", "Waiting")}</Chip>
              )}
            </div>
            {item.status === "failed" ? (
              <SmallButton icon="refresh-linear" onClick={() => retry(item)}>
                {t("Isku day", "Retry")}
              </SmallButton>
            ) : (
              <SmallButton dark disabled={item.status === "sending"} onClick={() => retry(item)}>
                {item.status === "sending" ? "…" : t("Dir", "Send")}
              </SmallButton>
            )}
          </Card>
        ))
      ) : (
        <Card className="-mt-1 flex-row items-center gap-3">
          <IconChip icon="check-circle-linear" tone="green" />
          <p className="text-[15px] font-extrabold">{t("Wax sugaya ma jiraan", "Nothing waiting to send")}</p>
        </Card>
      )}

      {recent.length ? (
        <>
          <SectionHead title={t("Hadda la diray", "Recently sent")} action={{ label: t("Taariikh", "History"), href: "/mobile/reports" }} />
          {recent.map((h) => (
            <RecentRow key={`${h.kind}-${h.id}`} h={h} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function RecentRow({ h }: { h: HistoryItem }) {
  const t = useT();
  const chip = STATUS_CHIP[h.status];
  return (
    <Link href={h.href} className={cn("-mt-1 flex items-center gap-3 rounded-[16px] bg-[var(--m-card)] p-3.5 text-[var(--m-text)] no-underline", SHADOW)}>
      <IconChip icon={h.kind === "report" ? "clipboard-check-linear" : "danger-triangle-linear"} tone={chip.tone} />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-[15px] font-extrabold">{h.title}</span>
        <Chip tone={chip.tone}>{t(chip.so, chip.en)}</Chip>
      </span>
      <Icon name="alt-arrow-right-linear" size={20} className="text-[var(--m-faint)]" />
    </Link>
  );
}
