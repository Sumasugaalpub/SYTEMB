"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import { TIMELINE } from "@/data/timeline";
import { ENTITY } from "@/lib/entities";
import { flushOutbox } from "@/lib/district-submit";
import { fmtDate, fmtDateTime, fmtPeriod } from "@/lib/format";
import { STATUS_LABEL, type SubStatus } from "@/lib/flow";
import type { StoredSubmission } from "@/lib/seed";
import { useCollection } from "@/lib/use-collection";
import { useStore } from "@/lib/store";
import { wait } from "@/lib/async";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { useDraft } from "@/components/phone/draft";

/** Screen 2 — home. Everything on it is read from stored data. */
export default function DistrictHome() {
  const t = useTranslations("district");
  const { offline, setOffline } = useStore();
  const draft = useDraft();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const [sending, setSending] = React.useState(false);

  const mine = rows.find((r) => r.district === BERDAALE_REPORT.district && r.period === BERDAALE_REPORT.period);
  const status = (mine?.status ?? "missing") as SubStatus;
  const sentCount = rows.filter((r) => r.district === BERDAALE_REPORT.district && r.submittedAt).length;

  async function send() {
    setSending(true);
    await wait();
    const res = flushOutbox(draft, BERDAALE_REPORT.focalPoint.name);
    setSending(false);
    if (!res.ok) return toast.error(res.error);
    draft.patch({ queued: false, submitted: true, submissionId: res.id, receipt: res.receipt, sentAt: new Date().toISOString() });
    toast.success("Sent to the state office");
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <div>
        <div className="text-[12px] font-semibold text-[var(--inv-muted)]">
          Salaan, {BERDAALE_REPORT.focalPoint.name.split(" ")[0]}
        </div>
        <h1 className="text-[22px] font-extrabold text-[var(--inv-value)]">{t("home")}</h1>
      </div>

      <AudioHelp clip="home" text="Riix badhanka si aad u bilowdo warbixinta degmada." />

      <div className="rounded-[16px] bg-[#0f3b2b] p-4 text-white">
        <div className="text-[11px] font-bold tracking-[.08em] text-[#8fd6b4] uppercase">
          {STATUS_LABEL[status]} · {fmtPeriod(TIMELINE.period)}
        </div>
        <div className="mt-1 text-[16px] font-bold">Warbixinta rubuca · Quarterly return</div>
        <div className="mt-0.5 text-[12px] text-white/70">
          {mine?.submittedAt ? `Sent ${fmtDateTime(mine.submittedAt)}` : `Closes ${fmtDate("2026-04-15")}`}
        </div>
      </div>

      {draft.queued ? (
        <div className="rounded-[16px] border-[1.5px] border-[var(--inv-amber)] bg-[#fdf3e1] p-3.5 dark:bg-[rgba(217,138,6,.14)]">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--inv-amber)]">
            <iconify-icon icon="solar:cloud-upload-linear" className="text-[18px]" />
            1 warbixin sugaysa · 1 report waiting to send
          </div>
          <p className="mt-1 text-[12px] text-[var(--inv-muted)]">Saved on this phone. It sends as soon as there is signal.</p>
          <div className="mt-3">
            <BigButton
              icon="solar:plain-linear"
              tone={offline ? "outline" : "brand"}
              disabled={offline || sending}
              onClick={send}
              className="min-h-[48px] justify-center text-[14px]"
            >
              {sending ? "Sending…" : offline ? "Waiting for signal" : "Send now"}
            </BigButton>
          </div>
        </div>
      ) : null}

      {mine?.status === "returned" ? (
        <div className="rounded-[16px] border-[1.5px] border-[var(--inv-red)] bg-[#fdecec] p-3.5 dark:bg-[rgba(217,74,74,.14)]">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--inv-red)]">
            <iconify-icon icon="solar:undo-left-round-linear" className="text-[18px]" />
            Loo celiyay saxid · Sent back
          </div>
          <p className="mt-1 text-[12px] text-[var(--inv-title)]">{mine.note}</p>
        </div>
      ) : null}

      <BigButton
        icon="solar:document-add-linear"
        sub={draft.savedAt ? `Draft saved ${fmtDateTime(draft.savedAt)}` : "6 tallaabo · 6 steps"}
        href="/district/report/committee"
      >
        {draft.savedAt ? "Sii wad · Continue draft" : t("newReport")}
      </BigButton>

      <BigButton icon="solar:danger-triangle-linear" tone="red" sub="Degdeg · urgent" href="/district/event">
        {t("eventReport")}
      </BigButton>

      <BigButton
        icon="solar:inbox-linear"
        tone="outline"
        sub={`${sentCount} sent · ${draft.queued ? 1 : 0} waiting`}
        href="/district/report/receipt"
      >
        Warbixinnadaydii · My reports
      </BigButton>

      <BigButton
        icon={offline ? "solar:wi-fi-router-linear" : "solar:cloud-cross-linear"}
        tone="outline"
        sub="Demo toggle"
        onClick={() => setOffline(!offline)}
      >
        {offline ? "Go online" : "Simulate offline"}
      </BigButton>
    </div>
  );
}
