"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { INCIDENT_CAUSES, type Incident } from "@/data/alerts";
import type { Evidence } from "@/data/evidence";
import { DISTRICTS, REGIONS, regionById } from "@/data/geography";
import { PERIODS } from "@/data/periods";
import { roleById } from "@/data/users";
import { wait } from "@/lib/async";
import { MAX_UPLOAD_MB } from "@/lib/capture";
import { escalateIncident } from "@/lib/alert-actions";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { fmtDate } from "@/lib/format";
import { nextId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { useSuppressionThreshold } from "@/lib/settings";
import { isSuppressed } from "@/lib/suppression";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SomaliaMap } from "@/components/map/SomaliaMap";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GHOST_BUTTON, GUTTER, PANEL_BODY, Panel, PanelHead, Rule } from "@/components/pms/dashboard-sections";
import { PageHeader, Pill, type PillTone, printPage, useExportDialog } from "@/components/pms/ui";

const STATUS: Record<Incident["status"], PillTone> = { mediated: "good", ongoing: "bad", resolved: "info" };
const STATUS_TONE: Record<Incident["status"], string> = { mediated: "success", ongoing: "danger", resolved: "info" };
const TYPES = ["Grazing land", "Water point", "Land / housing", "Clan clash", "Eviction", "Revenge killing", "Checkpoint", "Other"];
const SELECT =
  "h-8 min-w-0 max-w-full rounded-[var(--pms-radius-control)] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-surface)] px-2 text-[12px] text-[var(--pms-text)]";
const FORM_SELECT = "h-9 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-hairline-border)] bg-transparent px-2.5 text-[12.5px]";

