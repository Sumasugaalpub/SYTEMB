"use client";

import * as React from "react";

import type { Incident } from "@/data/alerts";
import type { Evidence } from "@/data/evidence";
import type { Notification } from "@/data/notifications";
import { TIMELINE } from "@/data/timeline";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { transition, type SubStatus } from "@/lib/flow";
import { fmtPeriod } from "@/lib/format";
import { nextId } from "@/lib/ids";
import type { StoredSubmission } from "@/lib/seed";
import { useCollection } from "@/lib/use-collection";

import { officerById, type Officer } from "./officers";
import {
  EVENT_TYPES, useOutbox, useResumeHref, useT,
  type Answers, type EventInput, type Msg, type OutboxItem, type Photo, type StepId, type Trend,
} from "./state";

/** A submission filed from the phone keeps every answer, not just the totals. */
export type MobileSubmission = StoredSubmission & { answers?: Answers; receipt?: string; evidenceIds?: string[] };
export type MobileIncident = Incident & {
  village?: string;
  description?: string;
  mediation?: string | null;
  agreement?: string | null;
  reportedBy?: string;
  source?: "mobile";
};
type PhotoEvidence = Evidence & { src?: string };

/** The phone files the quarter that is open now; the previous one is history. */
export const REPORT_PERIOD = TIMELINE.periodOpen;

/** Older views read tension as a 1–5 level; the field app records a trend. */
export const TREND_LEVEL: Record<Trend, 1 | 2 | 3 | 4 | 5> = { rising: 4, unchanged: 3, falling: 2 };

export type SendResult = { ok: true; ref: string; id: string } | { ok: false; error: Msg };

const NO_SIGNAL: Msg = { so: "Internet ma jiro", en: "No signal" };

// ------------------------------------------------------------- validation

export type Problem = Msg & { step: StepId };

export function validate(a: Answers): Problem[] {
  const p: Problem[] = [];
  if (a.committee.met === null) p.push({ step: "committee", so: "Sheeg in guddigu shiray iyo in kale.", en: "Say whether the committee met." });
  if (a.committee.met && a.committee.meetings < 1) p.push({ step: "committee", so: "Geli inta jeer ee guddigu shiray.", en: "Enter how many times it met." });
  if (a.disputes.agreements > a.disputes.worked)
    p.push({ step: "disputes", so: "Heshiisyadu kama badnaan karaan khilaafaadka. Fadlan hubi.", en: "Agreements cannot be more than disputes. Please check." });
  if (a.disputes.worked > 0 && !a.disputes.cause) p.push({ step: "disputes", so: "Dooro sababta khilaafaadka.", en: "Choose the main cause of disputes." });
  if (a.council.formed === null) p.push({ step: "council", so: "Sheeg in golaha la sameeyay iyo in kale.", en: "Say whether the council has formed." });
  if (a.council.formed && !a.council.year) p.push({ step: "council", so: "Dooro goorta golaha la sameeyay.", en: "Choose when the council was formed." });
  if (a.council.women > a.council.members) p.push({ step: "council", so: "Haweenku kama badnaan karaan xubnaha.", en: "Women cannot be more than members." });
  if (!a.tension.trend) p.push({ step: "tension", so: "Dooro sida xiisaddu isu beddeshay.", en: "Choose how the tension is changing." });
  if (a.tension.trend && !a.tension.reason) p.push({ step: "tension", so: "Dooro sababta xiisadda.", en: "Choose the main reason for the tension." });
  if (!a.narrative.narrative.trim()) p.push({ step: "narrative", so: "Qor waxa dhacay rubucan.", en: "Write what happened this quarter." });
  return p;
}

// ---------------------------------------------------------------- helpers

/** Receipt numbers read like BRD-2026Q2-0043 and never repeat. */
function nextReceipt(code: string, period: string): string {
  const n = db.getOne<number>("seq_RCPT", 42) + 1;
  db.setOne("seq_RCPT", n);
  return `${code}-${period.replace("-", "")}-${String(n).padStart(4, "0")}`;
}

