"use client";

import { StepPage } from "@/components/mobile/StepPage";
import { NARRATIVE_FIELDS, TEXT_MAX, useAnswers, useDraft, useT } from "@/components/mobile/state";
import { ListenButton, Note, TextArea } from "@/components/mobile/ui";

/** Screen 7b — step 6: four written answers. The first one is required. */
export default function NarrativeStep() {
  const t = useT();
  const { narrative } = useAnswers();
  const patch = useDraft((s) => s.patch);
  const missing = !narrative.narrative.trim();

  return (
    <StepPage index={5} canNext={!missing} listen="Ka jawaab afarta su'aalood. Su'aasha koowaad waa qasab. Ha qorin magac qof.">
      {NARRATIVE_FIELDS.map((f, i) => (
        <div key={f.key} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[#1f4263] text-[13px] font-extrabold text-white">{i + 1}</span>
            <p className="flex-1 text-[15.5px] leading-[1.25] font-extrabold">
              {t(f.so, f.en)}
              {f.required ? <span className="text-[var(--m-red)]"> *</span> : null}
            </p>
            <ListenButton small text={f.so} clip={`narrative-${i + 1}`} />
          </div>
          <TextArea
            label={t(f.so, f.en)}
            value={narrative[f.key]}
            max={TEXT_MAX}
            rows={f.required ? 4 : 2}
            invalid={f.required && missing}
            onChange={(v) => patch("narrative", { ...narrative, [f.key]: v })}
          />
        </div>
      ))}
      <Note tone="amber" icon="danger-triangle-linear" so="Ha qorin magac qof." en="Do not write anyone's name." />
    </StepPage>
  );
}
