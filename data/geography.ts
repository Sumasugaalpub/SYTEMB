export type StateId = "south-west" | "hirshabelle" | "galmudug" | "jubaland" | "puntland" | "banadir" | "northern";

export type State = { id: StateId; name: string; nameSo: string; capital: string };
export type Region = { id: string; name: string; state: StateId; districts: string[] };
export type District = { id: string; name: string; region: string; state: StateId };

export const STATES: State[] = [
  { id: "south-west", name: "South West", nameSo: "Koonfur Galbeed", capital: "Baidoa" },
  { id: "hirshabelle", name: "Hirshabelle", nameSo: "Hirshabeelle", capital: "Jowhar" },
  { id: "galmudug", name: "Galmudug", nameSo: "Galmudug", capital: "Dhusamareb" },
  { id: "jubaland", name: "Jubaland", nameSo: "Jubbaland", capital: "Kismayo" },
  { id: "puntland", name: "Puntland", nameSo: "Puntland", capital: "Garowe" },
  { id: "banadir", name: "Banadir", nameSo: "Banaadir", capital: "Mogadishu" },
  { id: "northern", name: "Northern Regions", nameSo: "Gobollada Waqooyi", capital: "—" },
];

/** 18 regions, 90 districts. */
export const REGIONS: Region[] = [
  { id: "awdal", name: "Awdal", state: "northern", districts: ["Borama", "Baki", "Lughaya", "Zeila"] },
  { id: "woqooyi-galbeed", name: "Woqooyi Galbeed", state: "northern", districts: ["Hargeisa", "Berbera", "Gabiley"] },
  { id: "togdheer", name: "Togdheer", state: "northern", districts: ["Burao", "Odweyne", "Sheikh", "Buhodle"] },
  { id: "sool", name: "Sool", state: "northern", districts: ["Las Anod", "Taleh", "Hudun", "Ainabo"] },
  { id: "sanaag", name: "Sanaag", state: "northern", districts: ["Erigavo", "Badhan", "Las Qoray", "El Afweyn"] },
  { id: "bari", name: "Bari", state: "puntland", districts: ["Bosaso", "Qardho", "Iskushuban", "Qandala", "Alula", "Bandarbeyla"] },
  { id: "nugaal", name: "Nugaal", state: "puntland", districts: ["Garowe", "Eyl", "Burtinle"] },
  { id: "mudug", name: "Mudug", state: "galmudug", districts: ["Galkayo", "Goldogob", "Jariban", "Hobyo", "Harardhere"] },
  { id: "galgaduud", name: "Galgaduud", state: "galmudug", districts: ["Dhusamareb", "Abudwak", "Adado", "El Bur", "Galhareeri"] },
  { id: "hiiraan", name: "Hiiraan", state: "hirshabelle", districts: ["Beledweyne", "Bulo Burte", "Jalalaqsi"] },
  { id: "middle-shabelle", name: "Middle Shabelle", state: "hirshabelle", districts: ["Jowhar", "Balcad", "Adale", "Adan Yabal", "Warsheikh"] },
  { id: "banadir", name: "Banadir", state: "banadir", districts: ["Abdiaziz", "Bondhere", "Daynile", "Dharkenley", "Hamar Jajab", "Hamar Weyne", "Hodan", "Howlwadag", "Heliwa", "Karan", "Shangani", "Shibis", "Waberi", "Wadajir", "Yaqshid"] },
  { id: "bay", name: "Bay", state: "south-west", districts: ["Baidoa", "Burhakaba", "Dinsor", "Qansahdhere", "Berdale"] },
  { id: "bakool", name: "Bakool", state: "south-west", districts: ["Hudur", "Wajid", "Tiyeglow", "El Barde", "Rabdhure"] },
  { id: "lower-shabelle", name: "Lower Shabelle", state: "south-west", districts: ["Merca", "Afgoye", "Qoryoley", "Kurtunwarey", "Sablale", "Brava"] },
  { id: "gedo", name: "Gedo", state: "jubaland", districts: ["Garbaharey", "Bardera", "Beled Hawo", "El Wak", "Luuq", "Dolow"] },
  { id: "middle-juba", name: "Middle Juba", state: "jubaland", districts: ["Bu'aale", "Jilib", "Sakow"] },
  { id: "lower-juba", name: "Lower Juba", state: "jubaland", districts: ["Kismayo", "Afmadow", "Badhadhe", "Jamaame"] },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const DISTRICTS: District[] = REGIONS.flatMap((r) =>
  r.districts.map((name) => ({ id: slug(name), name, region: r.id, state: r.state })),
);

export const regionById = (id: string) => REGIONS.find((r) => r.id === id);
export const stateById = (id: string) => STATES.find((s) => s.id === id);
export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id);
export const regionsOfState = (id: StateId) => REGIONS.filter((r) => r.state === id);

/**
 * Boundaries that are not settled. The map draws these regions in neutral,
 * with a dotted hatch instead of a solid administrative fill, and never
 * implies which administration the line belongs to.
 */
export type DisputedBoundary = { id: string; region: string; note: string };

