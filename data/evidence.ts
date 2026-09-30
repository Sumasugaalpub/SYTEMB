import type { Visibility } from "@/lib/visibility";
import type { EvidenceTypeId } from "./evidenceTypes";

export type Evidence = { id: string; type: EvidenceTypeId; title: string; district: string; region: string; date: string; submittedBy: string; visibility: Visibility; resultArea: string; linked: string[]; size: string; description: string };

export const EVIDENCE: Evidence[] = [
  { id: "EV-2026-0311", type: "photo", title: "Mediation session under the acacia, Berdale", district: "Berdale", region: "bay", date: "2026-04-08", submittedBy: "Bashiir Muuse", visibility: "aggregated", resultArea: "cl-01", linked: ["INC-0412", "SUB-SW-015", "PRJ-0142"], size: "2.4 MB", description: "Elders from both sub-clans seated with the district commissioner." },
  { id: "EV-2026-0312", type: "minutes", title: "Committee minutes 28 March", district: "Berdale", region: "bay", date: "2026-03-28", submittedBy: "Bashiir Muuse", visibility: "authorized", resultArea: "cl-01", linked: ["SUB-SW-015"], size: "380 KB", description: "Five agenda items; quorum reached; 4 women present." },
  { id: "EV-2026-0313", type: "audio", title: "Elders' statement (Maay)", district: "Berdale", region: "bay", date: "2026-04-08", submittedBy: "Bashiir Muuse", visibility: "restricted", resultArea: "cl-01", linked: ["INC-0425", "SUB-SW-015", "EW-2026-0087"], size: "6.1 MB", description: "Statement naming parties; restricted under consent terms." },
  { id: "EV-2026-0314", type: "agreement", title: "Signed grazing-sharing agreement", district: "Berdale", region: "bay", date: "2026-04-08", submittedBy: "SW-MOI", visibility: "authorized", resultArea: "cl-02", linked: ["SUB-SW-015", "KPI-019"], size: "1.1 MB", description: "Seasonal rotation of the Goof-Gaduud corridor." },
  { id: "EV-2026-0315", type: "photo", title: "Water point after repair", district: "Berdale", region: "bay", date: "2026-04-12", submittedBy: "Bashiir Muuse", visibility: "public", resultArea: "cl-06", linked: ["INC-0437", "SUB-SW-015"], size: "1.8 MB", description: "Borehole pump replaced by the district." },
  { id: "EV-2026-0316", type: "attendance", title: "Attendance sheet", district: "Berdale", region: "bay", date: "2026-04-08", submittedBy: "Bashiir Muuse", visibility: "restricted", resultArea: "cl-01", linked: ["SUB-SW-015"], size: "240 KB", description: "Names and phone numbers of attendees." },
  { id: "EV-2026-0288", type: "report", title: "Q1 Hirshabelle state peace report", district: "Jowhar", region: "middle-shabelle", date: "2026-04-20", submittedBy: "HS-MOI", visibility: "aggregated", resultArea: "cl-01", linked: ["INC-0455"], size: "3.2 MB", description: "Aggregated counts only, per state sharing settings." },
  { id: "EV-2026-0295", type: "video", title: "Museum travelling exhibition, Garowe", district: "Garowe", region: "nugaal", date: "2026-04-25", submittedBy: "Somalia Peace Museum", visibility: "public", resultArea: "cl-01", linked: ["PRJ-0161"], size: "148 MB", description: "Opening of the 'Voices of Peace' exhibition." },
  { id: "EV-2026-0301", type: "dataset", title: "Mobile court case register Q1", district: "Bardera", region: "gedo", date: "2026-04-05", submittedBy: "MOJCA", visibility: "authorized", resultArea: "cl-05", linked: ["PRJ-0118"], size: "820 KB", description: "Case-level register, anonymised." },
  { id: "EV-2026-0305", type: "audio", title: "Oral testimony #0388 — 1991 displacement", district: "Hodan", region: "banadir", date: "2026-03-30", submittedBy: "Somalia Peace Museum", visibility: "restricted", resultArea: "cl-01", linked: ["PRJ-0161"], size: "22 MB", description: "Survivor testimony; embargoed until consent review." },
  { id: "EV-2026-0320", type: "policy", title: "National Reconciliation Framework — ministerial policy note", district: "Hodan", region: "banadir", date: "2026-02-18", submittedBy: "MOIFAR", visibility: "public", resultArea: "cl-01", linked: ["KPI-001", "PRJ-0142"], size: "1.4 MB", description: "Cabinet-approved policy note setting the reconciliation architecture for 2026-2029." },
  { id: "EV-2026-0322", type: "research", title: "Drivers of grazing conflict in Bay and Bakool", district: "Baidoa", region: "bay", date: "2026-03-11", submittedBy: "Somali Institute for Peace Studies", visibility: "public", resultArea: "cl-02", linked: ["KPI-019", "PRJ-0142"], size: "4.6 MB", description: "Peer-reviewed paper on rainfall failure, corridor closure and retaliation cycles." },
  { id: "EV-2026-0324", type: "casestudy", title: "Case study — the Berdale grazing corridor settlement", district: "Berdale", region: "bay", date: "2026-04-30", submittedBy: "SW-MOI", visibility: "authorized", resultArea: "cl-02", linked: ["EW-2026-0087", "PRJ-0142", "KPI-019"], size: "980 KB", description: "How a level-4 tension alert closed in nine days: sequence, actors and costs." },
  { id: "EV-2026-0326", type: "guideline", title: "District peace committee facilitation guideline", district: "Jowhar", region: "middle-shabelle", date: "2026-01-22", submittedBy: "MOIFAR", visibility: "public", resultArea: "cl-07", linked: ["KPI-062", "PRJ-0170"], size: "720 KB", description: "Step-by-step facilitation standard issued to all district committees." },
];

