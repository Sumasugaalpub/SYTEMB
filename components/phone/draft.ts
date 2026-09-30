"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";

export type DraftDisputes = { type: string; count: number; resolved: number }[];

export type DraftShape = {
  committee: { active: boolean; members: number; women: number; youth: number; meetings: number };
  disputes: DraftDisputes;
  council: { formed: boolean; formedWhen: string; members: number; women: number; convened: boolean; sessions: number; securityForces: boolean };
  tension: 1 | 2 | 3 | 4 | 5;
  armed: boolean;
  evidence: string[];
  narrative: { whatHappened: string; whoActed: string; whatChanged: string; whatIsNeeded: string };
  submitted: boolean;
  submissionId: string | null;
  receipt: string | null;
  sentAt: string | null;
  queued: boolean;
  savedAt: string | null;
};

type Draft = DraftShape & {
  set: <K extends keyof DraftShape>(key: K, value: DraftShape[K]) => void;
  patch: (p: Partial<DraftShape>) => void;
  reset: () => void;
};

const initial = (): DraftShape => ({
  committee: { ...BERDAALE_REPORT.committee },
  disputes: BERDAALE_REPORT.disputes.map((d) => ({ ...d })),
  council: {
    formed: true,
    formedWhen: "2023-12",
    members: 21,
    women: 6,
    convened: BERDAALE_REPORT.council.convened,
    sessions: BERDAALE_REPORT.council.sessions,
    securityForces: BERDAALE_REPORT.council.securityForces,
  },
  tension: BERDAALE_REPORT.tension.level,
  armed: BERDAALE_REPORT.tension.armed,
  evidence: BERDAALE_REPORT.evidence.map((e) => e.id),
  narrative: { ...BERDAALE_REPORT.narrative },
  submitted: false,
  submissionId: null,
  receipt: null,
  sentAt: null,
  queued: false,
  savedAt: null,
});

/**
 * The field app's draft. Persisted, so leaving mid-form and coming back
 * restores exactly what was typed — including after a refresh.
 */
export const useDraft = create<Draft>()(
  persist(
    (set) => ({
      ...initial(),
      set: (key, value) => set({ [key]: value, savedAt: new Date().toISOString() } as Partial<Draft>),
      patch: (p) => set({ ...p, savedAt: new Date().toISOString() }),
      reset: () => set(initial()),
    }),
    {
      name: "spm_draft_district",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
    },
  ),
);

export const draftTotals = (d: DraftShape) => ({
  disputes: d.disputes.reduce((a, x) => a + x.count, 0),
  resolved: d.disputes.reduce((a, x) => a + x.resolved, 0),
});
