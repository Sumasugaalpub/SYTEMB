"use client";

import * as React from "react";

import { bridge, db } from "./db";

/**
 * Read a persisted collection and re-render whenever it changes — in this tab
 * or in another one. This is what makes the three portals behave as one system.
 */
const EMPTY: never[] = [];

export function useCollection<T extends { id: string }>(entity: string, fallback: T[] = EMPTY): T[] {
  const [rows, setRows] = React.useState<T[]>(fallback);

  // The fallback is only ever used before the first read, so it is captured once.
  const seed = React.useRef(fallback);
  const read = React.useCallback(() => setRows(db.get<T>(entity, seed.current)), [entity]);

  React.useEffect(() => {
    read();
    const offLocal = db.subscribe((changed) => {
      if (changed === entity) read();
    });
    const offRemote = bridge.listen((changed) => {
      if (changed === entity) read();
    });
    return () => {
      offLocal();
      offRemote();
    };
  }, [entity, read]);

  return rows;
}

/** Same, for a single stored value (settings, counters, drafts). */
export function useStored<T>(entity: string, fallback: T): T {
  const [value, setValue] = React.useState<T>(fallback);

  const seed = React.useRef(fallback);
  const read = React.useCallback(() => setValue(db.getOne<T>(entity, seed.current)), [entity]);

  React.useEffect(() => {
    read();
    const offLocal = db.subscribe((changed) => {
      if (changed === entity) read();
    });
    const offRemote = bridge.listen((changed) => {
      if (changed === entity) read();
    });
    return () => {
      offLocal();
      offRemote();
    };
  }, [entity, read]);

  return value;
}
