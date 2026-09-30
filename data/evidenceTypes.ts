/** Category the workbook files each evidence type under. */
export const EVIDENCE_CATEGORIES = ["Reports", "Evidence", "Knowledge"] as const;
export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export const EVIDENCE_TYPES = [
  { id: "photo", label: "Photo", category: "Evidence", icon: "solar:camera-linear", formats: ["JPG", "PNG", "HEIC"], maxMb: 10 },
  { id: "audio", label: "Audio", category: "Evidence", icon: "solar:microphone-3-linear", formats: ["MP3", "M4A", "OGG"], maxMb: 25 },
  { id: "video", label: "Video", category: "Evidence", icon: "solar:videocamera-record-linear", formats: ["MP4", "MOV"], maxMb: 200 },
  { id: "minutes", label: "Minutes", category: "Evidence", icon: "solar:document-text-linear", formats: ["PDF", "DOCX", "JPG"], maxMb: 10 },
  { id: "agreement", label: "Agreement", category: "Evidence", icon: "solar:document-medicine-linear", formats: ["PDF", "JPG"], maxMb: 10 },
  { id: "attendance", label: "Attendance", category: "Evidence", icon: "solar:clipboard-list-linear", formats: ["PDF", "XLSX", "JPG"], maxMb: 5 },
  { id: "dataset", label: "Dataset", category: "Evidence", icon: "solar:database-linear", formats: ["CSV", "XLSX"], maxMb: 50 },
  { id: "report", label: "Report", category: "Reports", icon: "solar:file-text-linear", formats: ["PDF", "DOCX"], maxMb: 20 },
  { id: "policy", label: "Policy", category: "Reports", icon: "solar:notebook-bookmark-linear", formats: ["PDF", "DOCX"], maxMb: 20 },
  { id: "research", label: "Research", category: "Knowledge", icon: "solar:book-bookmark-linear", formats: ["PDF"], maxMb: 30 },
  { id: "casestudy", label: "Case study", category: "Knowledge", icon: "solar:notes-linear", formats: ["PDF", "DOCX"], maxMb: 20 },
  { id: "guideline", label: "Guideline", category: "Knowledge", icon: "solar:checklist-minimalistic-linear", formats: ["PDF", "DOCX"], maxMb: 20 },
] as const;

export type EvidenceTypeId = (typeof EVIDENCE_TYPES)[number]["id"];

export const evidenceTypeById = (id: string) => EVIDENCE_TYPES.find((t) => t.id === id);
