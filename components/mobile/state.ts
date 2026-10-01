"use client";

import * as React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useStore } from "@/lib/store";

/**
 * Phone-side state for the district app: who is signed in, the report being
 * filled, and the outbox of items saved without signal. Each lives in its own
 * `spm_mobile_*` key, so "Reset demo" clears them with everything else.
 */

export type YesNo = boolean | null;
export type DisputeCause = "water" | "grazing" | "land" | "boundary" | "other";
export type Trend = "rising" | "unchanged" | "falling";
export type TensionReason = "grazing-water" | "land-boundary" | "revenge" | "politics" | "armed-groups" | "other";
export type EventType = "clash" | "grazing" | "water" | "land" | "displacement" | "other";
export type Tri = "yes" | "no" | "not-yet";

export type Photo = { id: string; src: string; name: string; file: string; kb: number; at: string };

export type Answers = {
  committee: { met: YesNo; meetings: number };
  disputes: { worked: number; agreements: number; cause: DisputeCause | null };
  council: { formed: YesNo; year: string | null; members: number; women: number };
  tension: { trend: Trend | null; reason: TensionReason | null };
  photos: Photo[];
  narrative: { narrative: string; bottleneck: string; corrective: string; citizen: string };
};

export type EventInput = {
  type: EventType | null;
  village: string;
  date: string;
  hurt: number;
  displaced: number;
  description: string;
  mediation: Tri | null;
  agreement: Tri | null;
  photos: Photo[];
};

