import { TIMELINE } from "./timeline";

export type Alert = {
  id: string;
  title: string;
  district: string;
  region: string;
  state: string;
  level: "watch" | "warning" | "critical";
  status: "open" | "responding" | "closed";
  opened: string;
  due: string;
  closed?: string;
  trigger: string;
  owner: string;
  actions: { at: string; by: string; text: string }[];
};

/**
 * Early-warning duty officers. An alert belongs to a person, never to a desk —
 * the picker on page 10 offers these alongside the registered platform users.
 */
export const EW_OFFICERS = [
  "Cabdi Nuur",
  "Khadiijo Warsame",
  "Maxamed Siyaad",
  "Ayaan Cabdulle",
  "Saynab Guuleed",
] as const;

/** Who takes a new alert when the system raises one from an incident or a pattern. */
export const DUTY_OFFICER = EW_OFFICERS[0];

export const ALERTS: Alert[] = [
  {
    id: "EW-2026-0087",
    title: "Grazing corridor tension — risk of retaliation",
    district: "Berdale",
    region: "bay",
    state: "south-west",
    level: "warning",
    status: "closed",
    opened: TIMELINE.alertOpened,
    due: TIMELINE.alertDue,
    closed: TIMELINE.alertClosed,
    trigger: "Tension level 4 with armed actors reported in the approved Berdale return (SUB-SW-015).",
    owner: "Cabdi Nuur",
    actions: [
      { at: TIMELINE.alertOpened, by: "System", text: "Alert raised automatically from approved district return." },
      { at: "2026-04-15T14:05", by: "Cabdi Nuur", text: "State mediator dispatched; elders contacted by phone." },
      { at: "2026-04-16T10:30", by: "District Commissioner", text: "Joint meeting held; both sides agreed to a 30-day truce." },
      { at: TIMELINE.alertClosed, by: "Cabdi Nuur", text: "Closed — truce holding, diya process referred to CL-02 mediation." },
    ],
  },
  { id: "EW-2026-0091", title: "Water-point dispute escalation", district: "Beledweyne", region: "hiiraan", state: "hirshabelle", level: "watch", status: "responding", opened: "2026-05-02T08:10", due: "2026-05-09", trigger: "Three consecutive water-point incidents in 14 days.", owner: "Khadiijo Warsame", actions: [{ at: "2026-05-02T08:10", by: "System", text: "Alert raised from incident threshold." }] },
  { id: "EW-2026-0094", title: "Land eviction protest, Afgoye corridor", district: "Afgoye", region: "lower-shabelle", state: "south-west", level: "critical", status: "open", opened: "2026-05-18T16:40", due: "2026-05-21", trigger: "Eviction notice affecting 1,200 households; protest planned.", owner: "Maxamed Siyaad", actions: [{ at: "2026-05-18T16:40", by: "System", text: "Alert raised from partner report." }] },
  { id: "EW-2026-0096", title: "Revenge-killing risk after the Galkayo south clash", district: "Galkayo", region: "mudug", state: "galmudug", level: "warning", status: "open", opened: "2026-05-19T09:25", due: "2026-05-22", trigger: "Two fatalities in INC-0425; diya talks not yet convened by the elders' committee.", owner: "Ayaan Cabdulle", actions: [] },
];

export type Incident = {
  id: string; date: string; district: string; region: string; type: string; fatalities: number; displaced: number;
  status: "mediated" | "ongoing" | "resolved"; lng: number; lat: number;
  /** What set the incident off, as recorded on the report form. */
  cause?: string;
  /** Evidence item ids filed with the report. */
  evidence?: string[];
};

/** The causes the incident report form offers. */
export const INCIDENT_CAUSES = [
  "Competition over grazing or water",
  "Land or property dispute",
  "Failed or unpaid diya settlement",
  "Eviction or displacement pressure",
  "Political or administrative dispute",
  "Criminality or extortion",
  "Other",
] as const;

export const INCIDENTS: Incident[] = [
  { id: "INC-0412", date: "2026-04-02", district: "Berdale", region: "bay", type: "Grazing land", fatalities: 1, displaced: 40, status: "mediated", lng: 43.53, lat: 3.21, cause: "Competition over grazing or water", evidence: ["EV-2026-0311"] },
  { id: "INC-0418", date: "2026-04-06", district: "Beledweyne", region: "hiiraan", type: "Water point", fatalities: 0, displaced: 0, status: "ongoing", lng: 45.2, lat: 4.74, cause: "Competition over grazing or water", evidence: [] },
  { id: "INC-0421", date: "2026-04-09", district: "Afgoye", region: "lower-shabelle", type: "Eviction", fatalities: 0, displaced: 3, status: "ongoing", lng: 45.12, lat: 2.14, cause: "Eviction or displacement pressure", evidence: [] },
  { id: "INC-0425", date: "2026-04-11", district: "Galkayo", region: "mudug", type: "Clan clash", fatalities: 2, displaced: 120, status: "mediated", lng: 47.43, lat: 6.77, cause: "Failed or unpaid diya settlement", evidence: ["EV-2026-0313"] },
  { id: "INC-0430", date: "2026-04-15", district: "Jowhar", region: "middle-shabelle", type: "Farmland", fatalities: 0, displaced: 15, status: "resolved", lng: 45.5, lat: 2.78, cause: "Land or property dispute", evidence: [] },
  { id: "INC-0433", date: "2026-04-19", district: "Luuq", region: "gedo", type: "Revenge killing", fatalities: 1, displaced: 0, status: "ongoing", lng: 42.54, lat: 3.8, cause: "Failed or unpaid diya settlement", evidence: [] },
  { id: "INC-0437", date: "2026-04-24", district: "Baidoa", region: "bay", type: "Land / IDP", fatalities: 0, displaced: 60, status: "mediated", lng: 43.65, lat: 3.11, cause: "Land or property dispute", evidence: ["EV-2026-0315"] },
  { id: "INC-0441", date: "2026-04-28", district: "Dhusamareb", region: "galgaduud", type: "Grazing land", fatalities: 0, displaced: 0, status: "resolved", lng: 46.39, lat: 5.53, cause: "Competition over grazing or water", evidence: [] },
  { id: "INC-0446", date: "2026-05-03", district: "Hudur", region: "bakool", type: "Checkpoint", fatalities: 1, displaced: 0, status: "ongoing", lng: 43.89, lat: 4.12, cause: "Criminality or extortion", evidence: [] },
  { id: "INC-0450", date: "2026-05-09", district: "Kismayo", region: "lower-juba", type: "Land", fatalities: 0, displaced: 25, status: "mediated", lng: 42.55, lat: -0.36, cause: "Land or property dispute", evidence: [] },
  { id: "INC-0455", date: "2026-05-14", district: "Merca", region: "lower-shabelle", type: "Farmland", fatalities: 3, displaced: 210, status: "ongoing", lng: 44.77, lat: 1.71, cause: "Land or property dispute", evidence: ["EV-2026-0288"] },
  { id: "INC-0459", date: "2026-05-17", district: "Garowe", region: "nugaal", type: "Water point", fatalities: 0, displaced: 0, status: "resolved", lng: 48.49, lat: 8.4, cause: "Competition over grazing or water", evidence: [] },
];

export const incidentById = (id: string) => INCIDENTS.find((i) => i.id === id);
export const alertById = (id: string) => ALERTS.find((a) => a.id === id);
