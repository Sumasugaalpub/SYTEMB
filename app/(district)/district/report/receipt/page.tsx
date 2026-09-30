"use client";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import { ENTITY } from "@/lib/entities";
import { STATUS_LABEL, type SubStatus } from "@/lib/flow";
import { fmtDateTime } from "@/lib/format";
import { downloadPDF } from "@/lib/download";
import type { StoredSubmission } from "@/lib/seed";
import { useCollection } from "@/lib/use-collection";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { useDraft } from "@/components/phone/draft";

/** Screen 9 — the receipt. This is the officer's proof that he filed. */
export default function Receipt() {
  const d = useDraft();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const mine = rows.find((r) => r.district === BERDAALE_REPORT.district && r.period === BERDAALE_REPORT.period);
  const status = (mine?.status ?? "missing") as SubStatus;
  const queued = d.queued;
  const receipt = d.receipt ?? BERDAALE_REPORT.receipt;

  function savePdf() {
    downloadPDF(
      "Raad-Raac — district return receipt",
      [
        `Receipt: ${receipt}`,
        `District: ${BERDAALE_REPORT.district}, ${BERDAALE_REPORT.region}`,
        `Period: ${BERDAALE_REPORT.period}`,
        `Filed by: ${BERDAALE_REPORT.focalPoint.name}`,
        `Sent: ${mine?.submittedAt ? fmtDateTime(mine.submittedAt) : "not sent"}`,
        `Status: ${STATUS_LABEL[status]}`,
        "",
        "Keep this receipt. It proves the return was filed.",
      ],
      `${receipt}.pdf`,
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-5 pt-8 pb-6 text-center">
      <div
        className={`grid size-20 place-items-center rounded-full text-[44px] ${
          queued ? "bg-[var(--inv-amber)] text-white" : "bg-[var(--inv-brand)] text-[var(--inv-brand-on)]"
        }`}
      >
        <iconify-icon icon={queued ? "solar:cloud-upload-linear" : "solar:check-circle-bold"} />
      </div>

      <h1 className="text-[22px] font-extrabold text-[var(--inv-value)]">
        {queued ? "Waa la kaydiyay · Saved" : "Waa la diray · Sent"}
      </h1>
      <p className="text-[13px] text-[var(--inv-muted)]">
        {queued
          ? "It sends automatically when the phone has signal."
          : `The state office will review it. Status: ${STATUS_LABEL[status]}.`}
      </p>

      <div className="w-full rounded-[16px] border-[1.5px] border-dashed border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] p-4">
        <div className="text-[11px] font-bold tracking-[.08em] text-[var(--inv-brand-ink)] uppercase">Rasiid · Receipt</div>
        <div className="mt-1 font-mono text-[14px] font-bold break-all text-[var(--inv-value)]">{receipt}</div>
        <div className="mt-2 text-[12px] text-[var(--inv-muted)]">
          {BERDAALE_REPORT.district} · {BERDAALE_REPORT.period} ·{" "}
          {mine?.submittedAt ? fmtDateTime(mine.submittedAt) : "not sent yet"}
        </div>
      </div>

      <AudioHelp clip="receipt" text="Warbixintaada waa la helay. Mahadsanid." />

      <div className="flex w-full flex-col gap-2">
        <BigButton icon="solar:download-minimalistic-linear" tone="outline" onClick={savePdf}>
          Kaydso rasiidka · Save receipt
        </BigButton>
        <BigButton icon="solar:home-smile-linear" tone="dark" href="/district">
          Hoyga · Home
        </BigButton>
      </div>
    </div>
  );
}
