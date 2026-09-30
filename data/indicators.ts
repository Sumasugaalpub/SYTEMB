import type { Visibility } from "@/lib/visibility";

export type Quality = "verified" | "provisional" | "estimated";
export type Indicator = {
  id: string;
  resultArea: string;
  name: string;
  unit: "%" | "count" | "days" | "index";
  baseline: number;
  target: number;
  value: number | null;
  reported: number;
  frequency: "Quarterly" | "Annual" | "Monthly";
  source: string;
  owner: string;
  visibility: Visibility;
  quality: Quality;
  peopleCount: boolean;
  method: string;
};

type Seed = [name: string, unit: Indicator["unit"], baseline: number, target: number, value: number | null, peopleCount?: boolean];

const SEEDS: Record<string, Seed[]> = {
  "cl-01": [
    ["Districts with active peace committee", "count", 34, 90, 58],
    ["Mediations concluded with agreement", "%", 48, 75, 63],
    ["Clan disputes referred to committees", "count", 120, 400, 236],
    ["Agreements holding after 90 days", "%", 55, 85, 71],
    ["Trained mediators", "count", 210, 900, 540, true],
    ["Committee meetings with minutes", "%", 30, 90, 66],
    ["Average mediation duration", "days", 45, 20, 29],
    ["Returnee disputes mediated", "count", 12, 80, 31],
    ["Social cohesion index", "index", 41, 60, 46],
    ["Inter-clan cultural events", "count", 5, 60, 18],
    ["Oral-history testimonies recorded", "count", 150, 3000, 412, true],
    ["Memorialisation sites agreed", "count", 0, 12, 3],
    ["Museum visitors", "count", 2000, 50000, 7600, true],
    ["Heritage sites documented", "count", 12, 120, 34],
    ["Travelling exhibitions held", "count", 1, 20, 4],
  ],
  "cl-02": [
    ["Land disputes registered", "count", 300, 900, 512],
    ["Land disputes resolved", "%", 22, 60, 31],
    ["Water-point conflicts", "count", 64, 20, 71],
    ["Grazing agreements signed", "count", 9, 50, 17],
    ["Charcoal-trade related clashes", "count", 22, 5, 18],
    ["Disputes escalating to violence", "%", 17, 5, 14],
    ["Communities with resource-sharing plan", "count", 6, 60, 19],
    ["Eviction notices mediated", "count", 50, 400, 120],
    ["Early warning alerts answered within 72 hours", "%", 35, 80, 52],
    ["Districts with early warning focal point", "count", 20, 90, 44],
    ["Security incidents reported", "count", 310, 150, 262],
    ["Inter-state boundary disputes mediated", "count", 3, 20, 7],
  ],
  "cl-03": [
    ["Federal–state dialogue forums held", "count", 2, 8, 5],
    ["Constitutional chapters finalised", "count", 3, 15, 7],
    ["Intergovernmental agreements signed", "count", 1, 6, 3],
    ["Public trust in federal institutions", "%", 28, 45, 34],
    ["Electoral boundary disputes resolved", "count", 0, 10, 4],
    ["State parliaments with inclusive quorum", "%", 40, 80, 57],
    ["Citizens consulted in review process", "count", 1200, 20000, 8400, true],
    ["Days to resolve federal–state disputes", "days", 180, 60, 112],
    ["District councils formed", "count", 18, 90, 41],
    ["Public complaints resolved by institutions", "%", 20, 60, 29],
  ],
  "cl-04": [
    ["Recovered districts with projects", "count", 4, 30, 12],
    ["Markets reopened", "count", 3, 25, 9],
    ["Roads rehabilitated (km)", "count", 40, 600, 150],
    ["Projects delayed by access", "count", 9, 2, 4],
    ["IDPs with durable solution plan", "%", 8, 40, 14],
    ["Returnees with land tenure", "%", 11, 50, 16],
    ["Households relocated voluntarily", "count", 400, 6000, 1300],
    ["Forced evictions", "count", 12000, 2000, 9800, true],
  ],
  "cl-05": [
    ["Mobile court sittings", "count", 40, 160, 72],
    ["Case backlog (formal courts)", "count", 5400, 2000, 6100],
    ["Pre-trial detainees over 90 days", "%", 62, 25, 58],
    ["Legal aid beneficiaries", "count", 900, 6000, 2300, true],
    ["Courts with case-management system", "%", 10, 60, 22],
    ["Public satisfaction with courts", "%", 31, 50, 33],
    ["District security councils convened", "count", 22, 90, 40],
    ["Community policing forums", "count", 18, 70, 36],
    ["Perceived safety at night", "%", 38, 60, 44],
  ],
  "cl-06": [
    ["Cash-for-work days created", "count", 40000, 400000, 128000],
    ["Youth employed via peace projects", "count", 600, 8000, 2100, true],
    ["Household income change", "%", 0, 20, 6],
    ["Local contractors engaged", "count", 25, 250, 88],
    ["Access to basic services in IDP sites", "%", 35, 70, 41],
    ["Schools using peace curriculum", "count", 30, 600, 115],
    ["Water points rehabilitated", "count", 10, 120, 38],
  ],
  "cl-07": [
    ["Women on peace committees", "%", 24, 40, 31],
    ["Youth in local councils", "%", 12, 30, 19],
    ["GBV cases referred to services", "count", 420, 1500, 780, true],
    ["Minority-clan representation", "%", 9, 20, 13],
    ["Women-led mediations", "count", 8, 90, 27],
    ["Disability-inclusive facilities", "%", 6, 40, 11],
  ],
  "cl-08": [
    ["Civil-society organisations registered", "count", 40, 300, 118],
    ["CSO-led dialogue sessions held", "count", 25, 200, 74],
    ["Youth reporting civic participation", "%", 21, 45, 29],
    ["Community feedback sessions on projects", "count", 12, 150, 46],
    ["Peace programmes aired on local media", "count", 30, 400, 140],
  ],
  "cl-09": [
    ["Institutions reporting on time", "%", 20, 90, 38],
  ],
};

