"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { receiptHref, useReportStatus } from "./actions";
import { useOfficer } from "./officers";
import { STEPS, stepHref, useDraft, useT } from "./state";
import { BackButton, Cta, ListenButton, Note, ProgressCard, Screen, SectionHead, TopBar } from "./ui";

/**
 * Frame for the six quarterly-report steps: progress card, the questions,
 * Next. Answers save on every tap, so Back and "Save & close" lose nothing.
 */
export function StepPage({ index, listen, canNext = true, children }: { index: number; listen: string; canNext?: boolean; children: React.ReactNode }) {
  const t = useT();
  const step = STEPS[index];
  const router = useRouter();
  const officer = useOfficer();
  const markDone = useDraft((s) => s.markDone);
  const { sub, queued } = useReportStatus(officer);
  const sent = sub?.status === "pending" || sub?.status === "approved";

  function next() {
    markDone(step.id);
    router.push(stepHref(index + 1));
  }

  function saveAndClose() {
    toast.success(t("Qabyo waa la kaydiyay", "Draft saved"));
    router.push("/mobile/home");
  }

  return (
    <Screen
      nav="report"
      top={<TopBar title={t("Warbixinta rubuca", "Quarterly report")} left={<BackButton href={stepHref(index - 1)} />} right={<ListenButton text={listen} clip={step.id} />} />}
    >
      <ProgressCard step={index + 1} so={step.so} en={step.en} />
      {sent ? (
        <Note tone="green" icon="check-circle-linear" so="Warbixinta rubucan waa la diray." en="This quarter's report was already sent.">
          <Link href={receiptHref(sub)} className="mt-1 block text-[13.5px] font-extrabold text-[var(--m-ink)]">
            {t("Eeg rasiidka", "View receipt")}
          </Link>
        </Note>
      ) : queued ? (
        <Note tone="amber" icon="inbox-linear" so="Warbixinta rubucan waxay ku jirtaa Sugaya." en="This quarter's report is waiting in the Outbox." />
      ) : null}
      <SectionHead title={t("Su'aalaha", "Questions")} action={{ label: t("Kaydi oo xir", "Save & close"), onClick: saveAndClose }} />
      {children}
      <Cta icon="alt-arrow-right-linear" onClick={next} disabled={!canNext || sent} className="mt-auto">
        {t("Xiga", "Next")}
      </Cta>
    </Screen>
  );
}