export const DISPUTED_BOUNDARIES: DisputedBoundary[] = [
  { id: "db-sool", region: "sool", note: "Sool — administration contested; the boundary is not agreed between the parties." },
  { id: "db-sanaag", region: "sanaag", note: "Sanaag — administration contested; the eastern boundary is not agreed." },
  { id: "db-mudug", region: "mudug", note: "Mudug — the Galkayo line divides two administrations and is not surveyed." },
];

export const DISPUTED_REGION_IDS = DISPUTED_BOUNDARIES.map((b) => b.region);
export const isDisputed = (regionId: string) => DISPUTED_REGION_IDS.includes(regionId);
export const disputeNote = (regionId: string) => DISPUTED_BOUNDARIES.find((b) => b.region === regionId)?.note;

/**
 * District reporting state, as at 2026-Q2. Districts absent from this record
 * have never filed to the platform — the map shows that as "no data received"
 * rather than as a zero.
 */
export type DistrictStatus = {
  /** Date of the last return received, ISO. */
  lastReport: string;
  /** Percent of the returns expected from this district that have arrived. */
  coverage: number;
  /** Council formation status recorded by MOIFAR. */
  council: "seated" | "interim" | "none";
};

export const DISTRICT_STATUS: Record<string, DistrictStatus> = {
  berdale: { lastReport: "2026-05-18", coverage: 100, council: "seated" },
  baidoa: { lastReport: "2026-05-14", coverage: 92, council: "seated" },
  dinsor: { lastReport: "2026-04-30", coverage: 75, council: "interim" },
  burhakaba: { lastReport: "2026-04-22", coverage: 67, council: "interim" },
  qansahdhere: { lastReport: "2026-02-11", coverage: 33, council: "none" },
  hudur: { lastReport: "2026-05-03", coverage: 83, council: "seated" },
  wajid: { lastReport: "2026-04-18", coverage: 67, council: "interim" },
  rabdhure: { lastReport: "2026-01-29", coverage: 25, council: "none" },
  tiyeglow: { lastReport: "2026-03-12", coverage: 42, council: "none" },
  afgoye: { lastReport: "2026-05-17", coverage: 92, council: "interim" },
  merca: { lastReport: "2026-05-14", coverage: 83, council: "seated" },
  qoryoley: { lastReport: "2026-04-26", coverage: 67, council: "interim" },
  kurtunwarey: { lastReport: "2026-02-04", coverage: 25, council: "none" },
  jowhar: { lastReport: "2026-05-15", coverage: 92, council: "seated" },
  balcad: { lastReport: "2026-05-06", coverage: 83, council: "seated" },
  adale: { lastReport: "2026-03-28", coverage: 50, council: "interim" },
  beledweyne: { lastReport: "2026-05-12", coverage: 83, council: "seated" },
  "bulo-burte": { lastReport: "2026-04-09", coverage: 58, council: "interim" },
  jalalaqsi: { lastReport: "2026-03-20", coverage: 42, council: "none" },
  galkayo: { lastReport: "2026-05-11", coverage: 83, council: "seated" },
  goldogob: { lastReport: "2026-04-14", coverage: 58, council: "interim" },
  hobyo: { lastReport: "2026-03-30", coverage: 50, council: "interim" },
  dhusamareb: { lastReport: "2026-05-08", coverage: 92, council: "seated" },
  abudwak: { lastReport: "2026-04-21", coverage: 67, council: "interim" },
  adado: { lastReport: "2026-04-28", coverage: 75, council: "seated" },
  garowe: { lastReport: "2026-05-17", coverage: 100, council: "seated" },
  bosaso: { lastReport: "2026-05-13", coverage: 92, council: "seated" },
  qardho: { lastReport: "2026-04-25", coverage: 75, council: "seated" },
  eyl: { lastReport: "2026-04-02", coverage: 58, council: "interim" },
  burtinle: { lastReport: "2026-03-18", coverage: 50, council: "interim" },
  bardera: { lastReport: "2026-05-05", coverage: 83, council: "seated" },
  luuq: { lastReport: "2026-04-19", coverage: 67, council: "interim" },
  dolow: { lastReport: "2026-04-11", coverage: 58, council: "interim" },
  garbaharey: { lastReport: "2026-02-26", coverage: 33, council: "none" },
  kismayo: { lastReport: "2026-05-09", coverage: 92, council: "seated" },
  afmadow: { lastReport: "2026-04-07", coverage: 58, council: "interim" },
  jamaame: { lastReport: "2026-03-14", coverage: 42, council: "none" },
  hodan: { lastReport: "2026-05-16", coverage: 100, council: "seated" },
  waberi: { lastReport: "2026-05-16", coverage: 100, council: "seated" },
  wadajir: { lastReport: "2026-05-15", coverage: 92, council: "seated" },
  daynile: { lastReport: "2026-05-10", coverage: 83, council: "seated" },
  hargeisa: { lastReport: "2026-04-24", coverage: 75, council: "seated" },
  berbera: { lastReport: "2026-04-16", coverage: 67, council: "seated" },
  borama: { lastReport: "2026-04-05", coverage: 58, council: "seated" },
  burao: { lastReport: "2026-03-31", coverage: 50, council: "interim" },
  "las-anod": { lastReport: "2026-02-19", coverage: 33, council: "none" },
  erigavo: { lastReport: "2026-03-06", coverage: 42, council: "none" },
};

export const districtStatus = (districtId: string): DistrictStatus | undefined => DISTRICT_STATUS[districtId];
