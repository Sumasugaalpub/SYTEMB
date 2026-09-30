"use client";

import { cn } from "@/lib/utils";
import { useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { Screen, StepNav } from "@/components/phone/StepNav";

const LEVELS = [
  { n: 1, face: "solar:emoji-funny-circle-linear", label: "Degan · Calm", color: "#159a52" },
  { n: 2, face: "solar:smile-circle-linear", label: "Yar · Low", color: "#8fb33a" },
  { n: 3, face: "solar:expressionless-circle-linear", label: "Dhexe · Medium", color: "#d98a06" },
  { n: 4, face: "solar:sad-circle-linear", label: "Sare · High", color: "#d94a4a" },
  { n: 5, face: "solar:confounded-circle-linear", label: "Aad u sare · Severe", color: "#8b1e1e" },
] as const;

/** Screen 6 — step 4. */
export default function TensionStep() {
  const { tension, armed, set } = useDraft();
  return (
    <>
      <Screen title="Xiisadda · Tension">
        <AudioHelp clip="tension" text="Sidee bay xiisaddu tahay degmadaada hadda? Dooro weji." />
        <div className="flex flex-col gap-2">
          {LEVELS.map((l) => (
            <button key={l.n} type="button" onClick={() => set("tension", l.n)} className={cn("flex min-h-[58px] items-center gap-3 rounded-[14px] border-[1.5px] px-4 text-left text-[15px] font-bold", tension === l.n ? "text-white" : "border-[var(--inv-card-border)]")} style={tension === l.n ? { background: l.color, borderColor: l.color } : undefined}>
              <iconify-icon icon={l.face} className="text-[30px]" style={tension === l.n ? undefined : { color: l.color }} />
              <span className="flex-1">{l.label}</span>
              <span className="text-[20px] font-extrabold">{l.n}</span>
            </button>
          ))}
        </div>
        <BigButton icon="solar:danger-triangle-linear" tone={armed ? "red" : "outline"} onClick={() => set("armed", !armed)} sub="Riix si aad u beddesho">Hub ayaa la arkay · Armed actors seen: {armed ? "HAA" : "MAYA"}</BigButton>
      </Screen>
      <StepNav />
    </>
  );
}