export const STEPS = [
  { id: "committee", so: "Guddiga nabadda", en: "Peace committee", icon: "users-group-rounded-linear" },
  { id: "disputes", so: "Khilaafaadka", en: "Disputes", icon: "scale-linear" },
  { id: "council", so: "Golaha deegaanka", en: "Local council", icon: "shield-check-linear" },
  { id: "tension", so: "Xiisadda", en: "Tension", icon: "graph-up-linear" },
  { id: "evidence", so: "Caddaynta", en: "Photos (evidence)", icon: "gallery-linear" },
  { id: "narrative", so: "Sheekada", en: "Written answers", icon: "pen-new-square-linear" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

export const stepHref = (i: number) =>
  i < 0 ? "/mobile/home" : i >= STEPS.length ? "/mobile/report/review" : `/mobile/report/${STEPS[i].id}`;

type Option<T> = { value: T; so: string; en: string };

export const YES_NO: (Option<boolean> & { icon: string })[] = [
  { value: true, so: "Haa", en: "Yes", icon: "check-circle-linear" },
  { value: false, so: "Maya", en: "No", icon: "close-circle-linear" },
];

export const CAUSES: Option<DisputeCause>[] = [
  { value: "water", so: "Biyo", en: "Water" },
  { value: "grazing", so: "Daaqsin", en: "Grazing" },
  { value: "land", so: "Dhul", en: "Land" },
  { value: "boundary", so: "Xuduud", en: "Boundary" },
  { value: "other", so: "Kale", en: "Other" },
];

export const TRENDS: (Option<Trend> & { icon: string; color: string })[] = [
  { value: "rising", so: "Kordhay", en: "Rising", icon: "graph-up-linear", color: "text-[#b93a3a]" },
  { value: "unchanged", so: "Isku mid", en: "Unchanged", icon: "arrow-right-linear", color: "text-[#8a5200]" },
  { value: "falling", so: "Yaraaday", en: "Falling", icon: "graph-down-linear", color: "text-[#23683f]" },
];

/** Not defined in the mockup plan — proposed list, to be confirmed. */
export const REASONS: Option<TensionReason>[] = [
  { value: "grazing-water", so: "Daaqsin iyo biyo", en: "Grazing & water" },
  { value: "land-boundary", so: "Dhul iyo xuduud", en: "Land & boundary" },
  { value: "revenge", so: "Aano / mag", en: "Revenge / blood money" },
  { value: "politics", so: "Siyaasad", en: "Politics" },
  { value: "armed-groups", so: "Kooxo hubaysan", en: "Armed groups" },
  { value: "other", so: "Kale", en: "Other" },
];

/** `incident` is the type name the conflict navigator already uses. */
export const EVENT_TYPES: (Option<EventType> & { icon: string; incident: string })[] = [
  { value: "clash", so: "Dagaal", en: "Clash", icon: "danger-triangle-linear", incident: "Clash" },
  { value: "grazing", so: "Daaqsin", en: "Grazing", icon: "leaf-linear", incident: "Grazing land" },
  { value: "water", so: "Biyo", en: "Water", icon: "waterdrops-linear", incident: "Water point" },
  { value: "land", so: "Dhul / guri", en: "Land / housing", icon: "home-2-linear", incident: "Land / housing" },
  { value: "displacement", so: "Barakac", en: "Displacement", icon: "user-cross-linear", incident: "Displacement" },
  { value: "other", so: "Kale", en: "Other", icon: "menu-dots-linear", incident: "Other" },
];

export const TRI: Option<Tri>[] = [
  { value: "yes", so: "Haa", en: "Yes" },
  { value: "no", so: "Maya", en: "No" },
  { value: "not-yet", so: "Weli", en: "Not yet" },
];

export const NARRATIVE_FIELDS = [
  { key: "narrative", so: "Maxaa dhacay rubucan?", en: "In two or three sentences, what happened this quarter?", required: true },
  { key: "bottleneck", so: "Maxaa kaa hor istaagay inaad wax badan qabato?", en: "What stopped you doing more?", required: false },
  { key: "corrective", so: "Maxaad si kale u samayn doontaa rubuca soo socda?", en: "What will you do differently next quarter?", required: false },
  { key: "citizen", so: "Maxaa iska beddelay dadka caadiga ah?", en: "What changed for ordinary people?", required: false },
] as const;

export const TEXT_MAX = 400;
export const MAX_PHOTOS = 5;

export const emptyAnswers = (): Answers => ({
  committee: { met: null, meetings: 0 },
  disputes: { worked: 0, agreements: 0, cause: null },
  council: { formed: null, year: null, members: 0, women: 0 },
  tension: { trend: null, reason: null },
  photos: [],
  narrative: { narrative: "", bottleneck: "", corrective: "", citizen: "" },
});

export const emptyEvent = (date: string): EventInput => ({
  type: null, village: "", date, hurt: 0, displaced: 0, description: "", mediation: null, agreement: null, photos: [],
});

const storage = createJSONStorage(() => localStorage);

// ----------------------------------------------------------- preferences

export type Lang = "so" | "en";
/** A sentence in both languages; the screen shows one. */
export type Msg = { so: string; en: string };

type PrefsState = { lang: Lang; setLang: (lang: Lang) => void };

/** English by default; Somali with the SO switch. Light or dark follows the website's theme switch. */
export const usePrefs = create<PrefsState>()(
  persist((set) => ({ lang: "en", setLang: (lang) => set({ lang }) }), {
    name: "spm_mobile_prefs",
    storage,
    skipHydration: true,
    version: 2,
    // Version 1 stored Somali as the default for everyone; start them on English once.
    migrate: (persisted, version) => (version < 2 ? { ...(persisted as PrefsState), lang: "en" as const } : (persisted as PrefsState)),
  }),
);

/** `t("Somali", "English")` → the one the officer chose. */
export function useT() {
  const lang = usePrefs((s) => s.lang);
  return React.useCallback((so: string, en: string) => (lang === "en" ? en : so), [lang]);
}

// ---------------------------------------------------------------- session

type SessionState = {
  officerId: string | null;
  signedInAt: string | null;
  signIn: (officerId: string) => void;
  signOut: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      officerId: null,
      signedInAt: null,
      signIn: (officerId) => set({ officerId, signedInAt: new Date().toISOString() }),
      signOut: () => set({ officerId: null, signedInAt: null }),
    }),
    { name: "spm_mobile_session", storage, skipHydration: true, version: 1 },
  ),
);

