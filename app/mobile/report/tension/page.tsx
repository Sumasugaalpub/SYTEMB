"use client";

import { StepPage } from "@/components/mobile/StepPage";
import { REASONS, TRENDS, useAnswers, useDraft, useT } from "@/components/mobile/state";
import { ChoiceGrid, Note, Question, RadioGrid } from "@/components/mobile/ui";

/** Screen 6 — step 4: is tension rising, unchanged or falling, and why? */
export default function TensionStep() {
  const t = useT();
  const { tension: s } = useAnswers();
  const patch = useDraft((x) => x.patch);

  return (
    <StepPage index={3} listen="Xiisaddu sidee ayay isu beddeshay rubucan? Ma kordhay, isku mid, mise way yaraatay? Dooro sababta ugu weyn. Ha qorin magac qof.">
      <Question so="Xiisaddu sidee ayay isu beddeshay?" en="How is the tension changing?" />
      <ChoiceGrid label={t("Xiisadda", "Tension")} cols={3} height={100} options={TRENDS} value={s.trend} onChange={(trend) => patch("tension", { ...s, trend })} />
      <Question so="Sababta ugu weyn?" en="Main reason?" />
      <RadioGrid label={t("Sababta ugu weyn", "Main reason")} options={REASONS} value={s.reason} onChange={(reason) => patch("tension", { ...s, reason })} />
      <Note tone="amber" icon="danger-triangle-linear" so="Ha qorin magac qof." en="Do not write anyone's name." />
    </StepPage>
  );
}
