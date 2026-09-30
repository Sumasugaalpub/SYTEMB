import type { Visibility } from "@/lib/visibility";

/** Intervention type — the delivery modality recorded on the project charter. */
export const PROJECT_TYPES = [
  "Reconciliation",
  "Justice",
  "Durable solutions",
  "Community security",
  "Heritage",
  "Capacity building",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Registry field 10 — who the intervention is for. */
export const BENEFICIARY_GROUPS = ["Women", "Youth", "Elders", "Displaced"] as const;
export type BeneficiaryGroup = (typeof BENEFICIARY_GROUPS)[number];

export type Project = {
  id: string; title: string; resultArea: string; type: ProjectType; region: string; visibility: Visibility;
  evidence: string[]; lead: string; partner: string; donor: string;
  states: string[]; districts: string[]; start: string; end: string; budget: number; spent: number;
  status: "on-track" | "at-risk" | "delayed" | "complete"; progress: number; beneficiaries: number;
  beneficiaryGroups: BeneficiaryGroup[];
  kpis: string[]; description: string; risks: string; lastUpdate: string;
};

/** PRJ-0142 is the flagship record with all 18 fields populated. */
export const PROJECTS: Project[] = [
  { id: "PRJ-0142", title: "Bay & Bakool Local Reconciliation Initiative", resultArea: "cl-01", type: "Reconciliation", region: "bay", visibility: "authorized", evidence: ["EV-2026-0311", "EV-2026-0312", "EV-2026-0313", "EV-2026-0314", "EV-2026-0315", "EV-2026-0316"], lead: "MOIFAR", partner: "SW-MOI", donor: "Peacebuilding Fund", states: ["south-west"], districts: ["Berdale", "Baidoa", "Dinsor", "Hudur", "Wajid"], start: "2025-07-01", end: "2027-06-30", budget: 2400000, spent: 910000, status: "on-track", progress: 42, beneficiaries: 38000, beneficiaryGroups: ["Women", "Youth", "Elders", "Displaced"], kpis: ["KPI-001", "KPI-002", "KPI-004"], description: "Establishes and trains district peace committees, funds mediation logistics and follow-up on agreements in five districts.", risks: "Access on the Baidoa–Berdale road; drought-driven grazing disputes.", lastUpdate: "2026-05-12" },
  { id: "PRJ-0118", title: "Mobile Courts for Southern States", resultArea: "cl-05", type: "Justice", region: "gedo", visibility: "public", evidence: ["EV-2026-0301"], lead: "MOJCA", partner: "UNDP", donor: "EU", states: ["south-west", "jubaland"], districts: ["Bardera", "Luuq", "Hudur"], start: "2025-01-01", end: "2026-12-31", budget: 1800000, spent: 1210000, status: "at-risk", progress: 55, beneficiaries: 12000, beneficiaryGroups: ["Women", "Youth", "Displaced"], kpis: ["KPI-046", "KPI-047"], description: "Monthly circuit court sittings with legal aid desks.", risks: "Security escorts unavailable in Gedo.", lastUpdate: "2026-05-02" },
  { id: "PRJ-0155", title: "Afgoye Corridor Durable Solutions", resultArea: "cl-04", type: "Durable solutions", region: "lower-shabelle", visibility: "restricted", evidence: [], lead: "OPM", partner: "SW-MOI", donor: "World Bank", states: ["south-west"], districts: ["Afgoye", "Merca"], start: "2025-10-01", end: "2028-09-30", budget: 5200000, spent: 640000, status: "delayed", progress: 12, beneficiaries: 60000, beneficiaryGroups: ["Displaced", "Women", "Youth"], kpis: ["KPI-042", "KPI-043"], description: "Tenure-secure relocation and services for IDP households.", risks: "Land ownership contested; eviction pressure.", lastUpdate: "2026-05-18" },
  { id: "PRJ-0161", title: "Voices of Peace — Oral History Programme", resultArea: "cl-01", type: "Heritage", region: "banadir", visibility: "public", evidence: ["EV-2026-0295", "EV-2026-0305"], lead: "MOCHE", partner: "Somalia Peace Museum", donor: "UNESCO", states: ["banadir", "south-west", "puntland", "galmudug"], districts: ["Hodan", "Baidoa", "Garowe", "Dhusamareb"], start: "2026-01-01", end: "2027-12-31", budget: 650000, spent: 180000, status: "on-track", progress: 30, beneficiaries: 5000, beneficiaryGroups: ["Elders", "Women", "Youth"], kpis: ["KPI-011", "KPI-013"], description: "Records survivor and elder testimonies for the museum archive and travelling exhibition.", risks: "Consent management for sensitive testimonies.", lastUpdate: "2026-05-15" },
  { id: "PRJ-0170", title: "Women in Mediation Fellowship", resultArea: "cl-07", type: "Capacity building", region: "middle-shabelle", visibility: "aggregated", evidence: ["EV-2026-0288"], lead: "MOWHRD", partner: "UNDP", donor: "Sweden", states: ["hirshabelle", "galmudug"], districts: ["Jowhar", "Beledweyne", "Galkayo"], start: "2026-02-01", end: "2027-01-31", budget: 420000, spent: 95000, status: "on-track", progress: 25, beneficiaries: 240, beneficiaryGroups: ["Women", "Youth"], kpis: ["KPI-062", "KPI-066"], description: "Trains and deploys women mediators into district committees.", risks: "Committee acceptance in some districts.", lastUpdate: "2026-04-30" },
  { id: "PRJ-0133", title: "Community Policing Forums", resultArea: "cl-05", type: "Community security", region: "middle-shabelle", visibility: "public", evidence: ["EV-2026-0288"], lead: "MOIS", partner: "HS-MOI", donor: "UK", states: ["hirshabelle"], districts: ["Jowhar", "Balcad", "Bulo Burte"], start: "2024-09-01", end: "2026-08-31", budget: 980000, spent: 870000, status: "complete", progress: 96, beneficiaries: 21000, beneficiaryGroups: ["Youth", "Elders", "Women"], kpis: ["KPI-053"], description: "Police–community forums with complaint desks.", risks: "Handover to state budget.", lastUpdate: "2026-05-01" },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
export const evidenceCount = (p: Project) => p.evidence.length;
export const beneficiaryGroupsOf = (p: Project) => (p.beneficiaryGroups ?? []).join(" · ") || "—";
