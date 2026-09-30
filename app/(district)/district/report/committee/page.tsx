"use client";

import { useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { Counter, Screen, StepNav } from "@/components/phone/StepNav";

/** Screen 3 — step 1. */
export default function CommitteeStep() {
  const { committee, set } = useDraft();
  const up = (k: keyof typeof committee, v: number | boolean) => set("committee", { ...committee, [k]: v });
  return (
    <>
      <Screen title="Guddiga nabadda · Peace committee">
        <AudioHelp clip="committee" text="Guddiga nabaddu ma shaqeynayaa? Imisa xubnood ayaa ku jira?" />
        <div className="grid grid-cols-2 gap-2">
          <BigButton icon="solar:check-circle-linear" tone="outline" selected={committee.active} onClick={() => up("active", true)}>Haa · Yes</BigButton>
          <BigButton icon="solar:close-circle-linear" tone="outline" selected={!committee.active} onClick={() => up("active", false)}>Maya · No</BigButton>
        </div>
        <Counter label="Xubnaha · Members" icon="solar:users-group-rounded-linear" value={committee.members} onChange={(n) => up("members", n)} />
        <Counter label="Haween · Women" icon="solar:user-heart-linear" value={committee.women} onChange={(n) => up("women", n)} />
        <Counter label="Dhallinyaro · Youth" icon="solar:user-rounded-linear" value={committee.youth} onChange={(n) => up("youth", n)} />
        <Counter label="Kulamada · Meetings" icon="solar:calendar-linear" value={committee.meetings} onChange={(n) => up("meetings", n)} />
      </Screen>
      <StepNav />
    </>
  );
}