export const evidenceById = (id: string) => EVIDENCE.find((e) => e.id === id);

/**
 * Counter groups on the evidence library. A group is the set of types it counts.
 */
export type EvidenceGroupId = "documents" | "photographs" | "videos" | "reports" | "research";

export const EVIDENCE_GROUPS: {
  id: EvidenceGroupId;
  label: string;
  icon: string;
  types: EvidenceTypeId[];
  /** Type the counter filters the table down to when clicked. */
  filter: EvidenceTypeId;
}[] = [
  {
    id: "documents",
    label: "Documents",
    icon: "solar:document-text-linear",
    types: ["minutes", "agreement", "attendance", "dataset", "report", "policy", "research", "casestudy", "guideline"],
    filter: "report",
  },
  { id: "photographs", label: "Photographs", icon: "solar:gallery-wide-linear", types: ["photo"], filter: "photo" },
  { id: "videos", label: "Videos", icon: "solar:videocamera-linear", types: ["video"], filter: "video" },
  { id: "reports", label: "Reports", icon: "solar:clipboard-list-linear", types: ["report"], filter: "report" },
  { id: "research", label: "Research papers", icon: "solar:book-bookmark-linear", types: ["research"], filter: "research" },
];

/**
 * Holdings digitised before the platform opened. They are counted in the headline
 * figures but are not browsable item by item, so the table shows only EVIDENCE.
 * Archive + the seeded items above give the published library totals:
 * 1,245 documents · 2,345 photographs · 532 videos · 356 reports · 78 research papers.
 */
export const EVIDENCE_ARCHIVE: Record<EvidenceGroupId, number> = {
  documents: 1236,
  photographs: 2343,
  videos: 531,
  reports: 355,
  research: 77,
};

/** Headline count for a group: the archive plus everything held in the live library. */
export function evidenceGroupCount(group: (typeof EVIDENCE_GROUPS)[number], rows: Evidence[]) {
  return EVIDENCE_ARCHIVE[group.id] + rows.filter((e) => group.types.includes(e.type)).length;
}
