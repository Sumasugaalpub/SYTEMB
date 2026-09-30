"use client";

/**
 * The core object is a state machine. Illegal transitions are refused with a
 * reason the user can read, and every legal one appends a timeline event.
 */

export type SubStatus = "draft" | "pending" | "returned" | "approved" | "missing";

export const FLOW: Record<SubStatus, SubStatus[]> = {
  missing: ["draft"],
  draft: ["pending"],
  pending: ["approved", "returned"],
  returned: ["pending"],
  approved: [],
};

export const STATUS_LABEL: Record<SubStatus, string> = {
  missing: "Not started",
  draft: "Draft",
  pending: "Awaiting review",
  returned: "Returned for correction",
  approved: "Approved",
};

/** Transitions that cannot be saved without a written reason. */
export const REASON_REQUIRED: SubStatus[] = ["returned"];

export type TimelineEvent = { to: SubStatus; at: string; by: string; reason?: string };

export type FlowResult =
  | { ok: true; status: SubStatus; events: TimelineEvent[] }
  | { ok: false; error: string };

export function transition(
  current: SubStatus,
  to: SubStatus,
  opts: { by: string; reason?: string; events?: TimelineEvent[] },
): FlowResult {
  if (!FLOW[current]?.includes(to)) {
    return {
      ok: false,
      error: `Cannot move from "${STATUS_LABEL[current]}" to "${STATUS_LABEL[to]}".`,
    };
  }
  if (REASON_REQUIRED.includes(to) && !opts.reason?.trim()) {
    return { ok: false, error: "A written reason is required before this can be sent back." };
  }
  const events: TimelineEvent[] = [
    ...(opts.events ?? []),
    { to, at: new Date().toISOString(), by: opts.by, ...(opts.reason ? { reason: opts.reason } : {}) },
  ];
  return { ok: true, status: to, events };
}
