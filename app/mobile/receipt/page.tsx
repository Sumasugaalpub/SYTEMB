"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { downloadPDF } from "@/lib/download";
import { ENTITY } from "@/lib/entities";
import { fmtDate, fmtDateTime, fmtPeriod, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { REPORT_PERIOD, useRows, type MobileIncident, type MobileSubmission } from "@/components/mobile/actions";
import { useOfficer, type Officer } from "@/components/mobile/officers";
import { EVENT_TYPES, useOutbox, useT, type OutboxItem } from "@/components/mobile/state";
import { Card, Chip, CircleButton, Cta, Ghost, Icon, IconChip, ListenButton, Note, Screen, SectionHead, SHADOW, TopBar, type Tone } from "@/components/mobile/ui";

/** Screen 9 — proof the report was received. Also shows a report saved without signal. */
export default function ReceiptPage() {
  return (
    <React.Suspense fallback={null}>
      <Receipt />
    </React.Suspense>
  );
}

type T = (so: string, en: string) => string;
type Tile = { icon: string; value: string };
type Status = { tone: Tone; icon: string; text: string; note?: string };

async function share(title: string, lines: string[], file: string, t: T) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: [title, ...lines].join("\n") });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  downloadPDF(title, lines, file);
  toast.success(t("Rasiidka waa la kaydiyay (PDF)", "Receipt saved as PDF"));
}

function Receipt() {
  const params = useSearchParams();
  const officer = useOfficer();
  const subs = useRows<MobileSubmission>(ENTITY.submissions);
  const incidents = useRows<MobileIncident>(ENTITY.incidents);
  const items = useOutbox((s) => s.items);

  const ref = params.get("ref");
  const eventId = params.get("event");
  const outboxId = params.get("outbox");
  const sub = ref ? subs.find((r) => r.receipt === ref || r.id === ref) : undefined;
  const inc = eventId ? incidents.find((i) => i.id === eventId) : undefined;
  const queued = outboxId ? items.find((i) => i.id === outboxId) : undefined;

  if (sub) return <SubmissionReceipt sub={sub} officer={officer} />;
  if (inc) return <EventReceipt inc={inc} officer={officer} />;
  if (queued) return <SavedReceipt item={queued} officer={officer} />;
  return <NotFound sentFromOutbox={Boolean(outboxId)} />;
}

function Frame({ onShare, children }: { onShare?: () => void; children: React.ReactNode }) {
  const t = useT();
  return (
    <Screen
      nav="report"
      top={
        <TopBar
          title={t("Rasiid", "Receipt")}
          left={<CircleButton icon="home-smile-linear" label={t("Hoyga", "Home")} href="/mobile/home" />}
          right={onShare ? <CircleButton icon="share-linear" label={t("Wadaag", "Share")} ink onClick={onShare} /> : <ListenButton clip="receipt" text="Warbixintaada waa la kaydiyay. Mahadsanid." />}
        />
      }
    >
      {children}
    </Screen>
  );
}

function Hero({ saved, title, refValue }: { saved?: boolean; title: string; refValue?: string }) {
  return (
    <Card className="items-center gap-2 px-[18px] py-[22px] text-center">
      <span className={cn("grid size-[84px] place-items-center rounded-full", saved ? "bg-[var(--m-amber-bg)] text-[var(--m-amber)]" : "bg-[var(--m-green-bg)]")}>
        <Icon name={saved ? "cloud-upload-linear" : "check-circle-bold"} size={saved ? 40 : 66} className={saved ? undefined : "text-[#159a52]"} />
      </span>
      <p className="mt-2 text-[25px] font-extrabold tracking-[-0.015em]">{title}</p>
      {refValue ? <p className="font-mono text-[24px] font-semibold break-all text-[var(--m-ink)]">{refValue}</p> : null}
    </Card>
  );
}

