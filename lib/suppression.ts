"use client";

import { db } from "./db";
import { ENTITY } from "./entities";

/** Small-number suppression: people counts below the threshold are never shown. */

/** The shipped default. System settings can raise or lower it for the whole platform. */
export const SUPPRESSION_THRESHOLD = 5;

type StoredSuppression = { suppression?: { threshold?: number; suppressEvents?: boolean } };

/**
 * The threshold in force right now. System settings writes it to the settings
 * record, so every people-figure in the portal follows whatever is saved there.
 */
export function suppressionThreshold(): number {
  const stored = db.getOne<StoredSuppression>(ENTITY.settings, {});
  const n = stored?.suppression?.threshold;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : SUPPRESSION_THRESHOLD;
}

export function isSuppressed(
  value: number | null | undefined,
  peopleCount: boolean,
  threshold: number = suppressionThreshold(),
): boolean {
  return peopleCount && value !== null && value !== undefined && value > 0 && value < threshold;
}

export function suppress(
  value: number | null | undefined,
  peopleCount: boolean,
  threshold: number = suppressionThreshold(),
): number | null {
  if (value === null || value === undefined) return null;
  return isSuppressed(value, peopleCount, threshold) ? null : value;
}