const VIS: Visibility[] = ["public", "aggregated", "authorized", "public", "aggregated", "public", "authorized", "public", "restricted"];
const QUAL: Quality[] = ["verified", "verified", "provisional", "verified", "estimated", "provisional"];
const FREQ: Indicator["frequency"][] = ["Quarterly", "Quarterly", "Annual", "Monthly"];
const OWNER: Record<string, string> = { "cl-01": "MOIFAR", "cl-02": "MOIFAR", "cl-03": "MOIFAR", "cl-04": "OPM", "cl-05": "MOJCA", "cl-06": "MOPIED", "cl-07": "MOWHRD", "cl-08": "MOIFAR", "cl-09": "MOIFAR" };
const SOURCE = ["District Returns", "State Ministry Report", "Household Survey", "Court Registry", "Partner Report", "Museum Registry"];

let n = 0;
/** All 73 national KPIs. */
export const INDICATORS: Indicator[] = Object.entries(SEEDS).flatMap(([ra, seeds]) =>
  seeds.map(([name, unit, baseline, target, value, peopleCount = false], i) => {
    n += 1;
    return {
      id: `KPI-${String(n).padStart(3, "0")}`,
      resultArea: ra,
      name,
      unit,
      baseline,
      target,
      value,
      reported: 30 + ((n * 7) % 55),
      frequency: FREQ[n % FREQ.length],
      source: ra === "cl-01" && i >= 10 ? "Museum Registry" : SOURCE[n % 5],
      owner: OWNER[ra],
      visibility: VIS[n % VIS.length],
      quality: QUAL[n % QUAL.length],
      peopleCount,
      method: `Numerator: ${name.toLowerCase()} recorded in the period. ${unit === "%" ? "Denominator: all eligible units reporting in the period. " : ""}Collected ${FREQ[n % FREQ.length].toLowerCase()} from district returns, validated by the state focal point, published after federal quality review.`,
    };
  }),
);

export const indicatorById = (id: string) => INDICATORS.find((k) => k.id === id);
export const indicatorsOf = (ra: string) => INDICATORS.filter((k) => k.resultArea === ra);

/** Progress from baseline to target, 0–100, direction-aware. */
export function progress(k: Pick<Indicator, "baseline" | "target" | "value">): number | null {
  if (k.value === null) return null;
  const span = k.target - k.baseline;
  if (span === 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((k.value - k.baseline) / span) * 100)));
}
