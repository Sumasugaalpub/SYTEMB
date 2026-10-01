"use client";

import * as React from "react";

/**
 * Somali audio help. Plays /audio/so/<clip>.mp3 when it has been recorded;
 * until then the phone's own voice reads the Somali text aloud.
 */
export function useSpeak() {
  const [playing, setPlaying] = React.useState(false);

  const play = React.useCallback((text: string, clip?: string) => {
    const speak = () => {
      if (!("speechSynthesis" in window)) return setPlaying(false);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "so-SO";
      u.onend = () => setPlaying(false);
      u.onerror = () => setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    };
    setPlaying(true);
    if (!clip) return speak();
    const audio = new Audio(`/audio/so/${clip}.mp3`);
    audio.onended = () => setPlaying(false);
    audio.play().catch(speak);
  }, []);

  return { playing, play };
}