/** Photos become evidence records linked to what they support. */
function filePhotos(photos: Photo[], officer: Officer, linked: string): string[] {
  return photos.map((p) => {
    const id = nextId("EV", 2026, 4);
    db.add<PhotoEvidence>(ENTITY.evidence, {
      id,
      type: "photo",
      title: p.name,
      district: officer.district,
      region: officer.region,
      date: p.at.slice(0, 10),
      submittedBy: officer.name,
      visibility: "authorized",
      resultArea: "cl-01",
      linked: [linked],
      size: `${p.kb} KB`,
      description: "Field photo from the district app. Location data was removed on the phone.",
      src: p.src,
    });
    return id;
  });
}

function notify(n: Omit<Notification, "id">) {
  db.add<Notification>(ENTITY.notifications, { id: nextId("N", 2026, 3), ...n });
}

// ---------------------------------------------------------------- sending

export function submitReport(answers: Answers, officer: Officer): SendResult {
  const problems = validate(answers);
  if (problems.length) return { ok: false, error: problems[0] };

  const cur = db
    .get<MobileSubmission>(ENTITY.submissions)
    .find((r) => r.district === officer.district && r.period === REPORT_PERIOD);
  if (cur?.status === "pending") return { ok: false, error: { so: "Warbixintan horey ayaa loo diray.", en: "This report is already waiting for state approval." } };
  if (cur?.status === "approved") return { ok: false, error: { so: "Warbixintan waa la ansixiyay.", en: "This report was already approved." } };

  // missing → draft → pending, or returned → pending, through the shared state machine.
  const by = officer.name;
  let from = (cur?.status ?? "missing") as SubStatus;
  let events = cur?.events ?? [];
  if (from === "missing") {
    const toDraft = transition("missing", "draft", { by, events });
    if (!toDraft.ok) return { ok: false, error: { so: toDraft.error, en: toDraft.error } };
    from = "draft";
    events = toDraft.events;
  }
  const move = transition(from, "pending", { by, events });
  if (!move.ok) return { ok: false, error: { so: move.error, en: move.error } };

  const id = cur?.id ?? nextId("SUB", 2026, 3);
  const ref = nextReceipt(officer.code, REPORT_PERIOD);
  const evidenceIds = filePhotos(answers.photos, officer, id);
  const patch = {
    status: "pending" as const,
    submittedAt: new Date().toISOString(),
    focalPoint: by,
    disputes: answers.disputes.worked,
    resolved: answers.disputes.agreements,
    tension: TREND_LEVEL[answers.tension.trend ?? "unchanged"],
    evidence: evidenceIds.length,
    note: undefined,
    events: move.events,
    // Photos already live in the evidence library; the row keeps their ids.
    answers: { ...answers, photos: [] },
    receipt: ref,
    evidenceIds,
  };
  if (cur) db.update<MobileSubmission>(ENTITY.submissions, id, patch);
  else db.add<MobileSubmission>(ENTITY.submissions, { id, district: officer.district, region: officer.region, period: REPORT_PERIOD, ...patch });

  logAct({
    actor: by,
    role: "district-admin",
    action: "submission.submit",
    target: id,
    note: `${officer.district} ${REPORT_PERIOD} filed from the district app — ${answers.disputes.agreements} of ${answers.disputes.worked} disputes ended in agreement.`,
  });
  notify({
    title: `${officer.district} return received`,
    body: `${fmtPeriod(REPORT_PERIOD)} · ${answers.disputes.worked} disputes reported · awaiting state review.`,
    at: new Date().toISOString(),
    icon: "solar:inbox-in-linear",
    tone: "brand",
    href: `/state/submissions/${id}`,
    unread: true,
  });
  return { ok: true, ref, id };
}

