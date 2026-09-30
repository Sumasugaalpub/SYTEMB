"use client";

import { db } from "./db";
import { nextId } from "./ids";
import type { RoleId } from "@/data/users";

export type AuditEntry = {
  id: string;
  actor: string;
  role: RoleId | string;
  action: string;
  target: string;
  note: string;
  ts: string;
  ip: string;
};

const DEMO_IPS = ["196.201.216.12", "196.201.216.48", "154.16.72.9", "41.78.64.21", "102.68.12.7"];

export function logAct(params: {
  actor: string;
  role: RoleId | string;
  action: string;
  target: string;
  note?: string;
}): AuditEntry {
  const entry: AuditEntry = {
    id: nextId("LOG", 2026, 5),
    actor: params.actor,
    role: params.role,
    action: params.action,
    target: params.target,
    note: params.note ?? "",
    ts: new Date().toISOString(),
    ip: DEMO_IPS[Math.floor(Math.random() * DEMO_IPS.length)],
  };
  db.add<AuditEntry>("activity", entry);
  return entry;
}

export const auditLog = () => db.get<AuditEntry>("activity");
