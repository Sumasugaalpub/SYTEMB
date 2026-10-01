"use client";

import { TIMELINE } from "@/data/timeline";
import { StepPage } from "@/components/mobile/StepPage";
import { YES_NO, useAnswers, useDraft, useT } from "@/components/mobile/state";
import { ChoiceGrid, CounterSquare, Note, Question, Segmented } from "@/components/mobile/ui";

const THIS_YEAR = Number(TIMELINE.today.slice(0, 4));
const YEARS = Array.from({ length: 5 }, (_, i) => String(THIS_YEAR - 4 + i)).map((y) => ({ value: y, label: y }));

/** Screen 5 — step 3: has the local council formed? */
export default function CouncilStep() {
  const t = useT();
  const { council: c } = useAnswers();
  const patch = useDraft((s) => s.patch);

  return (
    <StepPage index={2} listen="Golaha deegaanka ma la sameeyay? Haddii la sameeyay, sheeg goorta, inta xubnood iyo inta haween ah.">
      <Question so="Golaha deegaanka ma la sameeyay?" en="Has the local council been formed?" />
      <ChoiceGrid
        label={t("Golaha ma la sameeyay", "Has the council formed")}
        options={YES_NO}
        value={c.formed}
        onChange={(formed) => patch("council", formed ? { ...c, formed } : { formed, year: null, members: 0, women: 0 })}
      />
      {c.formed ? (
        <>
          <Question so="Goorma la sameeyay?" en="When was it formed?" />
          <Segmented onPage label={t("Goorma", "When")} options={YEARS} value={c.year} onChange={(year) => patch("council", { ...c, year })} />
          <div className="grid grid-cols-2 gap-3">
            <CounterSquare so="Xubnaha" en="Members" value={c.members} onChange={(members) => patch("council", { ...c, members, women: Math.min(c.women, members) })} />
            <CounterSquare so="Haweenka" en="Women" value={c.women} max={c.members} onChange={(women) => patch("council", { ...c, women })} />
          </div>
        </>
      ) : null}
      <Note so="Degmooyinka badankood ma laha gole la sameeyay. Dooro Maya haddii aanu jirin." en="Most districts have no formed council. Answer No if there is none." />
    </StepPage>
  );
}
