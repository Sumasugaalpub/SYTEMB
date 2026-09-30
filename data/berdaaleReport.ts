import { TIMELINE } from "./timeline";

/** THE demo report — Berdale district, Bay region, South West. Every step of the phone app fills this shape. */
export const BERDAALE_REPORT = {
  submissionId: "SUB-SW-015",
  receipt: "RR-SW-BAY-BER-2026Q1-0015",
  district: "Berdale",
  region: "bay",
  state: "south-west",
  period: TIMELINE.period,
  focalPoint: { name: "Bashiir Muuse", phone: "+252 61 555 0142", role: "District Peace Focal Point" },
  filledOffline: TIMELINE.filledOffline,
  submitted: TIMELINE.submitted,
  approved: TIMELINE.approved,
  committee: { active: true, members: 13, women: 4, youth: 3, meetings: 5, lastMeeting: "2026-03-28" },
  disputes: [
    { type: "Grazing land", count: 3, resolved: 2 },
    { type: "Water point", count: 2, resolved: 2 },
    { type: "Inheritance / land", count: 1, resolved: 1 },
    { type: "Revenge killing (diya)", count: 1, resolved: 0 },
  ],
  council: { convened: true, sessions: 3, attendance: 82, securityForces: true },
  tension: { level: 4 as 1 | 2 | 3 | 4 | 5, trend: "rising" as const, hotspot: "Goof-Gaduud grazing corridor", clans: "Two sub-clans (names withheld)", armed: true },
  evidence: [
    { id: "EV-2026-0311", type: "Photo", title: "Mediation session under the acacia, Berdale", visibility: "aggregated" },
    { id: "EV-2026-0312", type: "Minutes", title: "Committee minutes 28 March", visibility: "authorized" },
    { id: "EV-2026-0313", type: "Audio", title: "Elders' statement (Maay)", visibility: "restricted" },
    { id: "EV-2026-0314", type: "Agreement", title: "Signed grazing-sharing agreement", visibility: "authorized" },
    { id: "EV-2026-0315", type: "Photo", title: "Water point after repair", visibility: "public" },
    { id: "EV-2026-0316", type: "Attendance", title: "Attendance sheet", visibility: "restricted" },
  ],
  narrative: {
    whatHappened: "Two sub-clans clashed over access to the Goof-Gaduud grazing corridor after the Gu' rains failed. One herder was killed on 2 April.",
    whoActed: "The district peace committee and four elders from each side met on 8 April with the district commissioner present.",
    whatChanged: "A grazing-sharing agreement was signed; the water point was repaired. The diya case is still open.",
    whatIsNeeded: "Mediation support for the diya settlement and a second water point before the Xagaa dry season.",
  },
  mediation: TIMELINE.mediation,
} as const;
