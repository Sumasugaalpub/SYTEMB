"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { roleById } from "@/data/users";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { checkFile } from "@/lib/capture";
import { db } from "@/lib/db";
import { ENTITY, type SupportMessage } from "@/lib/entities";
import { fmtDateTime } from "@/lib/format";
import { nextId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { IconChip, PageHeader, Pill, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";
import { DemoBadge } from "@/components/system/DemoBadge";

const GUIDES = [
  { id: "G-01", portal: "Executive", title: "Reading the dashboard", minutes: 5, icon: "solar:home-smile-linear", href: "/executive" },
  { id: "G-02", portal: "Executive", title: "Building the quarterly report", minutes: 7, icon: "solar:document-text-linear", href: "/reports" },
  { id: "G-03", portal: "State", title: "Reviewing a district return", minutes: 6, icon: "solar:inbox-linear", href: "/state/submissions" },
  { id: "G-04", portal: "State", title: "Setting what you share with Mogadishu", minutes: 4, icon: "solar:shield-keyhole-linear", href: "/state/sharing" },
  { id: "G-05", portal: "District", title: "Filing a return with no signal", minutes: 8, icon: "solar:smartphone-linear", href: "/district" },
  { id: "G-06", portal: "District", title: "Attaching evidence safely", minutes: 5, icon: "solar:camera-linear", href: "/district/report/evidence" },
];

const CONTACTS = [
  { icon: "solar:phone-linear", label: "Support desk", value: "+252 61 555 0100", href: "tel:+252615550100", note: "Sunday to Thursday, 08:00–16:00" },
  { icon: "solar:letter-linear", label: "Email", value: "support@spm.gov.so", href: "mailto:support@spm.gov.so", note: "Answered within one working day" },
  { icon: "solar:shield-user-linear", label: "Data Protection Officer", value: "dpo@moifar.gov.so", href: "mailto:dpo@moifar.gov.so", note: "For anything about personal or clan data" },
];

const FAQ = [
  ["My return will not send", "The app saves it on the phone. Open the home screen and press Send now when you have signal. Nothing is lost."],
  ["A page says restricted", "Your role does not have clearance for it. The role switcher is in the top bar."],
  ["A number looks wrong", "Open the method sheet on the indicators page. It says exactly how that number is calculated and who reports it."],
  ["Export is greyed out", "Early warning and conflict intelligence never export. That is deliberate."],
  ["I cannot see district names", "That state has chosen not to share district detail. The region is drawn as one shape."],
  ["How do I reset the demo?", "System settings has a Reset demo data button. It wipes this browser and lays the seed down again."],
];

/** A problem reported from this page. The screenshot is recorded by name and size. */
type ProblemReport = {
  id: string;
  page: string;
  text: string;
  screenshot: string | null;
  reportedBy: string;
  role: string;
  at: string;
};

export default function SupportPage() {
  const [openExport, exportDialog] = useExportDialog();
  const role = useStore((s) => s.role);
  const actor = roleById(role).name;
  const [open, setOpen] = React.useState<number | null>(null);
  const [problem, setProblem] = React.useState({ page: "/executive", text: "" });
  const [shot, setShot] = React.useState<{ name: string; mb: string } | null>(null);
  const [reportOpen, setReportOpen] = React.useState(false);
  const shotRef = React.useRef<HTMLInputElement>(null);
  const problems = useCollection<ProblemReport>(ENTITY.problemReports);
  const messages = useCollection<SupportMessage>(ENTITY.supportMessages);
  const [busy, setBusy] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);
  const [contact, setContact] = React.useState({ name: actor, subject: "", message: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [reference, setReference] = React.useState<string | null>(null);
  const [problemRef, setProblemRef] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  async function sendContact() {
    const next: Record<string, string> = {};
    if (contact.name.trim().length < 2) next.name = "Give a name we can reply to.";
    if (contact.subject.trim().length < 4) next.subject = "A short subject, at least four characters.";
    if (contact.message.trim().length < 15) next.message = "Say what you need in at least fifteen characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    await wait();
    const msg: SupportMessage = {
      id: nextId("SUP", 2026, 4),
      name: contact.name.trim(),
      subject: contact.subject.trim(),
      message: contact.message.trim(),
      role,
      status: "open",
      sentAt: new Date().toISOString(),
    };
    db.add<SupportMessage>(ENTITY.supportMessages, msg);
    logAct({ actor, role, action: "support.contact", target: msg.id, note: msg.subject });
    setSending(false);
    setReference(msg.id);
    setContact({ name: actor, subject: "", message: "" });
    setContactOpen(false);
    toast.success(`Sent — your reference is ${msg.id}`);
  }

  function pickShot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const bad = checkFile(file, "image");
    if (bad) return toast.error(bad);
    setShot({ name: file.name, mb: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
  }

  async function report() {
    setBusy(true);
    await wait();
    const row: ProblemReport = {
      id: nextId("PRB", 2026, 4),
      page: problem.page.trim(),
      text: problem.text.trim(),
      screenshot: shot ? `${shot.name} · ${shot.mb}` : null,
      reportedBy: actor,
      role,
      at: new Date().toISOString(),
    };
    db.add<ProblemReport>(ENTITY.problemReports, row);
    logAct({
      actor,
      role,
      action: "support.report",
      target: row.page,
      note: `${row.text}${row.screenshot ? ` · screenshot ${row.screenshot}` : " · no screenshot"}`,
    });
    setBusy(false);
    setProblem({ ...problem, text: "" });
    setShot(null);
    setReportOpen(false);
    setProblemRef(row.id);
    toast.success(`Reported \u2014 your reference is ${row.id}`);
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader onPrint={printPage} onExport={openExport} title="Support & help" meta="Guides, contacts and system status." />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <PmsCard title="Guides" className="xl:col-span-7" flush>
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {GUIDES.map((g) => (
              <li key={g.id}>
                <Link href={g.href} className="flex items-center gap-3 px-5 py-3 no-underline transition-colors hover:bg-[var(--pms-row-hover)]">
                  <IconChip icon={g.icon} tone="info" size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[var(--pms-text-strong)]">{g.title}</span>
                    <span className="block text-[11.5px] text-[var(--pms-muted-text)]">{g.minutes} minute read</span>
                  </span>
                  <Pill tone="neutral">{g.portal}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </PmsCard>

        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-5">
          <PmsCard title="Contact">
            <ul className="flex flex-col gap-3">
              {CONTACTS.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  <IconChip icon={c.icon} tone="neutral" size={34} />
                  <span className="min-w-0">
                    <a
                      href={c.href}
                      className="block text-[12.5px] font-semibold text-[var(--pms-text-strong)] no-underline underline-offset-4 hover:underline"
                    >
                      {c.value}
                    </a>
                    <span className="block text-[11.5px] text-[var(--pms-muted-text)]">{c.label} · {c.note}</span>
                  </span>
                </li>
              ))}
            </ul>

            {reference ? (
              <p className="mt-3 rounded-[10px] bg-[var(--pms-icon-success-bg)] px-3 py-2 text-[12px] font-medium text-[var(--pms-icon-success-fg)]">
                Message sent · reference <span className="font-mono">{reference}</span>
              </p>
            ) : null}

            {problemRef ? (
              <p className="mt-2 rounded-[10px] bg-[var(--pms-icon-success-bg)] px-3 py-2 text-[12px] font-medium text-[var(--pms-icon-success-fg)]">
                Problem reported · reference <span className="font-mono">{problemRef}</span>
              </p>
            ) : null}

            <Dialog open={contactOpen} onOpenChange={(v) => { setContactOpen(v); if (!v) setErrors({}); }}>
              <DialogTrigger asChild>
                <Button className="mt-4 h-9 w-full rounded-[var(--pms-radius-control)]">Contact support</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Contact support</DialogTitle></DialogHeader>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Your name</span>
                  <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="h-9 rounded-[10px]" />
                  {errors.name ? <span className="text-[11.5px] text-[var(--pms-icon-danger-fg)]">{errors.name}</span> : null}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Subject</span>
                  <Input value={contact.subject} onChange={(e) => setContact({ ...contact, subject: e.target.value })} className="h-9 rounded-[10px]" />
                  {errors.subject ? <span className="text-[11.5px] text-[var(--pms-icon-danger-fg)]">{errors.subject}</span> : null}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Message</span>
                  <textarea
                    value={contact.message}
                    rows={4}
                    onChange={(e) => setContact({ ...contact, message: e.target.value })}
                    className="rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--pms-primary)]"
                  />
                  {errors.message ? <span className="text-[11.5px] text-[var(--pms-icon-danger-fg)]">{errors.message}</span> : null}
                </label>
                <DialogFooter>
                  <Button disabled={sending} onClick={sendContact}>{sending ? "Sending…" : "Send"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 h-9 w-full rounded-[var(--pms-radius-control)]">Report a problem</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Report a problem</DialogTitle></DialogHeader>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Which page</span>
                  <Input value={problem.page} onChange={(e) => setProblem({ ...problem, page: e.target.value })} className="h-9 rounded-[10px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">What happened</span>
                  <textarea
                    value={problem.text}
                    rows={4}
                    onChange={(e) => setProblem({ ...problem, text: e.target.value })}
                    className="rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--pms-primary)]"
                  />
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Screenshot</span>
                  <input ref={shotRef} type="file" accept="image/*" hidden onChange={pickShot} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-[var(--pms-radius-control)]" onClick={() => shotRef.current?.click()}>
                      Attach a screenshot
                    </Button>
                    {shot ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--pms-text)]">{shot.name}</span>
                        <span className="text-[11px] text-[var(--pms-muted-text)]">{shot.mb}</span>
                        <button
                          type="button"
                          onClick={() => setShot(null)}
                          className="text-[11.5px] text-[var(--pms-muted-text)] underline-offset-4 hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="text-[11.5px] text-[var(--pms-muted-text)]">Optional — a picture of the screen helps us find it.</span>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button disabled={!problem.text.trim() || busy} onClick={report}>{busy ? "Sending…" : "Send"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PmsCard>

          <PmsCard title="Audio help">
            <AudioHelp clip="support" text="Haddii aad caawimaad u baahan tahay, wac xarunta taageerada." />
            <p className="mt-2 text-[11.5px] text-[var(--pms-muted-text)]">
              Spoken guidance in Somali for every field-app screen.
            </p>
          </PmsCard>

          <PmsCard title="System status" action={<DemoBadge label="Status" />}>
            <ul className="flex flex-col gap-2 text-[12.5px]">
              {[
                ["All services", "Operational", "good"],
                ["Uptime (30 days)", "99.89%", "good"],
                ["Last backup", "20 May 2026, 02:15", "neutral"],
                ["Next backup", "21 May 2026, 02:15", "neutral"],
                ["Server region", "To be confirmed", "warn"],
              ].map(([k, v, tone]) => (
                <li key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[var(--pms-muted-text)]">{k}</span>
                  <Pill tone={tone as "good" | "neutral" | "warn"}>{v}</Pill>
                </li>
              ))}
            </ul>
          </PmsCard>
        </div>
      </div>

      {messages.length ? (
        <PmsCard title="Messages you have sent" flush>
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {messages.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-5 py-3">
                <IconChip icon="solar:letter-linear" tone="info" size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11.5px] text-[var(--pms-muted-text)]">{m.id}</span>
                    <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{m.subject}</span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-[1.55] text-[var(--pms-text)]">{m.message}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--pms-muted-text)]">
                    {m.name} · {fmtDateTime(m.sentAt)}
                  </span>
                </span>
                <Pill tone="warn">{m.status}</Pill>
              </li>
            ))}
          </ul>
        </PmsCard>
      ) : null}

      {problems.length ? (
        <PmsCard title="Problems you have reported" flush>
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {problems.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                <IconChip icon="solar:bug-linear" tone="warning" size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11.5px] text-[var(--pms-muted-text)]">{r.id}</span>
                    <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{r.page}</span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-[1.55] text-[var(--pms-text)]">{r.text}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--pms-muted-text)]">
                    {r.reportedBy} · {fmtDateTime(r.at)}
                  </span>
                </span>
                {r.screenshot ? (
                  <Pill tone="info">
                    <iconify-icon icon="solar:camera-linear" className="text-[13px]" />
                    {r.screenshot}
                  </Pill>
                ) : (
                  <Pill tone="neutral">no screenshot</Pill>
                )}
              </li>
            ))}
          </ul>
        </PmsCard>
      ) : null}

      <PmsCard title="Frequently asked" flush>
        <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
          {FAQ.map(([q, a], i) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--pms-row-hover)]"
              >
                <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--pms-text-strong)]">{q}</span>
                <iconify-icon
                  icon={open === i ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                  className="text-[16px] text-[var(--pms-muted-text)]"
                />
              </button>
              {open === i ? <p className="px-5 pb-4 text-[12.5px] leading-[1.6] text-[var(--pms-muted-text)]">{a}</p> : null}
            </li>
          ))}
        </ul>
      </PmsCard>
    </div>
  );
}
