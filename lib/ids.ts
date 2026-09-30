"use client";

import { db } from "./db";

/**
 * Institutional identifiers — PREFIX-YEAR-SEQUENCE, zero padded.
 * The sequence persists, so the same ID is never handed out twice.
 */
export function nextId(prefix: string, year = 2026, pad = 4): string {
  const seqKey = `seq_${prefix}`;
  const next = db.getOne<number>(seqKey, 0) + 1;
  db.setOne(seqKey, next);
  return `${prefix}-${year}-${String(next).padStart(pad, "0")}`;
}

/** Seed a counter so generated IDs continue after the demo data, not on top of it. */
export function primeSeq(prefix: string, value: number): void {
  if (db.getOne<number>(`seq_${prefix}`, 0) < value) db.setOne(`seq_${prefix}`, value);
}
