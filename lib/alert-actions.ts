"use client";

import { DUTY_OFFICER, type Alert, type Incident } from "@/data/alerts";
import type { Notification } from "@/data/notifications";
import type { RoleId } from "@/data/users";

import { logAct } from "./audit";
import { db } from "./db";
import { ENTITY } from "./entities";
import { nextId } from "./ids";
import { rules } from "./rules";

export type AlertResult = { ok: true; alert: Alert } | { ok: false; error: string };

function notify(n: Omit<Notification, "id">) {
  db.add<Notification>(ENTITY.notifications, { id: nextId("N", 2026, 3), ...n });
}

export function createAlert(
  input: { title: string; district: string; region: string; state: string; level: Alert["level"]; trigger: string; owner: string; due: string },
  by: string,
  role: RoleId,
): AlertResult {
  if (!input.title.trim()) return { ok: false, error: "An alert needs a title." };
  if (!input.owner.trim()) return { ok: false, error: "An alert cannot be saved without a named owner." };

  const now = new Date().toISOString();
  const alert: Alert = {
    id: nextId("EW", 2026, 4),
    title: input.title.trim(),
    district: input.district,
    region: input.region,
    state: input.state,
    level: input.level,
    status: "open",
    opened: now,
    due: input.due,
    trigger: input.trigger,
    owner: input.owner,
    actions: [{ at: now, by, text: "Alert raised." }],
  };
  db.add<Alert>(ENTITY.alerts, alert);
  logAct({ actor: by, role, action: "alert.create", target: alert.id, note: alert.title });
  notify({
    title: `Alert ${alert.id} opened`,
    body: `${alert.level} · ${alert.district} · owner ${alert.owner}`,
    at: now,
    icon: "solar:danger-triangle-linear",
    tone: alert.level === "critical" ? "red" : "amber",
    href: "/early-warning",
    unread: true,
  });
  return { ok: true, alert };
}

export function assignOwner(id: string, owner: string, by: string, role: RoleId): AlertResult {
  if (!owner.trim()) return { ok: false, error: "Choose a person. An alert without an owner is nobody's job." };
  const row = db.get<Alert>(ENTITY.alerts).find((a) => a.id === id);
  if (!row) return { ok: false, error: "That alert no longer exists." };
  const updated = db.update<Alert>(ENTITY.alerts, id, {
    owner,
    actions: [...row.actions, { at: new Date().toISOString(), by, text: `Owner set to ${owner}.` }],
  })!;
  logAct({ actor: by, role, action: "alert.assign", target: id, note: owner });
  return { ok: true, alert: updated };
}

export function recordAction(id: string, text: string, by: string, role: RoleId): AlertResult {
  if (!text.trim()) return { ok: false, error: "Write what was done." };
  const row = db.get<Alert>(ENTITY.alerts).find((a) => a.id === id);
  if (!row) return { ok: false, error: "That alert no longer exists." };
  const updated = db.update<Alert>(ENTITY.alerts, id, {
    status: row.status === "open" ? "responding" : row.status,
    actions: [...row.actions, { at: new Date().toISOString(), by, text: text.trim() }],
  })!;
  logAct({ actor: by, role, action: "alert.action", target: id, note: text.trim() });
  return { ok: true, alert: updated };
}

export function closeAlert(id: string, note: string, by: string, role: RoleId): AlertResult {
  const row = db.get<Alert>(ENTITY.alerts).find((a) => a.id === id);
  if (!row) return { ok: false, error: "That alert no longer exists." };
  const rule = rules.canCloseAlert(row.status, note);
  if (!rule.ok) return { ok: false, error: rule.reason };
  const now = new Date().toISOString();
  const updated = db.update<Alert>(ENTITY.alerts, id, {
    status: "closed",
    closed: now,
    actions: [...row.actions, { at: now, by, text: `Closed — ${note.trim()}` }],
  })!;
  logAct({ actor: by, role, action: "alert.close", target: id, note: note.trim() });
  return { ok: true, alert: updated };
}

export function escalateAlert(id: string, by: string, role: RoleId): AlertResult {
  const row = db.get<Alert>(ENTITY.alerts).find((a) => a.id === id);
  if (!row) return { ok: false, error: "That alert no longer exists." };
  if (row.level === "critical") return { ok: false, error: "This alert is already at the highest level." };
  if (row.status === "closed") return { ok: false, error: "A closed alert cannot be escalated. Open a new one." };
  const next: Alert["level"] = row.level === "watch" ? "warning" : "critical";
  const updated = db.update<Alert>(ENTITY.alerts, id, {
    level: next,
    actions: [...row.actions, { at: new Date().toISOString(), by, text: `Escalated to ${next}.` }],
  })!;
  logAct({ actor: by, role, action: "alert.escalate", target: id, note: `→ ${next}` });
  return { ok: true, alert: updated };
}

export function escalateIncident(inc: Incident, by: string, role: RoleId): AlertResult {
  return createAlert(
    {
      title: `${inc.type} escalation — ${inc.district}`,
      district: inc.district,
      region: inc.region,
      state: "south-west",
      level: "warning",
      trigger: `Raised from incident ${inc.id} (${inc.date}).`,
      owner: DUTY_OFFICER,
      due: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
    },
    by,
    role,
  );
}
