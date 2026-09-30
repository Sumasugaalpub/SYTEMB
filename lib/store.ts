import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { RoleId } from "@/data/users";
import type { BandMode } from "@/lib/status";
import { TIMELINE } from "@/data/timeline";

/** Locales this build ships message bundles for. */
export const SHIPPED_LANGS = ["en"] as const;
export type ShippedLang = (typeof SHIPPED_LANGS)[number];
/**
 * A language is whatever System settings has switched on, not a fixed list —
 * the settings page owns that roster. A locale with no bundle of its own falls
 * back to English strings rather than leaving next-intl without messages.
 */
export type Lang = string;
export const DEFAULT_LANG: Lang = "en";
export const isLang = (v: unknown): v is Lang => typeof v === "string" && /^[a-z]{2}(-[A-Za-z0-9]+)?$/.test(v);
export const hasMessages = (v: unknown): v is ShippedLang => SHIPPED_LANGS.includes(v as ShippedLang);
export type SharingFlags = { counts: boolean; districtNames: boolean; locations: boolean; evidence: boolean; notes: boolean };

type Store = {
  // shell
  isSidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (v: boolean) => void;
  // filters
  region: string;
  period: string;
  /** "As at" date driving every origin line. ISO yyyy-mm-dd. */
  asAt: string;
  bandMode: BandMode;
  setRegion: (v: string) => void;
  setPeriod: (v: string) => void;
  setAsAt: (v: string) => void;
  setBandMode: (v: BandMode) => void;
  // current page heading, rendered by the top bar
  pageHead: { title: string; meta?: string };
  setPageHead: (v: { title: string; meta?: string }) => void;
  // identity
  role: RoleId;
  setRole: (r: RoleId) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  // state → federal sharing switches (Portal 3 page 5 drives Portal 1 map)
  sharing: Record<string, SharingFlags>;
  setSharing: (state: string, key: keyof SharingFlags, value: boolean) => void;
  // district phone draft
  offline: boolean;
  setOffline: (v: boolean) => void;
};

export const DEFAULT_SHARING: Record<string, SharingFlags> = {
  "south-west": { counts: true, districtNames: true, locations: false, evidence: false, notes: false },
  hirshabelle: { counts: true, districtNames: false, locations: false, evidence: false, notes: false },
  galmudug: { counts: true, districtNames: true, locations: true, evidence: false, notes: false },
  jubaland: { counts: true, districtNames: true, locations: false, evidence: false, notes: false },
  puntland: { counts: true, districtNames: true, locations: true, evidence: true, notes: false },
  banadir: { counts: true, districtNames: true, locations: true, evidence: true, notes: true },
  northern: { counts: false, districtNames: false, locations: false, evidence: false, notes: false },
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isMobileNavOpen: false,
      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      setMobileNavOpen: (v) => set({ isMobileNavOpen: v }),
      region: "all",
      period: TIMELINE.period,
      asAt: TIMELINE.today.slice(0, 10),
      bandMode: 6,
      setRegion: (region) => set({ region }),
      setPeriod: (period) => set({ period }),
      setAsAt: (asAt) => set({ asAt }),
      setBandMode: (bandMode) => set({ bandMode }),
      pageHead: { title: "Dashboard" },
      setPageHead: (pageHead) => set({ pageHead }),
      role: "super-admin",
      setRole: (role) => set({ role }),
      lang: "en",
      setLang: (lang) => set({ lang }),
      sharing: DEFAULT_SHARING,
      setSharing: (state, key, value) =>
        set((s) => ({ sharing: { ...s.sharing, [state]: { ...s.sharing[state], [key]: value } } })),
      offline: false,
      setOffline: (offline) => set({ offline }),
    }),
    {
      name: "spm-store",
      storage: createJSONStorage(() => localStorage),
      // `role` is deliberately not persisted while the role switcher is off —
      // a stale role in localStorage is what locked reviewers out of the shell.
      partialize: (s) => ({ isSidebarCollapsed: s.isSidebarCollapsed, region: s.region, period: s.period, asAt: s.asAt, bandMode: s.bandMode, lang: s.lang, sharing: s.sharing }),
      skipHydration: true,
      version: 1,
      // Pre-versioned blobs (v0) predate the English-only switch; merge below
      // already drops any language this build no longer ships.
      migrate: (persisted) => persisted as Store,
      // Old blobs in localStorage can name a language this build no longer ships,
      // which would leave next-intl without messages. Drop anything unrecognised.
      merge: (persisted, current) => {
        const saved = { ...(persisted as Partial<Store> | undefined) };
        if (!isLang(saved.lang)) delete saved.lang;
        return { ...current, ...saved };
      },
    },
  ),
);
