"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

/**
 * 🎤 on every screen. Plays /audio/so/<clip>.mp3; if the clip is not recorded
 * yet, falls back to the browser's speech voice reading the Somali prompt.
 */
export function AudioHelp({ clip, text }: { clip: string; text: string }) {
  const t = useTranslations("district");
  const [playing, setPlaying] = React.useState(false);

  function speak() {
    if (!("speechSynthesis" in window)) return setPlaying(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "so-SO";
    u.onend = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function play() {
    setPlaying(true);
    const audio = new Audio(`/audio/so/${clip}.mp3`);
    audio.onended = () => setPlaying(false);
    audio.play().catch(speak);
  }

  return (
    <button type="button" onClick={play} className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] px-3.5 py-2.5 text-left text-[var(--inv-brand-ink)]" aria-label={t("audio")}>
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--inv-brand)] text-[var(--inv-brand-on)]">
        <iconify-icon icon={playing ? "solar:soundwave-linear" : "solar:microphone-3-bold"} className={playing ? "animate-pulse text-[18px]" : "text-[18px]"} />
      </span>
      <span className="flex-1 text-[12.5px] leading-[1.35] font-semibold">{text}</span>
      <span className="text-[11px] font-bold uppercase">{t("audio")}</span>
    </button>
  );
}
