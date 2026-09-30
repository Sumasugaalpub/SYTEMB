"use client";

import type { Notification } from "@/data/notifications";

import { logAct } from "./audit";
import { db } from "./db";
import { ENTITY } from "./entities";
import { transition, type SubStatus } from "./flow";
import { nextId } from "./ids";
import { rules } from "./rules";
import type { StoredSubmission } from "./seed";

export type ActionResult = { ok: true; row: StoredSubmission } | { ok: false; error: string };

function notify(n: Omit<Notification, "id">) {
  db.add<Notification>(ENTITY.notifications, { id: nextId("N", 2026, 3), ...n });
}

export function approveSubmission(id: string, by: string): ActionResult {
  const row = db.get<StoredSubmission>(ENTITY.submissions).find((r) => r.id === id);
  if (!row) return { ok: false, error: "That return no longer exists." };

  const rule = rules.canApprove(row);
  if (!rule.ok) return { ok: false, error: rule.reason };

  const move = transition(row.status as SubStatus, "approved", { by, events: row.events });
  if (!move.ok) return { ok: false, error: move.error };

  const updated = db.update<StoredSubmission>(ENTITY.submissions, id, {
    status: "approved",
    note: undefined,
    events: move.events,
  });

  logAct({ actor: by, role: "state-admin", action: "submission.approve", target: id, note: `${row.district} ${row.period} approved.` });
  notify({
    title: `${row.district} return approved`,
    body: `${row.resolved} of ${row.disputes} disputes resolved · released to federal.`,
    at: new Date().toISOString(),
    icon: "solar:check-circle-linear",
    tone: "brand",
    href: `/state/submissions/${id}`,
    unread: true,
  });

  return { ok: true, row: updated! };
}

export function returnSubmission(id: string, by: string, reason: string): ActionResult {
  const row = db.get<StoredSubmission>(ENTITY.submissions).find((r) => r.id === id);
  if (!row) return { ok: false, error: "That return no longer exists." };

  const rule = rules.canReturn(row, reason);
  if (!rule.ok) return { ok: false, error: rule.reason };

  const move = transition(row.status as SubStatus, "returned", { by, reason, events: row.events });
  if (!move.ok) return { ok: false, error: move.error };

  const updated = db.update<StoredSubmission>(ENTITY.submissions, id, {
    status: "returned",
    note: reason,
    events: move.events,
  });

  logAct({ actor: by, role: "reviewer", action: "submission.return", target: id, note: reason });
  notify({
    title: `${row.district} return sent back`,
    body: reason,
    at: new Date().toISOString(),
    icon: "solar:undo-left-round-linear",
    tone: "amber",
    href: `/district`,
    unread: true,
  });

  return { ok: true, row: updated! };
}

export function remindDistrict(id: string, district: string, by: string): void {
  logAct({ actor: by, role: "state-admin", action: "submission.remind", target: id, note: `Reminder sent to ${district}.` });
  notify({
    title: `Reminder sent — ${district}`,
    body: "The district focal point was asked to file the outstanding return.",
    at: new Date().toISOString(),
    icon: "solar:bell-linear",
    tone: "blue",
    href: "/state/submissions",
    unread: true,
  });
}
