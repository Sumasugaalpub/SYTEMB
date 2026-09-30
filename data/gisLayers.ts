export type GisLayer = { id: string; name: string; icon: string; description: string; defaultOn: boolean; restricted: boolean };

/** The eight map layers, in spec order. */
export const GIS_LAYERS: GisLayer[] = [
  { id: "peace", name: "Peace Ecosystem", icon: "solar:hand-shake-linear", description: "Committees, mediators and signed agreements", defaultOn: true, restricted: false },
  { id: "risk", name: "Conflict Risk", icon: "solar:danger-triangle-linear", description: "Risk index and recorded incidents", defaultOn: true, restricted: false },
  { id: "warning", name: "Early Warning", icon: "solar:bell-bing-linear", description: "Open and responding alerts", defaultOn: false, restricted: true },
  { id: "people", name: "People", icon: "solar:users-group-rounded-linear", description: "Population, displaced and returnees", defaultOn: false, restricted: false },
  { id: "performance", name: "Performance", icon: "solar:chart-square-linear", description: "On-time district reporting rate", defaultOn: false, restricted: false },
  { id: "projects", name: "Projects", icon: "solar:case-round-linear", description: "Intervention footprints by region", defaultOn: false, restricted: false },
  { id: "basemap", name: "Base Maps", icon: "solar:map-linear", description: "Region boundaries and names", defaultOn: true, restricted: false },
  { id: "satellite", name: "Satellite", icon: "solar:planet-linear", description: "Imagery backdrop under the boundaries", defaultOn: false, restricted: false },
];

export const gisLayerById = (id: string) => GIS_LAYERS.find((l) => l.id === id);

/** Region label / marker anchor, degrees [lng, lat]. */
export const REGION_CENTROID: Record<string, [number, number]> = {
  awdal: [43.47, 10.6],
  "woqooyi-galbeed": [44.66, 9.82],
  togdheer: [45.89, 9.09],
  sool: [47.56, 9.02],
  sanaag: [47.53, 10.37],
  bari: [50.17, 10.16],
  nugaal: [48.87, 8.27],
  mudug: [48.08, 6.02],
  galgaduud: [46.62, 5.0],
  hiiraan: [45.5, 4.37],
  "middle-shabelle": [46.05, 3.02],
  banadir: [45.44, 2.09],
  bay: [43.55, 2.69],
  bakool: [43.84, 4.1],
  "lower-shabelle": [44.19, 1.97],
  gedo: [42.06, 2.77],
  "middle-juba": [42.47, 1.13],
  "lower-juba": [42.09, -0.17],
};

/** Peace Ecosystem — active district peace committees, accredited mediators, agreements signed this year. */
export type PeaceNode = { committees: number; mediators: number; agreements: number };
export const PEACE_ECOSYSTEM: Record<string, PeaceNode> = {
  awdal: { committees: 3, mediators: 14, agreements: 2 },
  "woqooyi-galbeed": { committees: 3, mediators: 21, agreements: 4 },
  togdheer: { committees: 2, mediators: 11, agreements: 1 },
  sool: { committees: 1, mediators: 5, agreements: 0 },
  sanaag: { committees: 2, mediators: 7, agreements: 1 },
  bari: { committees: 5, mediators: 26, agreements: 5 },
  nugaal: { committees: 3, mediators: 18, agreements: 3 },
  mudug: { committees: 4, mediators: 16, agreements: 2 },
  galgaduud: { committees: 4, mediators: 15, agreements: 3 },
  hiiraan: { committees: 3, mediators: 12, agreements: 2 },
  "middle-shabelle": { committees: 4, mediators: 19, agreements: 3 },
  banadir: { committees: 11, mediators: 48, agreements: 6 },
  bay: { committees: 5, mediators: 24, agreements: 5 },
  bakool: { committees: 3, mediators: 9, agreements: 1 },
  "lower-shabelle": { committees: 4, mediators: 17, agreements: 2 },
  gedo: { committees: 3, mediators: 10, agreements: 1 },
  "middle-juba": { committees: 1, mediators: 4, agreements: 0 },
  "lower-juba": { committees: 3, mediators: 13, agreements: 2 },
};

