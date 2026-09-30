"use client";

import * as React from "react";

import { db } from "./db";
import { ENTITY } from "./entities";
import type { BandMode } from "./status";
import { SUPPRESSION_THRESHOLD } from "./suppression";
import { useStored } from "./use-collection";

/** One language the platform can be published in. */
export type LanguageRow = { id: string; label: string; complete: number; rtl: boolean; on: boolean };

/** Everything the System settings page owns. One record, stored under `settings`. */
export type Settings = {
  calendar: { closeDay: number; reminderDays: number; weekStart: string; weekEnd: string };
  bands: { mode: BandMode };
  languages: LanguageRow[];
  visibility: Record<string, string>;
  suppression: { threshold: number; suppressEvents: boolean };
};

export const DEFAULT_SETTINGS: Settings = {
  calendar: { closeDay: 15, reminderDays: 3, weekStart: "Sunday", weekEnd: "Thursday" },
  bands: { mode: 6 },
  languages: [
    { id: "so", label: "Soomaali", complete: 72, rtl: false, on: true },
    { id: "en", label: "English", complete: 100, rtl: false, on: true },
    { id: "sw", label: "Kiswahili", complete: 18, rtl: false, on: false },
    { id: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", complete: 24, rtl: true, on: false },
  ],
  visibility: {
    public: "Anyone, on the public site.",
    aggregated: "Only the total. Never the detail behind it.",
    authorized: "Government staff with the right role.",
    restricted: "A named few. Warnings, clan-related records, exact locations.",
  },
  suppression: { threshold: SUPPRESSION_THRESHOLD, suppressEvents: false },
};

const EMPTY: Partial<Settings> = {};

/** Read the saved settings once, outside React. */
export function readSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...db.getOne<Partial<Settings>>(ENTITY.settings, EMPTY) };
}

/** The saved settings, re-read whenever they change — in this tab or another. */
export function useSettings(): Settings {
  const stored = useStored<Partial<Settings>>(ENTITY.settings, EMPTY);
  return React.useMemo(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored]);
}

/** The suppression threshold in force, live. */
export function useSuppressionThreshold(): number {
  const n = useSettings().suppression?.threshold;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : SUPPRESSION_THRESHOLD;
}

/** Only the languages an administrator has switched on. */
export function enabledLanguages(settings: Settings): LanguageRow[] {
  const on = (settings.languages ?? []).filter((l) => l.on);
  return on.length ? on : DEFAULT_SETTINGS.languages.filter((l) => l.id === "en");
}

export function useEnabledLanguages(): LanguageRow[] {
  const settings = useSettings();
  return React.useMemo(() => enabledLanguages(settings), [settings]);
}
