"use client";

import type { Submission } from "@/data/submissions";
import type { User } from "@/data/users";

/** Business rules that refuse an action, each with a reason a person can read. */
export type Rule = { ok: true } | { ok: false; reason: string };

const OK: Rule = { ok: true };

export const rules = {
  /** A finalised return is closed to editing. */
  canEditSubmission(sub: Submission): Rule {
    if (sub.status === "approved")
      return { ok: false, reason: "This return was approved on the state portal and can no longer be edited." };
    return OK;
  },

  canApprove(sub: Submission): Rule {
    if (sub.status === "approved") return { ok: false, reason: "This return has already been approved." };
    if (sub.status !== "pending")
      return { ok: false, reason: `Only returns awaiting review can be approved. This one is "${sub.status}".` };
    if (sub.resolved > sub.disputes)
      return { ok: false, reason: "Resolved disputes exceed total disputes. Send it back for correction first." };
    return OK;
  },

  canReturn(sub: Submission, reason: string): Rule {
    if (sub.status !== "pending")
      return { ok: false, reason: "Only a return that is awaiting review can be sent back." };
    if (!reason.trim()) return { ok: false, reason: "Write what needs correcting before sending it back." };
    return OK;
  },

  /** No two returns from the same district in the same period. */
  noDuplicateReturn(rows: Submission[], district: string, period: string): Rule {
    const clash = rows.find((r) => r.district === district && r.period === period && r.status !== "missing");
    if (clash) return { ok: false, reason: `${district} has already filed a return for ${period}.` };
    return OK;
  },

  canDeleteUser(users: User[], target: User, actorId: string): Rule {
    if (target.id === actorId) return { ok: false, reason: "You cannot remove your own account." };
    const admins = users.filter((u) => u.active && (u.role === "super-admin" || u.role === "mel-admin"));
    if (admins.length <= 1 && admins[0]?.id === target.id)
      return { ok: false, reason: "This is the last active administrator. Appoint another one first." };
    return OK;
  },

  canCloseAlert(status: string, note: string): Rule {
    if (status === "closed") return { ok: false, reason: "This alert is already closed." };
    if (!note.trim()) return { ok: false, reason: "Record what action was taken before closing the alert." };
    return OK;
  },

  /** Restricted pages never export. */
  canExport(pageIsRestricted: boolean): Rule {
    if (pageIsRestricted) return { ok: false, reason: "Exports are not permitted from a restricted page." };
    return OK;
  },
};
