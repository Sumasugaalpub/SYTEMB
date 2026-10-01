"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { wait } from "@/lib/async";
import { cn } from "@/lib/utils";
import { queueReport, receiptHref, submitReport, useReportStatus, validate } from "@/components/mobile/actions";
import { useOfficer } from "@/components/mobile/officers";
import { CAUSES, NARRATIVE_FIELDS, REASONS, STEPS, TRENDS, stepHref, useAnswers, useDraft, useOnline, useT, type StepId } from "@/components/mobile/state";
import { BackButton, Card, Cta, Ghost, Icon, IconChip, ListenButton, Note, PhotoThumb, ProgressCard, Screen, SectionHead, SHADOW, TopBar } from "@/components/mobile/ui";

const indexOf = (id: StepId) => STEPS.findIndex((s) => s.id === id);

/** Screen 8 — every answer on one page, an Edit link on each, then send. */
export default function ReviewPage() {
  const t = useT();
  const router = useRouter();
  const officer = useOfficer();
  const online = useOnline();
  const a = useAnswers();
  const clear = useDraft((s) => s.clear);
  const { sub, queued } = useReportStatus(officer);
  const [busy, setBusy] = React.useState(false);

  const label = <T,>(list: { value: T; so: string; en: string }[], v: T | null) => {
    const o = list.find((x) => x.value === v);
    return o ? t(o.so, o.en) : "—";
  };
  const problems = validate(a);
  const badSteps = new Set(problems.map((p) => p.step));
  const sent = sub?.status === "pending" || sub?.status === "approved";
  const blocked = problems.length > 0 || sent || Boolean(queued);

  async function send() {
    if (!online) return toast.error(t("Internet ma jiro — riix “Dir internet la'aan”.", "No signal — use “Send without internet”."));
    setBusy(true);
    await wait();
    const res = submitReport(a, officer);
    setBusy(false);
    if (!res.ok) return toast.error(t(res.error.so, res.error.en));
    clear();
    toast.success(t(`Warbixinta ${res.ref} waa la helay`, `Report ${res.ref} received`));
    router.push(`/mobile/receipt?ref=${encodeURIComponent(res.ref)}`);
  }

  function sendLater() {
    const item = queueReport(a, officer);
    clear();
    toast.success(t("Waa la kaydiyay. Waxay dirmi doontaa marka internet jiro.", "Saved. It will send when you have signal."));
    router.push(`/mobile/receipt?outbox=${item.id}`);
  }

  function saveDraft() {
    toast.success(t("Qabyo waa la kaydiyay", "Draft saved"));
    router.push("/mobile/home");
  }

  const tiles: { id: StepId; lines: string[] | null }[] = [
    {
      id: "committee",
      lines: a.committee.met === null ? null : a.committee.met ? [t("Shiray", "Met"), `${a.committee.meetings} ${t("kulan", "meetings")}`] : [t("Ma shirin", "Did not meet")],
    },
    {
      id: "disputes",
      lines: [`${a.disputes.worked} ${t("khilaaf", "disputes")} · ${a.disputes.agreements} ${t("heshiis", "agreements")}`, label(CAUSES, a.disputes.cause)],
    },
    {
      id: "council",
      lines:
        a.council.formed === null
          ? null
          : a.council.formed
            ? [`${t("Haa", "Yes")} · ${a.council.year ?? "—"}`, `${a.council.members} ${t("xubnood", "members")} · ${a.council.women} ${t("haween", "women")}`]
            : [t("Gole ma jiro", "No council")],
    },
    { id: "tension", lines: a.tension.trend ? [label(TRENDS, a.tension.trend), label(REASONS, a.tension.reason)] : null },
  ];

  const editLink = (step: StepId) => (
    <Link href={stepHref(indexOf(step))} aria-label={t("Wax ka beddel", "Edit")} className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[var(--m-soft)] text-[var(--m-ink)]">
      <Icon name="pen-linear" size={17} />
    </Link>
  );

  return (
    <Screen
      nav="report"
      top={
        <TopBar
          title={t("Hubi oo dir", "Review & send")}
          left={<BackButton href={stepHref(STEPS.length - 1)} />}
          right={<ListenButton clip="review" text="Hubi jawaabahaaga. Riix qalinka si aad wax uga beddesho. Riix Dir si aad u dirto." />}
        />
      }
    >
      <ProgressCard step={STEPS.length - badSteps.size} so="Hubi warbixintaada" en="Check your report" complete={!problems.length} />

      {problems.length ? (
        <Note tone="red" icon="danger-triangle-linear" so="Wax yar ayaa dhiman" en="A few answers are missing">
          <ul className="mt-2 flex flex-col gap-1.5">
            {problems.map((p) => (
              <li key={p.en}>
                <Link href={stepHref(indexOf(p.step))} className="text-[13.5px] font-bold text-[var(--m-red)] underline underline-offset-2">
                  {t(p.so, p.en)}
                </Link>
              </li>
            ))}
          </ul>
        </Note>
      ) : null}

      <SectionHead title={t("Jawaabahaaga", "Your answers")} />
      <div className="-mt-1 grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const step = STEPS[indexOf(tile.id)];
          return (
            <div key={tile.id} className={cn("flex flex-col gap-2.5 rounded-[16px] bg-[var(--m-card)] p-3.5", badSteps.has(tile.id) ? "shadow-[inset_0_0_0_2px_#d94a4a]" : SHADOW)}>
              <div className="flex items-center justify-between">
                <IconChip icon={step.icon} size={38} />
                {editLink(tile.id)}
              </div>
              <p className="text-[15px] leading-[1.2] font-extrabold">{t(step.so, step.en)}</p>
              {tile.lines ? (
                <div className="flex flex-col gap-1.5">
                  {tile.lines.map((l) => (
                    <span key={l} className="text-[13.5px] font-bold text-[var(--m-muted)]">
                      {l}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[13.5px] font-bold text-[var(--m-red)]">{t("Lama buuxin", "Not answered")}</span>
              )}
            </div>
          );
        })}
      </div>

      <Card className="p-3.5">
        <div className="flex items-center gap-2.5">
          <IconChip icon="gallery-linear" size={38} />
          <p className="flex-1 text-[15px] font-extrabold">
            {t("Caddaynta", "Photos")} · {a.photos.length}
          </p>
          {editLink("evidence")}
        </div>
        {a.photos.length ? (
          <div className="flex flex-wrap gap-2.5">
            {a.photos.map((p) => (
              <PhotoThumb key={p.id} src={p.src} size={64} alt={p.name} />
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="p-3.5">
        <div className="flex items-center gap-2.5">
          <IconChip icon="pen-new-square-linear" size={38} />
          <p className="flex-1 text-[15px] font-extrabold">{t("Sheekada", "Written answers")}</p>
          {editLink("narrative")}
        </div>
        {NARRATIVE_FIELDS.map((f) => {
          const v = a.narrative[f.key].trim();
          return v ? (
            <div key={f.key} className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--m-muted)]">{t(f.so, f.en)}</span>
              <span className="text-[14.5px] leading-[1.45] whitespace-pre-line">{v}</span>
            </div>
          ) : null;
        })}
      </Card>

      {sent ? (
        <Note tone="green" icon="check-circle-linear" so="Warbixinta rubucan waa la diray." en="This quarter's report was already sent.">
          <Link href={receiptHref(sub)} className="mt-1 block text-[13.5px] font-extrabold text-[var(--m-ink)]">
            {t("Eeg rasiidka", "View receipt")}
          </Link>
        </Note>
      ) : queued ? (
        <Note tone="amber" icon="inbox-linear" so="Warbixintan waxay ku jirtaa Sugaya." en="This report is waiting in the Outbox.">
          <Link href="/mobile/outbox" className="mt-1 block text-[13.5px] font-extrabold text-[var(--m-ink)]">
            {t("Tag Sugaya", "Open Outbox")}
          </Link>
        </Note>
      ) : (
        <div className="mt-1 flex flex-col gap-2.5">
          <Cta icon="plain-linear" onClick={send} busy={busy} disabled={blocked || !online}>
            {t("Dir", "Send")}
          </Cta>
          <Ghost icon="cloud-cross-linear" onClick={sendLater} disabled={blocked || busy}>
            {t("Dir internet la'aan", "Send without internet")}
          </Ghost>
          <button type="button" onClick={saveDraft} className="self-center p-2 text-[14.5px] font-extrabold text-[var(--m-ink)]">
            {t("Kaydi qabyo ahaan", "Save as draft")}
          </button>
        </div>
      )}
    </Screen>
  );
}