/** Conflict Risk — composite 0–100 risk index for the current period. Higher is worse. */
export const CONFLICT_RISK: Record<string, number> = {
  awdal: 24, "woqooyi-galbeed": 19, togdheer: 31, sool: 68, sanaag: 57,
  bari: 27, nugaal: 22, mudug: 54, galgaduud: 44,
  hiiraan: 61, "middle-shabelle": 46, banadir: 38,
  bay: 49, bakool: 63, "lower-shabelle": 66,
  gedo: 64, "middle-juba": 78, "lower-juba": 47,
};

/** Regions drawn with the risk overlay. */
export const RISK_OVERLAY_MIN = 55;

/** Early Warning (restricted) — open and responding alerts by region. */
export type WarningNode = { open: number; level: "watch" | "warning" | "critical"; trigger: string };
export const EARLY_WARNING: Record<string, WarningNode> = {
  hiiraan: { open: 2, level: "warning", trigger: "Water-point incidents above threshold" },
  bay: { open: 1, level: "watch", trigger: "Grazing corridor tension" },
  bakool: { open: 1, level: "warning", trigger: "Checkpoint extortion on the Hudur road" },
  gedo: { open: 2, level: "critical", trigger: "Revenge cycle after mediation failure" },
  "lower-shabelle": { open: 2, level: "critical", trigger: "Eviction notices in the Afgoye corridor" },
  "middle-juba": { open: 1, level: "warning", trigger: "No returns filed; access denied" },
  mudug: { open: 1, level: "watch", trigger: "Clan clash follow-up in Galkayo" },
  sool: { open: 1, level: "warning", trigger: "Administrative dispute in Las Anod" },
};

/** People — resident population, displaced and returnees (thousands of individuals). */
export type PeopleNode = { population: number; displaced: number; returnees: number };
export const PEOPLE: Record<string, PeopleNode> = {
  awdal: { population: 673, displaced: 21, returnees: 6 },
  "woqooyi-galbeed": { population: 1242, displaced: 58, returnees: 14 },
  togdheer: { population: 721, displaced: 33, returnees: 8 },
  sool: { population: 328, displaced: 49, returnees: 3 },
  sanaag: { population: 544, displaced: 27, returnees: 5 },
  bari: { population: 719, displaced: 62, returnees: 11 },
  nugaal: { population: 392, displaced: 41, returnees: 9 },
  mudug: { population: 717, displaced: 96, returnees: 12 },
  galgaduud: { population: 569, displaced: 74, returnees: 7 },
  hiiraan: { population: 520, displaced: 88, returnees: 6 },
  "middle-shabelle": { population: 516, displaced: 63, returnees: 10 },
  banadir: { population: 2388, displaced: 486, returnees: 34 },
  bay: { population: 792, displaced: 214, returnees: 18 },
  bakool: { population: 367, displaced: 71, returnees: 4 },
  "lower-shabelle": { population: 1202, displaced: 187, returnees: 16 },
  gedo: { population: 508, displaced: 92, returnees: 7 },
  "middle-juba": { population: 362, displaced: 44, returnees: 2 },
  "lower-juba": { population: 489, displaced: 118, returnees: 13 },
};

/** Performance — on-time district reporting rate for the current period, 0–100. */
export const PERFORMANCE: Record<string, number> = {
  awdal: 50, "woqooyi-galbeed": 67, togdheer: 50, sool: 25, sanaag: 25,
  bari: 83, nugaal: 100, mudug: 80, galgaduud: 80,
  hiiraan: 67, "middle-shabelle": 80, banadir: 87,
  bay: 100, bakool: 60, "lower-shabelle": 67,
  gedo: 50, "middle-juba": 0, "lower-juba": 75,
};

/** Base Maps — the boundary set the map is drawn from. */
export const BASE_MAP = {
  name: "Somalia administrative regions",
  source: "SNBS / OCHA CODs, 18 regions",
  updated: "2026-01-31",
};

/** Satellite — the imagery scene shown under the boundaries. */
export const SATELLITE_SCENE = {
  name: "Horn of Africa composite",
  source: "Sentinel-2 L2A cloud-free composite",
  captured: "2026-04-18",
  resolution: "10 m",
};