function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div key={tile.icon} className={cn("flex min-h-[96px] flex-col justify-between gap-2 rounded-[16px] bg-[var(--m-card)] p-3.5", SHADOW)}>
          <IconChip icon={tile.icon} size={36} />
          <span className="text-[15px] leading-[1.25] font-extrabold break-words whitespace-pre-line">{tile.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatusCard({ s }: { s: Status }) {
  const ink = { blue: "text-[var(--m-ink)]", amber: "text-[var(--m-amber)]", red: "text-[var(--m-red)]", green: "text-[var(--m-green)]" }[s.tone];
  return (
    <Card className="flex-row items-center gap-3">
      <div className="flex-1">
        <p className={cn("text-[17px] font-extrabold", ink)}>{s.text}</p>
        {s.note ? <p className={cn("mt-1.5 text-[14px] leading-[1.4] font-bold", ink)}>{s.note}</p> : null}
      </div>
      <IconChip icon={s.icon} tone={s.tone} size={56} />
    </Card>
  );
}

function Actions({ onShare }: { onShare?: () => void }) {
  const t = useT();
  return (
    <div className="mt-auto grid grid-cols-2 gap-3">
      {onShare ? (
        <Ghost icon="share-linear" onClick={onShare}>
          {t("Wadaag", "Share")}
        </Ghost>
      ) : (
        <Ghost icon="inbox-linear" href="/mobile/outbox">
          {t("Sugaya", "Outbox")}
        </Ghost>
      )}
      <Cta href="/mobile/home">{t("Dhammaad", "Done")}</Cta>
    </div>
  );
}

function SubmissionReceipt({ sub, officer }: { sub: MobileSubmission; officer: Officer }) {
  const t = useT();
  const ref = sub.receipt ?? sub.id;
  const at = sub.submittedAt ?? new Date().toISOString();
  const status: Status =
    sub.status === "approved"
      ? { tone: "green", icon: "check-circle-linear", text: t("La ansixiyay", "Approved by the state") }
      : sub.status === "returned"
        ? { tone: "red", icon: "undo-left-round-linear", text: t("Loo celiyay", "Sent back for correction"), note: sub.note }
        : { tone: "amber", icon: "clock-circle-linear", text: t("Sugaysa ansixinta", "Waiting for state approval") };
  const lines = [
    `Reference: ${ref}`,
    `District: ${sub.district}`,
    `Period: ${fmtPeriod(sub.period)}`,
    `Filed by: ${sub.focalPoint || officer.name}`,
    `Sent: ${fmtDateTime(at)}`,
    `Status: ${status.text}`,
    "",
    "Keep this receipt. It proves the report was received.",
  ];
  const onShare = () => share(`Raad-Raac receipt ${ref}`, lines, `${ref}.pdf`, t);

  return (
    <Frame onShare={onShare}>
      <Hero title={t("Waa la helay", "Report received")} refValue={ref} />
      <SectionHead title={t("Faahfaahin", "Details")} />
      <Tiles
        tiles={[
          { icon: "calendar-linear", value: fmtPeriod(sub.period) },
          { icon: "map-point-linear", value: sub.district },
          { icon: "clock-circle-linear", value: `${fmtTime(at)}\n${fmtDate(at)}` },
        ]}
      />
      <StatusCard s={status} />
      <Actions onShare={onShare} />
    </Frame>
  );
}

function EventReceipt({ inc, officer }: { inc: MobileIncident; officer: Officer }) {
  const t = useT();
  const type = EVENT_TYPES.find((x) => x.incident === inc.type);
  const lines = [
    `Reference: ${inc.id}`,
    `Event: ${inc.type}`,
    `Place: ${inc.village ? `${inc.village}, ` : ""}${inc.district}`,
    `Date: ${fmtDate(inc.date)}`,
    `Reported by: ${inc.reportedBy ?? officer.name}`,
    `People hurt or killed: ${inc.fatalities} · Households displaced: ${inc.displaced}`,
    "",
    "Forwarded to the early-warning desk.",
  ];
  const onShare = () => share(`Raad-Raac event ${inc.id}`, lines, `${inc.id}.pdf`, t);

  return (
    <Frame onShare={onShare}>
      <Hero title={t("Dhacdada waa la diray", "Event sent")} refValue={inc.id} />
      <SectionHead title={t("Faahfaahin", "Details")} />
      <Tiles
        tiles={[
          { icon: type?.icon ?? "danger-triangle-linear", value: type ? t(type.so, type.en) : inc.type },
          { icon: "map-point-linear", value: inc.village || inc.district },
          { icon: "calendar-linear", value: fmtDate(inc.date) },
        ]}
      />
      <StatusCard s={{ tone: "blue", icon: "plain-linear", text: t("Waxaa loo gudbiyay xafiiska digniinta hore", "Forwarded to the early-warning desk") }} />
      <Actions onShare={onShare} />
    </Frame>
  );
}

/** Screen 9b — saved on the phone, waiting for signal. There is no receipt number yet. */
function SavedReceipt({ item, officer }: { item: OutboxItem; officer: Officer }) {
  const t = useT();
  const chip =
    item.status === "failed" ? (
      <Chip tone="red">{t("Fashilmay", "Failed")}</Chip>
    ) : item.status === "sending" ? (
      <Chip tone="blue" icon="refresh-linear">
        {t("Waa la dirayaa", "Sending")}
      </Chip>
    ) : (
      <Chip tone="amber">{t("Sugaya in la diro", "Waiting to send")}</Chip>
    );

  return (
    <Frame>
      <Hero saved title={t("Waa la kaydiyay", "Saved")} />
      <div className="-mt-2 flex justify-center">{chip}</div>
      <SectionHead title={t("Faahfaahin", "Details")} />
      <Tiles
        tiles={[
          item.kind === "report" ? { icon: "calendar-linear", value: fmtPeriod(REPORT_PERIOD) } : { icon: "danger-triangle-linear", value: t("Dhacdo", "Event") },
          { icon: "map-point-linear", value: officer.district },
          { icon: "clock-circle-linear", value: fmtTime(item.savedAt) },
        ]}
      />
      <Note so="Waxay dirmi doontaa marka internet jiro." en="It will send when you have signal." />
      <Actions />
    </Frame>
  );
}

function NotFound({ sentFromOutbox }: { sentFromOutbox: boolean }) {
  const t = useT();
  return (
    <Frame>
      <Note
        tone={sentFromOutbox ? "green" : "amber"}
        icon={sentFromOutbox ? "check-circle-linear" : "info-circle-linear"}
        so={sentFromOutbox ? "Waa la diray. Rasiidku wuxuu ku jiraa Taariikh." : "Rasiidkan lama helin."}
        en={sentFromOutbox ? "Already sent. The receipt is in History." : "This receipt was not found."}
      />
      <Cta icon="history-linear" href="/mobile/reports">
        {t("Taariikh", "History")}
      </Cta>
    </Frame>
  );
}
