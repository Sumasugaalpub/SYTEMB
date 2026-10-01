"use client";

import { StepPage } from "@/components/mobile/StepPage";
import { YES_NO, useAnswers, useDraft, useT } from "@/components/mobile/state";
import { ChoiceGrid, CounterWide, Question } from "@/components/mobile/ui";

/** Screen 3 — step 1: did the peace committee meet? */
export default function CommitteeStep() {
  const t = useT();
  const { committee: c } = useAnswers();
  const patch = useDraft((s) => s.patch);

  return (
    <StepPage index={0} listen="Guddiga nabaddu ma shiray rubucan? Haddii uu shiray, sheeg inta jeer ee uu shiray.">
      <Question so="Guddigu ma shiray rubucan?" en="Did the committee meet this quarter?" />
      <ChoiceGrid
        label={t("Guddigu ma shiray", "Did the committee meet")}
        options={YES_NO}
        value={c.met}
        onChange={(met) => patch("committee", { met, meetings: met ? Math.max(1, c.meetings) : 0 })}
      />
      {c.met ? (
        <>
          <Question so="Imisa jeer ayuu shiray?" en="How many times did it meet?" />
          <CounterWide so="Kulamada" en="Meetings" value={c.meetings} min={1} onChange={(meetings) => patch("committee", { ...c, meetings })} />
        </>
      ) : null}
    </StepPage>
  );
}
