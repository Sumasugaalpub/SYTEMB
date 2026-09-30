"use client";

import * as React from "react";

import { seedAll } from "@/lib/seed";

let seeded = false;

/**
 * Lays the seed down on first boot. Reads run through `useCollection`, which
 * subscribes to the store, so nothing else here needs React state.
 */
export function DbProvider({ children }: { children: React.ReactNode }) {
  const ready = React.useSyncExternalStore(
    (cb) => {
      if (!seeded) {
        seedAll();
        seeded = true;
        cb();
      }
      return () => {};
    },
    () => seeded,
    () => false,
  );

  if (!ready) return null;
  return <>{children}</>;
}