export function submitEvent(ev: EventInput, officer: Officer): SendResult {
  const type = EVENT_TYPES.find((t) => t.value === ev.type);
  if (!type) return { ok: false, error: { so: "Dooro nooca dhacdada.", en: "Choose the event type." } };
  if (!ev.description.trim()) return { ok: false, error: { so: "Qor waxa dhacay.", en: "Write what happened." } };

  const id = nextId("INC", 2026, 4);
  const evidence = filePhotos(ev.photos, officer, id);
  db.add<MobileIncident>(ENTITY.incidents, {
    id,
    date: ev.date,
    district: officer.district,
    region: officer.region,
    type: type.incident,
    fatalities: ev.hurt,
    displaced: ev.displaced,
    status: ev.agreement === "yes" ? "mediated" : "ongoing",
    lng: officer.lng,
    lat: officer.lat,
    evidence,
    village: ev.village.trim(),
    description: ev.description.trim(),
    mediation: ev.mediation,
    agreement: ev.agreement,
    reportedBy: officer.name,
    source: "mobile",
  });

  const where = ev.village.trim() ? `${ev.village.trim()}, ${officer.district}` : officer.district;
  logAct({
    actor: officer.name,
    role: "district-admin",
    action: "incident.report",
    target: id,
    note: `${type.incident} in ${where} — ${ev.hurt} hurt, ${ev.displaced} households displaced.`,
  });
  notify({
    title: `Event reported — ${officer.district}`,
    body: `${type.incident} · ${ev.hurt} hurt · ${ev.displaced} households displaced.`,
    at: new Date().toISOString(),
    icon: "solar:danger-triangle-linear",
    tone: "red",
    href: "/conflict-navigator",
    unread: true,
  });
  return { ok: true, ref: id, id };
}

// ----------------------------------------------------------------- outbox

const outboxId = () => `OUT-${Date.now().toString(36).toUpperCase()}`;

function queue(item: Omit<OutboxItem, "id" | "savedAt" | "status">): OutboxItem {
  const full: OutboxItem = { ...item, id: outboxId(), savedAt: new Date().toISOString(), status: "waiting" };
  useOutbox.getState().add(full);
  return full;
}

export const queueReport = (answers: Answers, officer: Officer) => queue({ kind: "report", officerId: officer.id, report: answers });
export const queueEvent = (ev: EventInput, officer: Officer) => queue({ kind: "event", officerId: officer.id, event: ev });

/** What an outbox item is called, in the officer's language. */
export function itemTitle(item: OutboxItem, t: (so: string, en: string) => string): string {
  if (item.kind === "report") return t(`Warbixinta rubuca · ${fmtPeriod(REPORT_PERIOD)}`, `Quarterly report · ${fmtPeriod(REPORT_PERIOD)}`);
  const type = EVENT_TYPES.find((x) => x.value === item.event?.type);
  const village = item.event?.village.trim();
  return `${t("Dhacdo", "Event")} · ${type ? t(type.so, type.en) : ""}${village ? `, ${village}` : ""}`;
}

/** Tries to send one outbox item. A success removes it from the outbox. */
export async function sendItem(id: string, online: boolean): Promise<SendResult> {
  const { items, update, remove } = useOutbox.getState();
  const item = items.find((i) => i.id === id);
  if (!item) return { ok: false, error: { so: "Lama helin.", en: "Not found." } };
  if (!online) {
    update(id, { status: "failed", error: NO_SIGNAL });
    return { ok: false, error: NO_SIGNAL };
  }

  update(id, { status: "sending", error: undefined });
  await wait();

  const officer = officerById(item.officerId);
  const res: SendResult = !officer
    ? { ok: false, error: { so: "Akoonka lama helin.", en: "Account not found." } }
    : item.kind === "report" && item.report
      ? submitReport(item.report, officer)
      : item.event
        ? submitEvent(item.event, officer)
        : { ok: false, error: { so: "Xog la'aan.", en: "Nothing to send." } };

  if (!res.ok) update(id, { status: "failed", error: res.error });
  else remove(id);
  return res;
}

