"use client";

import * as React from "react";
import { toast } from "sonner";

import { REPORTS } from "@/data/knowledge";
import { PERIODS } from "@/data/periods";
import { RESULT_AREAS } from "@/data/resultAreas";
import { roleById } from "@/data/users";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { getDenominator } from "@/lib/coverage";
import { db } from "@/lib/db";
import { ENTITY, type ReportItem } from "@/lib/entities";
import { downloadBlob, downloadPDF } from "@/lib/download";
import { fmtDate, fmtPeriod } from "@/lib/format";
import { bandOf } from "@/lib/status";
import { useStore } from "@/lib/store";
import { useCollection, useStored } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, Panel, PanelHead, Rule } from "@/components/pms/dashboard-sections";
import { CAPTION, FIELD_LABEL, FORM_FIELD, toneStyle } from "@/components/pms/exec-kit";
import { PageHeader, Pill, type PillTone, printPage, useExportDialog } from "@/components/pms/ui";

type Saved = (typeof REPORTS)[number];
const TONE: Record<string, PillTone> = { published: "good", review: "warn", draft: "neutral" };

const SECTIONS = ["Key messages", "Result areas", "National indicators", "Map", "Decisions requested", "Evidence summary"];

export default function ReportsPage() {
  const [openExport, exportDialog] = useExportDialog();
  const { role, region, bandMode } = useStore();
  const actor = roleById(role).name;
  const saved = useStored<Saved[]>("reports", REPORTS as unknown as Saved[]);
  const staged = useCollection<ReportItem>(ENTITY.reportItems);

  const [step, setStep] = React.useState(0);
  const [building, setBuilding] = React.useState(false);
  const [title, setTitle] = React.useState("Executive Brief — Q1 2026");
  const [period, setPeriod] = React.useState("2026-Q1");
  const [areas, setAreas] = React.useState<string[]>(RESULT_AREAS.map((r) => r.id));
  const [sections, setSections] = React.useState<string[]>(SECTIONS.slice(0, 5));
  const [busy, setBusy] = React.useState(false);
  const [dropped, setDropped] = React.useState<string[]>([]);

  const included = staged.filter((i) => !dropped.includes(i.id));

  const total = getDenominator(region);
  const reported = 68;
  const coverageLine = `${reported} of ${total} districts reported for ${fmtPeriod(period)}. National figures should be read with this in mind.`;

  const lines = [
    `Period: ${fmtPeriod(period)}`,
    `Prepared by: ${actor}`,
    "",
    ...(sections.includes("Key messages")
      ? ["Key messages", "  Local mediation is the strongest area this quarter.", "  Displacement remains the most off-track.", ""]
      : []),
    ...(sections.includes("Result areas")
      ? [
          "Result areas",
          ...RESULT_AREAS.filter((r) => areas.includes(r.id)).map(
            (r) => `  ${r.code}  ${r.name} — ${r.score} (${r.trend >= 0 ? "+" : ""}${r.trend}) ${bandOf(r.score, bandMode).label}`,
          ),
          "",
        ]
      : []),
    ...(sections.includes("National indicators")
      ? ["National indicators", "  Group Grievance (C3): 9.0 published, 2029 target 7.2 — lower is better.", "  Factionalized Elites (C2): 10.0 published, 2029 target 8.7.", ""]
      : []),
    ...(included.length
      ? [
          "Added from data explorer and analytics",
          ...included.flatMap((it) => [
            `  ${it.title} — ${it.summary}`,
            ...it.rows.map((r) => `    ${r.label}: ${r.value} (${r.note})`),
          ]),
          "",
        ]
      : []),
    ...(sections.includes("Decisions requested")
      ? ["Decisions requested", "  1. Release the emergency mediation grant for the Afgoye corridor.", "  2. Convene the land-tenure task force for PRJ-0155.", ""]
      : []),
    coverageLine,
  ];

  async function finish(kind: "pdf" | "word") {
    setBusy(true);
    await wait();
    if (kind === "pdf") downloadPDF(title, lines, `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    else downloadBlob(new Blob([`${title}\n\n${lines.join("\n")}`], { type: "application/msword" }), `${title.replace(/\s+/g, "-").toLowerCase()}.doc`);

    const id = `RPT-${period}-${String(saved.length + 1).padStart(2, "0")}`;
    db.setOne("reports", [
      { id, title, type: "Executive", period, status: "draft", pages: Math.max(1, sections.length * 2 + included.length), updated: new Date().toISOString().slice(0, 10) },
      ...saved,
    ]);
    logAct({
      actor,
      role,
      action: "report.build",
      target: id,
      note: `${sections.length} sections · ${areas.length} areas · ${included.length} added items`,
    });
    db.set<ReportItem>(ENTITY.reportItems, []);
    setDropped([]);
    setBusy(false);
    setBuilding(false);
    setStep(0);
    toast.success(`${id} saved and exported`);
  }

  const columns: Column<Saved>[] = [
    { key: "id", header: "Reference", value: (r) => r.id, cell: (r) => <span className="font-mono text-[12px]">{r.id}</span>, width: "170px" },
    { key: "title", header: "Title", value: (r) => r.title, cell: (r) => <span className="font-semibold text-[var(--pms-text-strong)]">{r.title}</span> },
    { key: "type", header: "Type", value: (r) => r.type },
    { key: "period", header: "Period", value: (r) => r.period, cell: (r) => fmtPeriod(r.period) },
    { key: "pages", header: "Pages", value: (r) => r.pages, align: "right" },
    { key: "updated", header: "Updated", value: (r) => r.updated, cell: (r) => fmtDate(r.updated) },
    { key: "status", header: "Status", value: (r) => r.status, cell: (r) => <Pill tone={TONE[r.status] ?? "neutral"}>{r.status}</Pill> },
  ];

  const STEPS = ["Period", "Result areas", "Sections", "Preview"];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title="Reports"
        meta="Build the quarterly report without retyping anything."
        actions={<Button className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => { setBuilding(true); setStep(0); }}>New report</Button>}
      />

      {building ? (
        <Panel>
          <PanelHead
            title="New report"
            action={
              <button type="button" onClick={() => setBuilding(false)} className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]">
                Cancel
              </button>
            }
          />

          <div className={cn("pb-4", GUTTER)}>
            <ol className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {STEPS.map((s, i) => (
                <li key={s} className={cn("flex min-w-0 items-center gap-1.5", i === step ? "flex-1" : "shrink-0")}>
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums"
                    style={toneStyle(i < step ? "success" : i === step ? "info" : "neutral")}
                  >
                    {i < step ? <iconify-icon icon="solar:check-read-linear" className="text-[12px]" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[12px]",
                      i === step ? "font-semibold text-[var(--pms-text-strong)]" : "hidden text-[var(--pms-muted-text)] sm:inline",
                    )}
                  >
                    {s}
                  </span>
                  {i < STEPS.length - 1 ? <span aria-hidden className="h-px w-3 shrink-0 bg-[var(--pms-divide)] sm:w-5" /> : null}
                </li>
              ))}
            </ol>
          </div>

          <Rule />

          <div className={cn("py-4", GUTTER)}>
            {step === 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL}>Title</span>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 rounded-[10px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL}>Period</span>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className={FORM_FIELD}>
                    {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {RESULT_AREAS.map((r) => (
                  <label
                    key={r.id}
                    className="flex min-w-0 items-center gap-2 rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-3.5 py-2.5 text-[13px] shadow-[var(--pms-card-shadow)]"
                  >
                    <Checkbox
                      checked={areas.includes(r.id)}
                      onCheckedChange={(v) => setAreas((prev) => (v ? [...prev, r.id] : prev.filter((x) => x !== r.id)))}
                    />
                    <span className="min-w-0 truncate">{r.code} — {r.name}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {SECTIONS.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-[13px] text-[var(--pms-text)]">
                      <Checkbox
                        checked={sections.includes(s)}
                        onCheckedChange={(v) => setSections((prev) => (v ? [...prev, s] : prev.filter((x) => x !== s)))}
                      />
                      {s}
                    </label>
                  ))}
                </div>
                <p className={CAPTION}>The coverage statement is inserted automatically and cannot be removed.</p>

                <div className="overflow-hidden rounded-2xl border border-[color:var(--pms-hairline-border)]">
                  <div className="flex items-center justify-between gap-2 border-b border-[color:var(--pms-divide)] bg-[var(--pms-cost-mini-bg)] px-4 py-2.5">
                    <span className="min-w-0 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">Added from data explorer and analytics</span>
                    <Pill tone={staged.length ? "info" : "neutral"}>{included.length} of {staged.length}</Pill>
                  </div>
                  {staged.length === 0 ? (
                    <p className={cn(CAPTION, "px-4 py-3")}>Nothing staged. Use Add to report on the data explorer or analytics page.</p>
                  ) : (
                    <ul className="flex flex-col">
                      {staged.map((it) => (
                        <li key={it.id} className="flex items-center gap-3 border-t border-[color:var(--pms-divide)] px-4 py-2.5 first:border-t-0">
                          <Checkbox
                            checked={!dropped.includes(it.id)}
                            onCheckedChange={(v) => setDropped((prev) => (v ? prev.filter((x) => x !== it.id) : [...prev, it.id]))}
                            aria-label={it.title}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{it.title}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-[var(--pms-muted-text)]">{it.summary} · {it.rows.length} rows</span>
                          </span>
                          <Pill tone="neutral">{it.source === "analytics" ? "Analytics" : "Data explorer"}</Pill>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 rounded-[var(--pms-radius-control)]"
                            onClick={() => {
                              db.remove(ENTITY.reportItems, it.id);
                              setDropped((prev) => prev.filter((x) => x !== it.id));
                              toast.success(`${it.id} removed`);
                            }}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] p-4 shadow-[var(--pms-card-shadow)]">
                <h3 className="text-[15px] font-semibold text-[var(--pms-text-strong)]">{title}</h3>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-sans text-[12.5px] leading-[1.6] text-[var(--pms-text)]">
                  {lines.join("\n")}
                </pre>
              </div>
            ) : null}
          </div>

          <Rule />

          <div className={cn("flex flex-wrap gap-2 py-4", GUTTER)}>
            <Button variant="outline" size="sm" className="h-9 rounded-[var(--pms-radius-control)]" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            {step < 3 ? (
              <Button size="sm" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <>
                <Button size="sm" className="h-9 rounded-[var(--pms-radius-control)]" disabled={busy} onClick={() => finish("pdf")}>Export PDF</Button>
                <Button size="sm" variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" disabled={busy} onClick={() => finish("word")}>Export Word</Button>
                <Button size="sm" variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => window.print()}>Print</Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-[var(--pms-radius-control)]"
                  onClick={() => { db.setOne("report_template", { title, period, areas, sections }); toast.success("Saved as a template"); }}
                >
                  Save as template
                </Button>
              </>
            )}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHead title="Saved reports" action={<span className={CAPTION}>{saved.length}</span>} />
        <DataTable
          rows={saved}
          columns={columns}
          pageSize={8}
          exportName="reports"
          searchPlaceholder="Search report, type or period…"
          onRowClick={(r) => { setTitle(r.title); setPeriod(r.period); setBuilding(true); setStep(3); }}
          empty="No reports yet"
        />
      </Panel>
    </div>
  );
}
