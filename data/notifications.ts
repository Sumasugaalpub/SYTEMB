export type Notification = { id: string; title: string; body: string; at: string; icon: string; tone: "brand" | "amber" | "red" | "blue"; href: string; unread: boolean };

/**
 * Eight items, in the mix the desk actually works through:
 * three reports awaiting approval, two alerts needing action, three late districts.
 * Every click target is a page that exists in the platform.
 */
export const NOTIFICATIONS: Notification[] = [
  // Three reports awaiting approval.
  { id: "N-1", title: "Berdale return awaits approval", body: "SUB-SW-015 · Bay · filed 18 May, sitting with the state reviewer.", at: "2026-05-18T09:10", icon: "solar:inbox-linear", tone: "amber", href: "/state/submissions", unread: true },
  { id: "N-2", title: "Jowhar return awaits approval", body: "Middle Shabelle · tension level 3 recorded; evidence attached.", at: "2026-05-17T15:25", icon: "solar:inbox-linear", tone: "amber", href: "/state/submissions", unread: true },
  { id: "N-3", title: "Q1 executive report awaits sign-off", body: "Built from approved returns; needs the Minister's approval before release.", at: "2026-05-16T08:40", icon: "solar:document-text-linear", tone: "brand", href: "/reports", unread: true },

  // Two alerts needing action.
  { id: "N-4", title: "EW-2026-0094 needs action", body: "Critical — Afgoye corridor eviction protest. Response due 21 May.", at: "2026-05-18T16:40", icon: "solar:danger-triangle-linear", tone: "red", href: "/early-warning", unread: true },
  { id: "N-5", title: "EW-2026-0096 needs action", body: "Warning — revenge-killing risk after the Galkayo clash. No action logged yet.", at: "2026-05-19T09:25", icon: "solar:bell-bing-linear", tone: "red", href: "/early-warning", unread: true },

  // Three late districts.
  { id: "N-6", title: "Qansahdhere is late", body: "Bay · 2026-Q2 return not filed; deadline passed on 15 May.", at: "2026-05-16T07:00", icon: "solar:clock-circle-linear", tone: "amber", href: "/state/submissions", unread: false },
  { id: "N-7", title: "Kurtunwarey is late", body: "Lower Shabelle · 2026-Q2 return not filed; no contact since April.", at: "2026-05-16T07:00", icon: "solar:clock-circle-linear", tone: "amber", href: "/state/submissions", unread: false },
  { id: "N-8", title: "Rabdhure is late", body: "Bakool · 2026-Q2 return not filed; access reported as the reason.", at: "2026-05-16T07:00", icon: "solar:clock-circle-linear", tone: "amber", href: "/state/submissions", unread: false },
];
