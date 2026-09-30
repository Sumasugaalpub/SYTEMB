import { TIMELINE } from "./timeline";
import { REGIONS } from "./geography";

export type SubmissionStatus = "approved" | "pending" | "returned" | "draft" | "missing";
export type Submission = {
  id: string;
  district: string;
  region: string;
  focalPoint: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  period: string;
  disputes: number;
  resolved: number;
  tension: 1 | 2 | 3 | 4 | 5;
  evidence: number;
  note?: string;
};

const FOCAL = ["Abdi Hassan", "Faadumo Ali", "Maxamed Nuur", "Hodan Yuusuf", "Cabdullahi Aadan", "Sahra Maxamuud", "Ibraahim Cali", "Asha Warsame", "Yuusuf Xirsi", "Nimco Faarax", "Axmed Jaamac", "Ubah Cilmi", "Cumar Sheekh", "Khadra Ismaaciil", "Bashiir Muuse", "Deeqa Maxamed"];
const STATUS: SubmissionStatus[] = ["approved", "approved", "pending", "approved", "returned", "approved", "pending", "approved", "missing", "approved", "draft", "approved", "pending", "approved", "missing", "approved"];

/** The 16 South West district returns for the demo period. Berdale is THE demo report. */
export const SUBMISSIONS: Submission[] = REGIONS.filter((r) => r.state === "south-west")
  .flatMap((r) => r.districts.map((d) => ({ d, r: r.id })))
  .map(({ d, r }, i) => {
    const status = d === "Berdale" ? "approved" : STATUS[i];
    return {
      id: `SUB-SW-${String(i + 1).padStart(3, "0")}`,
      district: d,
      region: r,
      focalPoint: FOCAL[i],
      status,
      submittedAt: d === "Berdale" ? TIMELINE.submitted : status === "missing" || status === "draft" ? null : `2026-04-${String(10 + (i % 6)).padStart(2, "0")}T${String(8 + (i % 8)).padStart(2, "0")}:30`,
      period: TIMELINE.period,
      disputes: d === "Berdale" ? 7 : 2 + ((i * 5) % 9),
      resolved: d === "Berdale" ? 5 : 1 + ((i * 3) % 5),
      tension: (d === "Berdale" ? 4 : 1 + (i % 4)) as Submission["tension"],
      evidence: d === "Berdale" ? 6 : i % 5,
      note: status === "returned" ? "Dispute count does not match committee minutes — please reconcile." : undefined,
    };
  });

export const submissionById = (id: string) => SUBMISSIONS.find((s) => s.id === id);