/** One hairline detail row: tinted square left, 13px label, value right. */
function DetailRow({
  icon,
  tone,
  label,
  meta,
  value,
}: {
  icon: string;
  tone: string;
  label: string;
  meta?: string;
  value: React.ReactNode;
}) {
  return (
    <li className={cn("flex items-center gap-3 border-t border-[color:var(--pms-divide)] py-2.5 first:border-t-0", GUTTER)}>
      <span
        className="grid size-7 shrink-0 place-items-center rounded-[9px]"
        style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
      >
        <iconify-icon icon={icon} className="text-[15px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{label}</span>
        {meta ? <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">{meta}</span> : null}
      </span>
      <span className="min-w-0 shrink-0 text-right text-[13px] font-semibold tabular-nums text-[var(--pms-text-strong)]">
        {value}
      </span>
    </li>
  );
}

export default function ConflictNavigator() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const actor = roleById(role).name;
  const rows = useCollection<Incident>(ENTITY.incidents);
  const threshold = useSuppressionThreshold();
  const evidence = useCollection<Evidence>(ENTITY.evidence);
  const [type, setType] = React.useState("all");
  const [region, setRegion] = React.useState("all");
  const [district, setDistrict] = React.useState("all");
  const [period, setPeriod] = React.useState("all");
  const [agreement, setAgreement] = React.useState("all");
  const [open, setOpen] = React.useState<string | null>(null);
  // "Create incident report" on the dashboard opens this form on arrival.
  const [createOpen, setCreateOpen] = React.useState(params.get("new") === "1");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    type: TYPES[0],
    district: "Berdale",
    date: "2026-05-20",
    fatalities: 0,
    displaced: 0,
    cause: INCIDENT_CAUSES[0] as string,
  });
  /** Evidence chosen on the report form, filed as real items when the incident saves. */
  const [files, setFiles] = React.useState<{ name: string; mb: string; image: boolean }[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const key = (name: string) => name.trim().toLowerCase();

  /**
   * District options follow the selected region. The list is built from the
   * national district register plus any district that has actually reported an
   * incident, so a district recorded from the field is never missing from its
   * own filter.
   */
  const districtOptions = React.useMemo(() => {
    const regionOf = (name: string) =>
      DISTRICTS.find((d) => key(d.name) === key(name))?.region ??
      rows.find((i) => key(i.district) === key(name))?.region ??
      "";
    const names = new Set<string>([...DISTRICTS.map((d) => d.name), ...rows.map((i) => i.district)]);
    return [...names]
      .filter((name) => region === "all" || regionOf(name) === region)
      .sort((a, b) => a.localeCompare(b));
  }, [region, rows]);

  const window = PERIODS.find((q) => q.id === period);

  const filtered = rows.filter(
    (i) =>
      (type === "all" || i.type === type) &&
      (region === "all" || i.region === region) &&
      (district === "all" || key(i.district) === key(district)) &&
      (!window || (i.date >= window.start && i.date <= window.end)) &&
      (agreement === "all" || (agreement === "yes" ? i.status === "mediated" || i.status === "resolved" : i.status === "ongoing")),
  );

  // The map follows the same filters: it focuses the state the region or district sits in.
  const districtRegion =
    district === "all"
      ? ""
      : DISTRICTS.find((d) => key(d.name) === key(district))?.region ??
        rows.find((i) => key(i.district) === key(district))?.region ??
        "";
  const focusRegion = district !== "all" ? districtRegion || region : region;
  const focusState = !focusRegion || focusRegion === "all" ? undefined : regionById(focusRegion)?.state;

  // The map hands back a state id for states that withhold district names — ignore those.
  const pickFromMap = (id: string) => { if (REGIONS.some((r) => r.id === id)) pickRegion(id); };

  /** A new region always clears the district — the old one belongs to another region. */
  function pickRegion(next: string) {
    setRegion(next);
    setDistrict("all");
  }

  const inc = rows.find((i) => i.id === open);

  /** Evidence filed with the report, plus anything later linked to the reference. */
  const evidenceOf = React.useCallback(
    (i: Incident) => {
      const ids = new Set(i.evidence ?? []);
      evidence.filter((e) => e.linked.includes(i.id)).forEach((e) => ids.add(e.id));
      return [...ids];
    },
    [evidence],
  );

  // Selecting a row paints that incident's region on the map; otherwise the map
  // paints whatever the district or region filter has narrowed the page to.
  const highlight = inc?.region ?? (focusRegion && focusRegion !== "all" ? focusRegion : null);
  const mapState = highlight ? regionById(highlight)?.state : focusState;

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!chosen.length) return;
    const tooBig = chosen.find((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (tooBig) return toast.error(`${tooBig.name} is larger than ${MAX_UPLOAD_MB} MB.`);
    setFiles((list) => [
      ...list,
      ...chosen.map((f) => ({ name: f.name, mb: `${(f.size / 1024 / 1024).toFixed(1)} MB`, image: f.type.startsWith("image/") })),
    ]);
  }

  async function create() {
    setBusy(true);
    await wait();
    const d = DISTRICTS.find((x) => x.name === form.district);
    const region = d?.region ?? "bay";
    const id = nextId("INC", 2026, 4);

    // Each attached file becomes a real evidence item, linked to the incident.
    const evidenceIds = files.map((f) => {
      const eid = nextId("EV", 2026, 4);
      db.add<Evidence>(ENTITY.evidence, {
        id: eid,
        type: f.image ? "photo" : "report",
        title: f.name.replace(/\.[^.]+$/, ""),
        district: form.district,
        region,
        date: form.date,
        submittedBy: actor,
        visibility: "authorized",
        resultArea: "cl-02",
        linked: [id],
        size: f.mb,
        description: "Filed with the incident report. No names of people are stored.",
      });
      return eid;
    });

    db.add<Incident>(ENTITY.incidents, {
      id,
      date: form.date,
      district: form.district,
      region,
      type: form.type,
      fatalities: Number(form.fatalities),
      displaced: Number(form.displaced),
      status: "ongoing",
      lng: 43.53,
      lat: 3.21,
      cause: form.cause,
      evidence: evidenceIds,
    });
    logAct({
      actor,
      role,
      action: "incident.create",
      target: id,
      note: `${form.type} in ${form.district} · ${form.cause} · ${evidenceIds.length} evidence`,
    });
    setBusy(false);
    setFiles([]);
    setCreateOpen(false);
    toast.success(`${id} recorded${evidenceIds.length ? ` with ${evidenceIds.length} evidence item${evidenceIds.length > 1 ? "s" : ""}` : ""}`);
  }

  const people = (n: number) =>
    isSuppressed(n, true, threshold) ? (
      <span className="text-[11px] font-normal text-[var(--pms-muted-text)]">suppressed</span>
    ) : (
      n
    );

  const columns: Column<Incident>[] = [
    {
      key: "id",
      header: "Reference",
      value: (i) => i.id,
      width: "128px",
      cell: (i) => (
        <span className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: `var(--pms-icon-${STATUS_TONE[i.status]}-fg)` }}
            aria-hidden
          />
          <span className={cn("font-mono text-[12px]", open === i.id && "font-semibold text-[var(--pms-text-strong)]")}>
            {i.id}
          </span>
        </span>
      ),
    },
    { key: "date", header: "Date", value: (i) => i.date, cell: (i) => <span className="text-[12.5px] tabular-nums">{fmtDate(i.date)}</span> },
    { key: "district", header: "District", value: (i) => i.district, cell: (i) => <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{i.district}</span> },
    { key: "region", header: "Region", value: (i) => REGIONS.find((r) => r.id === i.region)?.name ?? i.region },
    { key: "type", header: "Type", value: (i) => i.type },
    { key: "fatalities", header: "Hurt or killed", value: (i) => i.fatalities, align: "right", cell: (i) => people(i.fatalities) },
    { key: "displaced", header: "Displaced", value: (i) => i.displaced, align: "right", cell: (i) => people(i.displaced) },
    { key: "status", header: "Agreement", value: (i) => i.status, cell: (i) => <Pill tone={STATUS[i.status]}>{i.status}</Pill> },
    {
      key: "evidence",
      header: "Evidence",
      align: "right",
      value: (i) => evidenceOf(i).length,
      cell: (i) => {
        const n = evidenceOf(i).length;
        return n ? (
          <span className="tabular-nums text-[var(--pms-text)]">{n}</span>
        ) : (
          <span className="text-[var(--pms-muted-text)]">—</span>
        );
      },
    },
  ];

  const scope = district !== "all" ? district : region !== "all" ? regionById(region)?.name ?? region : "";

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="Conflict navigator"
        meta="Incidents and reconciliation events, as reported by districts."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-[var(--pms-radius-control)]">Create incident</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record an incident</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Type</span>
                  <select className={FORM_SELECT} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">District</span>
                  <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="h-9 rounded-[10px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Date</span>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 rounded-[10px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Hurt or killed</span>
                  <Input type="number" min={0} value={form.fatalities} onChange={(e) => setForm({ ...form, fatalities: Number(e.target.value) })} className="h-9 rounded-[10px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Displaced</span>
                  <Input type="number" min={0} value={form.displaced} onChange={(e) => setForm({ ...form, displaced: Number(e.target.value) })} className="h-9 rounded-[10px]" />
                </label>
                <label className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Cause</span>
                  <select className={FORM_SELECT} value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })}>
                    {INCIDENT_CAUSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Evidence</span>
                  <input ref={fileRef} type="file" multiple hidden onChange={pickFiles} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-[var(--pms-radius-control)]" onClick={() => fileRef.current?.click()}>
                      Upload evidence
                    </Button>
                    <span className="text-[11.5px] text-[var(--pms-muted-text)]">
                      {files.length ? `${files.length} file${files.length > 1 ? "s" : ""} — filed on save` : "None attached"}
                    </span>
                  </div>
                  {files.length ? (
                    <ul className="flex flex-col gap-1">
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-[12px] text-[var(--pms-text)]">
                          <iconify-icon icon={f.image ? "solar:camera-linear" : "solar:file-text-linear"} className="text-[15px] text-[var(--pms-muted-text)]" />
                          <span className="min-w-0 flex-1 truncate">{f.name}</span>
                          <span className="text-[11px] text-[var(--pms-muted-text)]">{f.mb}</span>
                          <button
                            type="button"
                            onClick={() => setFiles((list) => list.filter((_, x) => x !== i))}
                            className="text-[11.5px] text-[var(--pms-muted-text)] underline-offset-4 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              <p className="text-[11.5px] text-[var(--pms-muted-text)]">No names of people are stored. Counts of people below {threshold} are suppressed on publication.</p>
              <DialogFooter>
                <Button disabled={busy} onClick={create}>{busy ? "Saving…" : "Record"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHead
            title="Incidents"
            className="pb-2"
            action={
              <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--pms-muted-text)]">
                {filtered.length} of {rows.length}
                {scope ? ` · ${scope}` : ""}
              </span>
            }
          />
          <div className={cn("flex flex-wrap items-center gap-1.5 pb-3", GUTTER)}>
            <select className={SELECT} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
              <option value="all">All types</option>
              {[...new Set(rows.map((i) => i.type))].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className={SELECT} value={region} onChange={(e) => pickRegion(e.target.value)} aria-label="Region">
              <option value="all">All regions</option>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className={SELECT} value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="District">
              <option value="all">All districts</option>
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className={SELECT} value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
              <option value="all">All periods</option>
              {PERIODS.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
            </select>
            <select className={SELECT} value={agreement} onChange={(e) => setAgreement(e.target.value)} aria-label="Agreement">
              <option value="all">Agreement: any</option>
              <option value="yes">Agreement reached</option>
              <option value="no">Still open</option>
            </select>
          </div>
          <Rule />
          <DataTable
            rows={filtered}
            columns={columns}
            loading={loading}
            pageSize={9}
            exportName="incidents"
            searchPlaceholder="Search district, type or reference…"
            onRowClick={(i) => setOpen(i.id)}
            empty="No incidents match those filters"
          />
        </Panel>

        <div className="flex min-w-0 flex-col gap-3 lg:gap-4 xl:col-span-5">
          <Panel>
            <PanelHead
              title="Where"
              action={
                focusState || window ? (
                  <button
                    type="button"
                    onClick={() => { setRegion("all"); setDistrict("all"); setPeriod("all"); }}
                    className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]"
                  >
                    Clear
                  </button>
                ) : undefined
              }
            />
            <div className={PANEL_BODY}>
              <div className={cn("relative", GUTTER)}>
                <SomaliaMap
                  key={mapState ?? "all"}
                  height={280}
                  focusState={mapState}
                  regionColor={highlight ? (id) => (id === highlight ? (inc ? "var(--pms-icon-danger-fg)" : "var(--pms-primary)") : undefined) : undefined}
                  regionTooltip={
                    highlight
                      ? (id) =>
                          id === highlight
                            ? inc
                              ? [`${inc.id} · ${inc.type}`, `${inc.district} · ${fmtDate(inc.date)}`]
                              : [
                                  district !== "all" ? district : regionById(highlight)?.name ?? highlight,
                                  `${filtered.length} incident${filtered.length === 1 ? "" : "s"} in view`,
                                ]
                            : undefined
                      : undefined
                  }
                  onSelectRegion={pickFromMap}
                />
              </div>
              <p className={cn("mt-auto pb-5 pt-3 text-[11px] leading-[1.5] text-[var(--pms-muted-text)]", GUTTER)}>
                {filtered.length} of {rows.length} in view
                {focusState ? ` · ${district !== "all" ? district : regionById(focusRegion)?.name ?? focusRegion}` : ""}
                {window ? ` · ${window.label}` : ""}
                {inc ? ` · ${inc.id} highlighted` : ""} · Boundaries are indicative only and imply no official
                endorsement.
              </p>
            </div>
          </Panel>

          {inc ? (
            <Panel>
              <PanelHead
                title={inc.id}
                action={
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]"
                  >
                    Close
                  </button>
                }
              />
              <div className={PANEL_BODY}>
                <div className={cn("flex items-center gap-3 pb-3", GUTTER)}>
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-[10px]"
                    style={{ backgroundColor: "var(--pms-icon-warning-bg)", color: "var(--pms-icon-warning-fg)" }}
                  >
                    <iconify-icon icon="solar:danger-triangle-linear" className="text-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{inc.type}</span>
                    <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">
                      {inc.district} · {fmtDate(inc.date)}
                    </span>
                  </span>
                  <Pill tone={STATUS[inc.status]}>{inc.status}</Pill>
                </div>

                <ul className="flex flex-col">
                  <DetailRow icon="solar:heart-pulse-linear" tone="danger" label="Hurt or killed" value={people(inc.fatalities)} />
                  <DetailRow icon="solar:walking-linear" tone="warning" label="Displaced" value={people(inc.displaced)} />
                  <DetailRow icon="solar:question-circle-linear" tone="neutral" label="Cause" value={<span className="text-[12.5px]">{inc.cause ?? "Not recorded"}</span>} />
                  <DetailRow
                    icon="solar:folder-with-files-linear"
                    tone="info"
                    label="Evidence"
                    meta={evidenceOf(inc).length ? evidenceOf(inc).join(", ") : undefined}
                    value={evidenceOf(inc).length || "—"}
                  />
                </ul>

                <div className={cn("mt-auto flex flex-wrap gap-2 pb-5 pt-4", GUTTER)}>
                  <button type="button" className={GHOST_BUTTON} onClick={() => router.push(`/evidence?district=${inc.district}`)}>
                    View evidence
                    <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
                  </button>
                  <Button
                    size="sm"
                    className="h-9 rounded-[var(--pms-radius-control)]"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await wait(600);
                      const res = escalateIncident(inc, actor, role);
                      setBusy(false);
                      if (!res.ok) return toast.error(res.error);
                      toast.success(`Escalated — alert ${res.alert.id} opened`);
                      router.push("/early-warning");
                    }}
                  >
                    Escalate to early warning
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
