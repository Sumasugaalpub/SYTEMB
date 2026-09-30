"use client";

/** Every collection the prototype persists, and the key it lives under. */
export const ENTITY = {
  submissions: "submissions",
  alerts: "alerts",
  incidents: "incidents",
  evidence: "evidence",
  projects: "projects",
  indicators: "indicators",
  users: "users",
  notifications: "notifications",
  activity: "activity",
  drafts: "drafts",
  session: "session",
  settings: "settings",
  results: "results",
  reportItems: "reportItems",
  supportMessages: "supportMessages",
  problemReports: "problemReports",
} as const;

export type EntityName = (typeof ENTITY)[keyof typeof ENTITY];

/** One row of the workbook's results template — one indicator, one period. */
export type ResultEntry = {
  id: string;
  indicator: string;
  period: string;
  value: number;
  source: string;
  quality: "verified" | "provisional" | "estimated";
  notes: string;
  institution: string;
  submittedBy: string;
  submittedAt: string;
};

/** A snapshot staged from the data explorer or analytics, waiting to be put in a report. */
export type ReportItem = {
  id: string;
  title: string;
  source: "data-explorer" | "analytics";
  summary: string;
  rows: { label: string; value: number; note: string }[];
  addedAt: string;
};

/** A message sent from the support page. */
export type SupportMessage = {
  id: string;
  name: string;
  subject: string;
  message: string;
  role: string;
  status: "open";
  sentAt: string;
};
