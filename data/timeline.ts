/** Single source of truth for every date shown in the demo. Import from here — never type a date into a component. */
export const TIMELINE = {
  today: "2026-05-20T09:00",
  period: "2026-Q1",
  periodOpen: "2026-Q2",
  mediation: "2026-04-08",
  filledOffline: "2026-04-12T09:15",
  submitted: "2026-04-14T09:10",
  approved: "2026-04-14T15:40",
  alertOpened: "2026-04-15T09:40",
  alertDue: "2026-04-18",
  alertClosed: "2026-04-17T11:20",
} as const;

export type TimelineKey = keyof typeof TIMELINE;