// ------------------------------------------------------------------ draft

type DraftState = {
  answers: Answers | null;
  /** Steps the officer has moved past with Next. */
  done: StepId[];
  savedAt: string | null;
  patch: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  markDone: (step: StepId) => void;
  load: (answers: Answers) => void;
  clear: () => void;
};

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      answers: null,
      done: [],
      savedAt: null,
      patch: (key, value) =>
        set((s) => ({ answers: { ...(s.answers ?? emptyAnswers()), [key]: value }, savedAt: new Date().toISOString() })),
      markDone: (step) =>
        set((s) => ({
          answers: s.answers ?? emptyAnswers(),
          done: s.done.includes(step) ? s.done : [...s.done, step],
          savedAt: new Date().toISOString(),
        })),
      load: (answers) => set({ answers, done: STEPS.map((s) => s.id), savedAt: new Date().toISOString() }),
      clear: () => set({ answers: null, done: [], savedAt: null }),
    }),
    { name: "spm_mobile_draft", storage, skipHydration: true, version: 1 },
  ),
);

const EMPTY_ANSWERS = emptyAnswers();
/** The answers being filled, or a blank report when none is started. */
export const useAnswers = () => useDraft((s) => s.answers) ?? EMPTY_ANSWERS;

/** Where "continue the report" should land: the first step not yet passed. */
export function useResumeHref() {
  const done = useDraft((s) => s.done);
  const next = STEPS.findIndex((s) => !done.includes(s.id));
  return stepHref(next === -1 ? STEPS.length : next);
}

// ----------------------------------------------------------------- outbox

export type OutboxItem = {
  id: string;
  kind: "report" | "event";
  officerId: string;
  savedAt: string;
  status: "waiting" | "sending" | "failed";
  error?: Msg;
  report?: Answers;
  event?: EventInput;
};

type OutboxState = {
  items: OutboxItem[];
  add: (item: OutboxItem) => void;
  update: (id: string, patch: Partial<OutboxItem>) => void;
  remove: (id: string) => void;
};

export const useOutbox = create<OutboxState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => ({ items: [item, ...s.items] })),
      update: (id, patch) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    {
      name: "spm_mobile_outbox",
      storage,
      skipHydration: true,
      version: 1,
      // A send interrupted by a reload never finished — it is waiting again.
      merge: (persisted, current) => {
        const items = ((persisted as Partial<OutboxState> | undefined)?.items ?? []).map((i) =>
          i.status === "sending" ? { ...i, status: "waiting" as const } : i,
        );
        return { ...current, items };
      },
    },
  ),
);

// -------------------------------------------------------------- hydration

const STORES = [useSession, useDraft, useOutbox, usePrefs] as const;
const allHydrated = () => STORES.every((s) => s.persist.hasHydrated());
const onHydrated = (cb: () => void) => {
  const offs = STORES.map((s) => s.persist.onFinishHydration(cb));
  return () => offs.forEach((off) => off());
};

/** True once the session, draft and outbox have been read back from storage. */
export function useMobileHydrated() {
  const ready = React.useSyncExternalStore(onHydrated, allHydrated, () => false);
  React.useEffect(() => {
    STORES.forEach((s) => {
      if (!s.persist.hasHydrated()) void s.persist.rehydrate();
    });
  }, []);
  return ready;
}

// ------------------------------------------------------------ connection

const subscribeNet = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Real network state, overridden by the demo "simulate offline" switch. */
export function useOnline() {
  const demoOffline = useStore((s) => s.offline);
  const net = React.useSyncExternalStore(subscribeNet, () => navigator.onLine, () => true);
  return net && !demoOffline;
}
