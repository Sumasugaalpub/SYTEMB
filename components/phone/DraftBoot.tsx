"use client";

import * as React from "react";

import { useDraft } from "./draft";

/** Rehydrates the persisted draft before the first paint so a refresh restores the form. */
export function DraftBoot({ children }: { children: React.ReactNode }) {
  const ready = React.useSyncExternalStore(
    useDraft.persist.onFinishHydration,
    () => useDraft.persist.hasHydrated(),
    () => false,
  );

  React.useEffect(() => {
    if (!useDraft.persist.hasHydrated()) void useDraft.persist.rehydrate();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