/** Sends everything waiting, one at a time. Returns how many went through. */
export async function sendAll(online: boolean): Promise<number> {
  let sent = 0;
  for (const { id } of useOutbox.getState().items) {
    const res = await sendItem(id, online);
    if (res.ok) sent++;
  }
  return sent;
}

// -------------------------------------------------------------- reading

/** A live collection that already holds the stored rows on the first render. */
export function useRows<T extends { id: string }>(entity: string): T[] {
  const [initial] = React.useState(() => db.get<T>(entity));
  return useCollection<T>(entity, initial);
}

/** This quarter's return for the officer's district, and whether one is queued. */
export function useReportStatus(officer: Officer) {
  const rows = useRows<MobileSubmission>(ENTITY.submissions);
  const queued = useOutbox((s) => s.items.find((i) => i.kind === "report" && i.officerId === officer.id));
  const sub = rows.find((r) => r.district === officer.district && r.period === REPORT_PERIOD);
  return { sub, queued };
}

export const receiptHref = (sub: MobileSubmission) => `/mobile/receipt?ref=${encodeURIComponent(sub.receipt ?? sub.id)}`;

/** Where the "Report" tab leads: the receipt once sent, the outbox when queued, else the next step. */
export function useReportHref(officer: Officer): string {
  const { sub, queued } = useReportStatus(officer);
  const resume = useResumeHref();
  if (sub && (sub.status === "pending" || sub.status === "approved")) return receiptHref(sub);
  if (queued) return "/mobile/outbox";
  return resume;
}

/** A returned report goes back into the draft, photos included, for correction. */
export function answersFromSubmission(sub: MobileSubmission): Answers | null {
  if (!sub.answers) return null;
  const photos: Photo[] = db
    .get<PhotoEvidence>(ENTITY.evidence)
    .filter((e) => sub.evidenceIds?.includes(e.id) && e.src)
    .map((e) => ({ id: e.id, src: e.src!, name: e.title, file: e.title, kb: parseInt(e.size, 10) || 0, at: e.date }));
  return { ...sub.answers, photos };
}

export type HistoryItem = {
  kind: "report" | "event";
  id: string;
  title: string;
  ref: string;
  at: string;
  status: "pending" | "approved" | "returned" | "sent";
  note?: string;
  href: string;
};

/** Everything this officer has sent: quarterly returns and event reports. */
export function useHistory(officer: Officer): HistoryItem[] {
  const t = useT();
  const subs = useRows<MobileSubmission>(ENTITY.submissions);
  const incidents = useRows<MobileIncident>(ENTITY.incidents);
  return React.useMemo(() => {
    const reports: HistoryItem[] = subs
      .filter((r) => r.district === officer.district && r.submittedAt && ["pending", "approved", "returned"].includes(r.status))
      .map((r) => ({
        kind: "report",
        id: r.id,
        title: t(`Warbixinta rubuca · ${fmtPeriod(r.period)}`, `Quarterly report · ${fmtPeriod(r.period)}`),
        ref: r.receipt ?? r.id,
        at: r.submittedAt!,
        status: r.status as HistoryItem["status"],
        note: r.note,
        href: receiptHref(r),
      }));
    const events: HistoryItem[] = incidents
      .filter((i) => i.source === "mobile" && i.reportedBy === officer.name)
      .map((i) => {
        const type = EVENT_TYPES.find((x) => x.incident === i.type);
        return {
          kind: "event",
          id: i.id,
          title: `${t("Dhacdo", "Event")} · ${type ? t(type.so, type.en) : i.type}${i.village ? `, ${i.village}` : ""}`,
          ref: i.id,
          at: i.date,
          status: "sent",
          href: `/mobile/receipt?event=${encodeURIComponent(i.id)}`,
        };
      });
    return [...reports, ...events].sort((a, b) => b.at.localeCompare(a.at));
  }, [subs, incidents, officer.district, officer.name, t]);
}
