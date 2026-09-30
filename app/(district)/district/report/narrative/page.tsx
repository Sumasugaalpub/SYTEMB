"use client";

import { useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { Screen, StepNav } from "@/components/phone/StepNav";

const MAX = 400;

const FIELDS = [
  { key: "whatHappened", en: "What happened?", so: "Maxaa dhacay?", required: true },
  { key: "whoActed", en: "What stopped you doing more?", so: "Maxaa ku hor istaagay?", required: false },
  { key: "whatChanged", en: "What will you do differently next quarter?", so: "Maxaad si kale u samayn doontaa?", required: false },
  { key: "whatIsNeeded", en: "What changed for ordinary people?", so: "Maxaa u beddelay dadka caadiga ah?", required: false },
] as const;

/** Screen 7b — step 6. The four written fields every result carries. */
export default function NarrativeStep() {
  const { narrative, set } = useDraft();

  return (
    <>
      <Screen title="Sheekada · The story">
        <AudioHelp clip="narrative" text="Afar su'aalood ka jawaab. Ha qorin magac qof." />

        {FIELDS.map((f, i) => {
          const value = narrative[f.key];
          const empty = f.required && !value.trim();
          return (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[14px] font-bold">
                <span className="grid size-6 place-items-center rounded-full bg-[var(--inv-brand)] text-[12px] text-[var(--inv-brand-on)]">
                  {i + 1}
                </span>
                {f.en}
                {f.required ? <span className="text-[var(--inv-red)]">*</span> : null}
              </span>
              <textarea
                value={value}
                maxLength={MAX}
                onChange={(e) => set("narrative", { ...narrative, [f.key]: e.target.value })}
                rows={3}
                placeholder={f.so}
                className={`rounded-[14px] border-[1.5px] bg-transparent px-3 py-2.5 text-[14px] leading-[1.45] outline-none focus:border-[var(--inv-brand)] ${
                  empty ? "border-[var(--inv-red)]" : "border-[var(--inv-card-border)]"
                }`}
              />
              <span className="flex items-center justify-between text-[11px]">
                <span className={empty ? "font-semibold text-[var(--inv-red)]" : "text-[var(--inv-muted)]"}>
                  {empty ? "This one is required" : "Ha qorin magac qof · do not write anyone's name"}
                </span>
                <span className="tabular-nums text-[var(--inv-muted)]">
                  {value.length}/{MAX}
                </span>
              </span>
            </label>
          );
        })}
      </Screen>
      <StepNav />
    </>
  );
}
