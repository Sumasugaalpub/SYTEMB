"use client";

import { StepPage } from "@/components/mobile/StepPage";
import { CAUSES, useAnswers, useDraft, useT } from "@/components/mobile/state";
import { CounterSquare, Note, Question, RadioGrid } from "@/components/mobile/ui";

/** Screen 4 — step 2: disputes worked on, signed agreements, main cause. */
export default function DisputesStep() {
  const t = useT();
  const { disputes: d } = useAnswers();
  const patch = useDraft((s) => s.patch);
  const tooMany = d.agreements > d.worked;

  return (
    <StepPage index={1} canNext={!tooMany} listen="Imisa khilaaf ayaad ka shaqaysay rubucan? Imisa ayaa ku dhammaaday heshiis la saxiixay? Dooro sababta ugu weyn.">
      <div className="grid grid-cols-2 gap-3">
        <CounterSquare so="Khilaafaad" en="Disputes" value={d.worked} onChange={(worked) => patch("disputes", { ...d, worked })} />
        <CounterSquare so="Heshiisyo" en="Agreements" value={d.agreements} onChange={(agreements) => patch("disputes", { ...d, agreements })} />
      </div>
      {tooMany ? (
        <Note tone="red" icon="danger-triangle-linear" so="Heshiisyadu kama badnaan karaan khilaafaadka. Fadlan hubi." en="Agreements cannot be more than disputes. Please check." />
      ) : null}
      <Question so="Sababta ugu weyn?" en="Main cause?" />
      <RadioGrid label={t("Sababta ugu weyn", "Main cause")} options={CAUSES} value={d.cause} onChange={(cause) => patch("disputes", { ...d, cause })} />
    </StepPage>
  );
}
