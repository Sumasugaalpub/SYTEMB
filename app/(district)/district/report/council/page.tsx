"use client";

import { useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { Counter, Screen, StepNav } from "@/components/phone/StepNav";

const YEARS = ["2021", "2022", "2023-12", "2024", "2025", "2026"];

/**
 * Screen 5 — step 3. The local council (golaha deegaanka).
 * Most districts have none: about 26 nationally have an elected council,
 * 19 of them in Puntland. The question that matters is whether it meets.
 */
export default function CouncilStep() {
  const { council, set } = useDraft();
  const up = (patch: Partial<typeof council>) => set("council", { ...council, ...patch });

  return (
    <>
      <Screen title="Golaha deegaanka · Local council">
        <AudioHelp clip="council" text="Golaha deegaanka ma la sameeyay? Rubucan ma shiray?" />

        <div className="grid grid-cols-2 gap-2">
          <BigButton icon="solar:check-circle-linear" tone="outline" selected={council.formed} onClick={() => up({ formed: true })}>
            Haa · Yes
          </BigButton>
          <BigButton
            icon="solar:close-circle-linear"
            tone="outline"
            selected={!council.formed}
            onClick={() => up({ formed: false, convened: false, sessions: 0, members: 0, women: 0 })}
          >
            Maya · No
          </BigButton>
        </div>

        {council.formed ? (
          <>
            <div>
              <div className="mb-1.5 text-[13px] font-bold">Goorma · When was it formed</div>
              <div className="flex flex-wrap gap-1.5">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => up({ formedWhen: y })}
                    className={`rounded-[10px] border-[1.5px] px-3 py-1.5 text-[13px] font-bold ${
                      council.formedWhen === y
                        ? "border-[var(--inv-brand)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)]"
                        : "border-[var(--inv-card-border)] text-[var(--inv-title)]"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <Counter label="Xubnaha · Members" icon="solar:users-group-rounded-linear" value={council.members} onChange={(n) => up({ members: n })} />
            <Counter label="Haween · Women" icon="solar:user-heart-linear" value={council.women} onChange={(n) => up({ women: Math.min(n, council.members) })} />

            <div className="grid grid-cols-2 gap-2">
              <BigButton icon="solar:calendar-linear" tone="outline" selected={council.convened} onClick={() => up({ convened: true })}>
                Shiray · Met
              </BigButton>
              <BigButton icon="solar:calendar-minimalistic-linear" tone="outline" selected={!council.convened} onClick={() => up({ convened: false, sessions: 0 })}>
                Ma shirin · Did not
              </BigButton>
            </div>

            {council.convened ? (
              <Counter label="Fadhiyada · Sessions" icon="solar:clipboard-list-linear" value={council.sessions} onChange={(n) => up({ sessions: n })} />
            ) : null}
          </>
        ) : (
          <p className="rounded-[12px] bg-[#f4f5f7] px-3 py-2.5 text-[12.5px] leading-[1.45] text-[var(--inv-title)] dark:bg-[#1c1d22]">
            Most districts have no formed council. Around 26 districts nationally have an elected one,
            19 of them in Puntland.
          </p>
        )}

        <BigButton
          icon="solar:shield-user-linear"
          tone="outline"
          selected={council.securityForces}
          onClick={() => up({ securityForces: !council.securityForces })}
          sub="Riix si aad u beddesho"
        >
          Ciidamada amniga way joogeen · Security forces present: {council.securityForces ? "HAA" : "MAYA"}
        </BigButton>
      </Screen>
      <StepNav />
    </>
  );
}
