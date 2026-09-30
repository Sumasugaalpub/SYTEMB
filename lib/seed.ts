"use client";

import { ALERTS, INCIDENTS } from "@/data/alerts";
import { EVIDENCE } from "@/data/evidence";
import { NOTIFICATIONS } from "@/data/notifications";
import { PROJECTS } from "@/data/projects";
import { SUBMISSIONS } from "@/data/submissions";
import { USERS } from "@/data/users";
import { TIMELINE } from "@/data/timeline";

import { db } from "./db";
import { ENTITY } from "./entities";
import { primeSeq } from "./ids";
import type { AuditEntry } from "./audit";
import type { SubStatus, TimelineEvent } from "./flow";

export const SEED_VERSION = 1;

/** A stored submission carries its own timeline; the static seed does not. */
export type StoredSubmission = (typeof SUBMISSIONS)[number] & { events: TimelineEvent[] };

function withEvents(): StoredSubmission[] {
  return SUBMISSIONS.map((s) => {
    const events: TimelineEvent[] = [];
    if (s.submittedAt) events.push({ to: "pending" as SubStatus, at: s.submittedAt, by: s.focalPoint });
    if (s.status === "approved" && s.submittedAt)
      events.push({ to: "approved" as SubStatus, at: TIMELINE.approved, by: "Sahra Aadan" });
    if (s.status === "returned" && s.submittedAt)
      events.push({ to: "returned" as SubStatus, at: TIMELINE.approved, by: "Ibraahim Xasan", reason: s.note });
    return { ...s, events };
  });
}

const SEED_ACTIVITY: AuditEntry[] = [
  { id: "LOG-2026-00005", actor: "Sahra Aadan", role: "state-admin", action: "sharing.update", target: "hirshabelle", note: "District names withheld from federal users.", ts: "2026-05-17T13:20:00.000Z", ip: "196.201.216.12" },
  { id: "LOG-2026-00004", actor: "Sahra Aadan", role: "state-admin", action: "submission.approve", target: "SUB-SW-015", note: "Berdale Q1 return approved.", ts: "2026-04-14T15:40:00.000Z", ip: "196.201.216.12" },
  { id: "LOG-2026-00003", actor: "Ibraahim Xasan", role: "reviewer", action: "submission.return", target: "SUB-SW-005", note: "Dispute count does not match committee minutes.", ts: "2026-04-13T10:05:00.000Z", ip: "196.201.216.48" },
  { id: "LOG-2026-00002", actor: "Bashiir Muuse", role: "district-admin", action: "submission.submit", target: "SUB-SW-015", note: "Filed from the field app after 2 days offline.", ts: "2026-04-14T09:10:00.000Z", ip: "154.16.72.9" },
  { id: "LOG-2026-00001", actor: "Yuusuf Cali", role: "approver", action: "alert.close", target: "EW-2026-0087", note: "Truce holding; referred to CL-02 mediation.", ts: "2026-04-17T11:20:00.000Z", ip: "41.78.64.21" },
];

/** Writes seed rows once. Safe to call on every boot. */
export function seedAll(): void {
  db.seed(ENTITY.submissions, withEvents());
  db.seed(ENTITY.alerts, ALERTS);
  db.seed(ENTITY.incidents, INCIDENTS);
  db.seed(ENTITY.evidence, EVIDENCE);
  db.seed(ENTITY.projects, PROJECTS);
  db.seed(ENTITY.users, USERS);
  db.seed(ENTITY.notifications, NOTIFICATIONS);
  db.seed(ENTITY.activity, SEED_ACTIVITY);
  db.seed(ENTITY.drafts, []);
  db.seed(ENTITY.reportItems, []);
  db.seed(ENTITY.supportMessages, []);
  db.seed(ENTITY.problemReports, []);

  primeSeq("LOG", 5);
  primeSeq("SUB", SUBMISSIONS.length);
  primeSeq("EW", 94);
  primeSeq("EV", 316);
  primeSeq("PRJ", 170);
  primeSeq("USR", USERS.length);
  primeSeq("ITM", 0);
  primeSeq("SUP", 0);
  primeSeq("PRB", 0);

  db.setOne("seed_version", SEED_VERSION);
}

/** Wipe every namespaced key and lay the seed down again. */
export function resetDemo(): void {
  db.resetAll();
  seedAll();
}
