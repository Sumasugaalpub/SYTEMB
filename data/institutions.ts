export type Institution = { id: string; acronym: string; name: string; level: "federal" | "state" | "partner" };

export const INSTITUTIONS: Institution[] = [
  { id: "moifar", acronym: "MOIFAR", name: "Ministry of Interior, Federal Affairs & Reconciliation", level: "federal" },
  { id: "opm", acronym: "OPM", name: "Office of the Prime Minister", level: "federal" },
  { id: "mojca", acronym: "MOJCA", name: "Ministry of Justice & Constitutional Affairs", level: "federal" },
  { id: "mois", acronym: "MOIS", name: "Ministry of Internal Security", level: "federal" },
  { id: "mowhrd", acronym: "MOWHRD", name: "Ministry of Women & Human Rights Development", level: "federal" },
  { id: "mopied", acronym: "MOPIED", name: "Ministry of Planning, Investment & Economic Development", level: "federal" },
  { id: "moche", acronym: "MOCHE", name: "Ministry of Culture, Heritage & the Somalia Peace Museum", level: "federal" },
  { id: "nbs", acronym: "SNBS", name: "Somalia National Bureau of Statistics", level: "federal" },
  { id: "bra", acronym: "BRA", name: "Banadir Regional Administration", level: "state" },
  { id: "sw-moi", acronym: "SW-MOI", name: "South West State Ministry of Interior", level: "state" },
  { id: "hs-moi", acronym: "HS-MOI", name: "Hirshabelle State Ministry of Interior", level: "state" },
  { id: "undp", acronym: "UNDP", name: "United Nations Development Programme", level: "partner" },
];

export const institutionByAcronym = (a: string) => INSTITUTIONS.find((i) => i.acronym === a);
