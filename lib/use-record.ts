"use client";

import * as React from "react";

import { useCollection } from "./use-collection";

/** Seed rows overlaid with whatever is stored. A stored row wins by id. */
export function mergeById<T extends { id: string }>(seed: T[], stored: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of seed) byId.set(row.id, row);
  for (const row of stored) byId.set(row.id, row);
  return [...byId.values()];
}

/** The whole collection as the portal sees it: seed plus everything created since. */
export function useRecords<T extends { id: string }>(entity: string, seed: T[]): T[] {
  const stored = useCollection<T>(entity, seed);
  return React.useMemo(() => mergeById(seed, stored), [seed, stored]);
}

/**
 * One record by id, from the stored collection merged over the seed array.
 * `ready` is false until the first read of storage has happened, so a detail
 * page never calls notFound() on a record that was created in this browser.
 */
export function useRecord<T extends { id: string }>(
  entity: string,
  seed: T[],
  id: string | undefined,
): { record: T | undefined; ready: boolean } {
  const rows = useRecords(entity, seed);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return { record: id ? rows.find((r) => r.id === id) : undefined, ready };
}
