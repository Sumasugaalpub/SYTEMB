"use client";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import type { Notification } from "@/data/notifications";

import { logAct } from "./audit";
import { db } from "./db";
import { ENTITY } from "./entities";
import type { TimelineEvent } from "./flow";
import { nextId } from "./ids";
import type { StoredSubmission } from "./seed";
import type { DraftShape } from "@/components/phone/draft";
import { draftTotals } from "@/components/phone/draft";

export type SubmitResult =
  | { ok: true; id: string; receipt: string; queued: boolean }
  | { ok: false; error: string };

/**
 * Sends the field report. Writes the submission, its timeline, the evidence
 * count, an audit entry and a notification — so the state portal sees it
 * immediately, in this tab and in any other one.
 */
export function submitDistrictReport(draft: DraftShape, opts: { offline: boolean; by: string }): SubmitResult {
  const rows = db.get<StoredSubmission>(ENTITY.submissions);
  const idx = rows.findIndex((r) => r.district === BERDAALE_REPORT.district && r.period === BERDAALE_REPORT.period);

  if (idx >= 0 && rows[idx].status === "pending")
    return { ok: false, error: "This return is already awaiting review at the state office." };
  if (idx >= 0 && rows[idx].status === "approved")
    return { ok: false, error: "This return was already approved and cannot be filed again." };

  const totals = draftTotals(draft);
  const now = new Date().toISOString();
  const receipt = draft.receipt ?? `RR-SW-BAY-BER-${BERDAALE_REPORT.period.replace("-", "")}-${String(rows.length + 1).padStart(4, "0")}`;

  if (opts.offline) {
    // Queued on the phone. Nothing reaches the state until the phone is online.
    return { ok: true, id: rows[idx]?.id ?? BERDAALE_REPORT.submissionId, receipt, queued: true };
  }

  const events: TimelineEvent[] = [
    ...(rows[idx]?.events ?? []),
    { to: "pending", at: now, by: opts.by },
  ];

  const patch: Partial<StoredSubmission> = {
    status: "pending",
    submittedAt: now,
    disputes: totals.disputes,
    resolved: totals.resolved,
    tension: draft.tension,
    evidence: draft.evidence.length,
    note: undefined,
    events,
  };

  let id: string;
  if (idx >= 0) {
    id = rows[idx].id;
    db.update<StoredSubmission>(ENTITY.submissions, id, patch);
  } else {
    id = nextId("SUB", 2026, 3);
    db.add<StoredSubmission>(ENTITY.submissions, {
      id,
      district: BERDAALE_REPORT.district,
      region: BERDAALE_REPORT.region,
      focalPoint: opts.by,
      period: BERDAALE_REPORT.period,
      status: "pending",
      submittedAt: now,
      disputes: totals.disputes,
      resolved: totals.resolved,
      tension: draft.tension,
      evidence: draft.evidence.length,
      events,
    } as StoredSubmission);
  }

  logAct({
    actor: opts.by,
    role: "district-admin",
    action: "submission.submit",
    target: id,
    note: `${BERDAALE_REPORT.district} ${BERDAALE_REPORT.period} — ${totals.resolved} of ${totals.disputes} disputes resolved.`,
  });

  db.add<Notification>(ENTITY.notifications, {
    id: nextId("N", 2026, 3),
    title: `${BERDAALE_REPORT.district} return received`,
    body: `${totals.disputes} disputes reported · awaiting state review.`,
    at: now,
    icon: "solar:inbox-in-linear",
    tone: "brand",
    href: `/state/submissions/${id}`,
    unread: true,
  });

  return { ok: true, id, receipt, queued: false };
}

/** Flushes a report that was written while the phone had no signal. */
export function flushOutbox(draft: DraftShape, by: string): SubmitResult {
  return submitDistrictReport({ ...draft, queued: false }, { offline: false, by });
}
