"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import { wait } from "@/lib/async";
import { submitDistrictReport } from "@/lib/district-submit";
import { useStore } from "@/lib/store";
import { draftTotals, useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { Screen } from "@/components/phone/StepNav";
import { REPORT_STEPS } from "@/components/phone/StepProgress";

/** Screen 8 — review, then send. */
export default function ReviewStep() {
  const t = useTranslations("district");
  const router = useRouter();
  const d = useDraft();
  const offline = useStore((s) => s.offline);
  const [sending, setSending] = React.useState(false);

  const totals = draftTotals(d);
  const blocked = totals.resolved > totals.disputes;

  const rows: [string, string][] = [
    ["Committee", `${d.committee.active ? "Active" : "Inactive"} · ${d.committee.members} members · ${d.committee.women} women · ${d.committee.meetings} meetings`],
    ["Disputes", `${totals.resolved} of ${totals.disputes} resolved`],
    ["Council", d.council.formed ? `Formed ${d.council.formedWhen} · ${d.council.members} members, ${d.council.women} women · ${d.council.convened ? `${d.council.sessions} sessions` : "did not meet"}` : "No local council"],
    ["Tension", `Level ${d.tension}${d.armed ? " · armed actors" : ""}`],
    ["Evidence", `${d.evidence.length} files`],
    ["Story", d.narrative.whatHappened.slice(0, 70) + "…"],
  ];

  async function send() {
    if (blocked) return toast.error("Resolved disputes cannot exceed total disputes.");
    if (!d.narrative.whatHappened.trim()) return toast.error("Write what happened before sending.");
    setSending(true);
    await wait();
    const res = submitDistrictReport(d, { offline, by: BERDAALE_REPORT.focalPoint.name });
    setSending(false);
    if (!res.ok) return toast.error(res.error);
    d.patch({
      submitted: !res.queued,
      queued: res.queued,
      submissionId: res.id,
      receipt: res.receipt,
      sentAt: res.queued ? null : new Date().toISOString(),
    });
    toast.success(res.queued ? "Saved — it will send when you have signal" : "Report sent to the state office");
    router.push("/district/report/receipt");
  }

  return (
    <Screen title="Hubi · Review">
      <AudioHelp clip="review" text="Hubi jawaabahaaga. Riix mid kasta si aad u beddesho." />

      {blocked ? (
        <p className="rounded-[12px] bg-[#fdecec] px-3 py-2 text-[12px] font-semibold text-[var(--inv-red)] dark:bg-[rgba(217,74,74,.14)]">
          Resolved disputes cannot be more than total disputes. Fix step 2.
        </p>
      ) : null}

      {rows.map(([k, v], i) => (
        <Link
          key={k}
          href={`/district/report/${REPORT_STEPS[i].slug}`}
          className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-[var(--inv-card-border)] px-3 py-3 no-underline"
        >
          <iconify-icon icon={REPORT_STEPS[i].icon} className="text-[22px] text-[var(--inv-brand-ink)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[var(--inv-value)]">{k}</span>
            <span className="block truncate text-[12px] text-[var(--inv-muted)]">{v}</span>
          </span>
          <iconify-icon icon="solar:pen-linear" className="text-[18px] text-[var(--inv-icon)]" />
        </Link>
      ))}

      <div className="pb-4">
        <BigButton icon="solar:plain-linear" disabled={sending || blocked} onClick={send}>
          {sending ? "Sending…" : t("submit")}
        </BigButton>
      </div>
    </Screen>
  );
}
