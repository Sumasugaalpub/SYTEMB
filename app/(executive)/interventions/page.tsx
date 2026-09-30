"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { INSTITUTIONS } from "@/data/institutions";
import { INDICATORS } from "@/data/indicators";
import { PERIODS } from "@/data/periods";
import { BENEFICIARY_GROUPS, PROJECT_TYPES, type BeneficiaryGroup, type Project, type ProjectType } from "@/data/projects";
import type { Evidence } from "@/data/evidence";
import { RESULT_AREAS } from "@/data/resultAreas";
import { DISTRICTS, REGIONS, STATES, regionsOfState, type StateId } from "@/data/geography";
import { VISIBILITY_META, VISIBILITY_ORDER, type Visibility } from "@/lib/visibility";
import { wait } from "@/lib/async";
import { MAX_UPLOAD_MB } from "@/lib/capture";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { fmtMoney } from "@/lib/format";
import { nextId } from "@/lib/ids";
import { roleById } from "@/data/users";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, Panel } from "@/components/pms/dashboard-sections";
import { PageHeader, Pill, type PillTone, printPage, useExportDialog } from "@/components/pms/ui";

const TONE: Record<Project["status"], PillTone> = {
  "on-track": "good",
  complete: "info",
  "at-risk": "warn",
  delayed: "bad",
};

const VISIBILITY_TONE: Record<Visibility, PillTone> = {
  public: "good",
  aggregated: "info",
  authorized: "warn",
  restricted: "bad",
};

const SELECT = "h-9 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-hairline-border)] bg-transparent px-2.5 text-[12.5px]";

export default function InterventionsPage() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const actor = roleById(role).name;
  const rows = useCollection<Project>(ENTITY.projects);
  const [lead, setLead] = React.useState("all");
  const [state, setState] = React.useState("all");
  // Page 5 links here with ?area=cl-0n — the filter opens on that area.
  const [area, setArea] = React.useState(() => {
    const from = params.get("area");
    return from && RESULT_AREAS.some((r) => r.id === from) ? from : "all";
  });
  const [period, setPeriod] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  // The dashboard links here with ?new=1 — the register form opens on mount.
  const [regOpen, setRegOpen] = React.useState(params.get("new") === "1");
  const [form, setForm] = React.useState({
    title: "",
    resultArea: RESULT_AREAS[0].id,
    type: PROJECT_TYPES[0] as ProjectType,
    visibility: "authorized" as Visibility,
    lead: "MOIFAR",
    partner: "",
    donor: "",
    budget: "",
    start: "",
    end: "",
    districts: "",
    formState: "south-west" as StateId,
    region: regionsOfState("south-west")[0].id,
    status: "on-track" as Project["status"],
    beneficiaries: "",
    groups: [] as BeneficiaryGroup[],
    kpis: [] as string[],
  });
  /** Evidence chosen in the registration form, filed as real items when the project saves. */
  const [files, setFiles] = React.useState<{ name: string; mb: string; image: boolean }[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [formKpiQuery, setFormKpiQuery] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [picker, setPicker] = React.useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  // A project matches a period when its delivery window overlaps that quarter.
  const window = PERIODS.find((q) => q.id === period);
  const filtered = rows.filter(
    (p) =>
      (lead === "all" || p.lead === lead) &&
      (state === "all" || p.states.includes(state)) &&
      (area === "all" || p.resultArea === area) &&
      (!window || (p.start <= window.end && p.end >= window.start)),
  );

  const valid = form.title.trim().length > 2 && Number(form.budget) > 0 && form.start && form.end && form.groups.length > 0;
  const formDistricts = form.districts ? form.districts.split(",").map((d) => d.trim()).filter(Boolean) : [];

  function toggleGroup(g: BeneficiaryGroup) {
    setForm((f) => ({ ...f, groups: f.groups.includes(g) ? f.groups.filter((x) => x !== g) : [...f.groups, g] }));
  }

  function toggleFormKpi(id: string) {
    setForm((f) => ({ ...f, kpis: f.kpis.includes(id) ? f.kpis.filter((x) => x !== id) : [...f.kpis, id] }));
  }

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

  async function register() {
    setSaving(true);
    await wait();
    const id = nextId("PRJ", 2026, 4);
    const districts = formDistricts;
    const matched = districts.map((d) => DISTRICTS.find((x) => x.name.toLowerCase() === d.toLowerCase())).find(Boolean);
    const region = matched?.region ?? form.region;
    const today = new Date().toISOString().slice(0, 10);

    // Every file named on the form becomes a real evidence item, linked to the project.
    const evidence = files.map((f) => {
      const eid = nextId("EV", 2026, 4);
      db.add<Evidence>(ENTITY.evidence, {
        id: eid,
        type: f.image ? "photo" : "report",
        title: f.name.replace(/\.[^.]+$/, ""),
        district: districts[0] ?? STATES.find((x) => x.id === form.formState)?.capital ?? "—",
        region,
        date: today,
        submittedBy: actor,
        visibility: form.visibility,
        resultArea: form.resultArea,
        linked: [id],
        size: f.mb,
        description: "Filed with the project registration.",
      });
      return eid;
    });

    db.add<Project>(ENTITY.projects, {
      id,
      title: form.title.trim(),
      resultArea: form.resultArea,
      type: form.type,
      region,
      visibility: form.visibility,
      evidence,
      lead: form.lead,
      partner: form.partner || "—",
      donor: form.donor || "—",
      states: [form.formState],
      districts,
      start: form.start,
      end: form.end,
      budget: Number(form.budget),
      spent: 0,
      status: form.status,
      progress: 0,
      beneficiaries: Number(form.beneficiaries) || 0,
      beneficiaryGroups: form.groups,
      kpis: form.kpis,
      description: "Registered from the interventions page.",
      risks: "—",
      lastUpdate: today,
    });
    logAct({
      actor,
      role,
      action: "project.register",
      target: id,
      note: `${form.title.trim()} · ${form.groups.join(" · ")} · ${form.kpis.length} indicators · ${evidence.length} evidence`,
    });
    setSaving(false);
    setForm({ ...form, title: "", budget: "", districts: "", beneficiaries: "", groups: [], kpis: [] });
    setFiles([]);
    setFormKpiQuery("");
    setRegOpen(false);
    toast.success(`${id} registered with ${form.kpis.length} linked indicators`);
  }

  const columns: Column<Project>[] = [
    { key: "id", header: "Reference", value: (p) => p.id, cell: (p) => <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{p.id}</span>, width: "104px" },
    { key: "title", header: "Name", value: (p) => p.title, cell: (p) => <span className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{p.title}</span> },
    { key: "area", header: "Theme", value: (p) => RESULT_AREAS.find((r) => r.id === p.resultArea)?.name ?? "" },
    { key: "type", header: "Type", value: (p) => p.type ?? "—" },
    { key: "lead", header: "Lead", value: (p) => p.lead },
    { key: "partner", header: "Partner", value: (p) => p.partner },
    { key: "donor", header: "Donor", value: (p) => p.donor },
    { key: "states", header: "States", value: (p) => (p.states ?? []).join(", ") },
    { key: "region", header: "Region", value: (p) => REGIONS.find((r) => r.id === p.region)?.name ?? p.region ?? "—" },
    { key: "districts", header: "Districts", value: (p) => (p.districts ?? []).join(", "), cell: (p) => <span className="text-[var(--pms-muted-text)]">{(p.districts ?? []).length}</span>, align: "right" },
    { key: "period", header: "Period", value: (p) => `${p.start} – ${p.end}` },
    { key: "budget", header: "Funding", value: (p) => p.budget, align: "right", cell: (p) => fmtMoney(p.budget) },
    { key: "beneficiaries", header: "Beneficiaries", value: (p) => p.beneficiaries, align: "right" },
    {
      key: "groups",
      header: "Beneficiary groups",
      width: "210px",
      value: (p) => (p.beneficiaryGroups ?? []).join(" · "),
      cell: (p) =>
        (p.beneficiaryGroups ?? []).length ? (
          <span className="flex flex-wrap gap-1">
            {(p.beneficiaryGroups ?? []).map((g) => (
              <Pill key={g} tone="neutral">{g}</Pill>
            ))}
          </span>
        ) : (
          <span className="text-[var(--pms-muted-text)]">—</span>
        ),
    },
    { key: "kpis", header: "Indicators", value: (p) => (p.kpis ?? []).length, align: "right" },
    {
      key: "evidence",
      header: "Evidence",
      value: (p) => (p.evidence ?? []).length,
      align: "right",
      cell: (p) =>
        (p.evidence ?? []).length ? (p.evidence ?? []).length : <span className="text-[var(--pms-muted-text)]">0</span>,
    },
    { key: "progress", header: "Progress", value: (p) => p.progress, align: "right", cell: (p) => `${p.progress}%` },
    { key: "status", header: "Status", value: (p) => p.status, cell: (p) => <Pill tone={TONE[p.status]}>{p.status}</Pill> },
    {
      key: "visibility",
      header: "Visibility",
      value: (p) => VISIBILITY_META[p.visibility ?? "authorized"].label,
      cell: (p) => <Pill tone={VISIBILITY_TONE[p.visibility ?? "authorized"]}>{VISIBILITY_META[p.visibility ?? "authorized"].label}</Pill>,
    },
    {
      key: "actions",
      header: "",
      value: () => "",
      align: "right",
      cell: (p) => (
        <span className="flex justify-end gap-1">
          <Button size="sm" variant="outline" className="h-8 rounded-[var(--pms-radius-control)]" onClick={(e) => { e.stopPropagation(); setPicker(p.id); }}>
            Link indicator
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-[var(--pms-radius-control)]" onClick={(e) => { e.stopPropagation(); router.push(`/map?project=${p.id}`); }}>
            Map
          </Button>
        </span>
      ),
    },
  ];

  const target = rows.find((p) => p.id === picker);
  const pickerFiltered = INDICATORS.filter(
    (k) => !pickerQuery.trim() || `${k.id} ${k.name}`.toLowerCase().includes(pickerQuery.trim().toLowerCase()),
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="Interventions"
        meta="Every project, and which indicators it is meant to move."
        actions={
          <Dialog open={regOpen} onOpenChange={setRegOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-[var(--pms-radius-control)]">Register project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register a project</DialogTitle>
              </DialogHeader>
              <p className="-mt-2 text-[12px] text-[var(--pms-muted-text)]">
                The registry's eighteen fields. The reference is issued on save.
              </p>

              <div className="-mx-6 max-h-[62vh] overflow-y-auto px-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["title", "Name", "text"],
                    ["partner", "Implementing partner", "text"],
                    ["donor", "Donor", "text"],
                    ["budget", "Funding (USD)", "number"],
                    ["beneficiaries", "Beneficiaries (count)", "number"],
                    ["start", "Start", "date"],
                    ["end", "End", "date"],
                    ["districts", "Districts (comma separated)", "text"],
                  ].map(([k, label, type]) => (
                    <label key={k} className={k === "title" || k === "districts" ? "col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                      <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">{label}</span>
                      <Input
                        type={type}
                        value={String(form[k as keyof typeof form] ?? "")}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                        className="h-9 rounded-[10px]"
                      />
                    </label>
                  ))}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Result area</span>
                    <select className={SELECT} value={form.resultArea} onChange={(e) => setForm({ ...form, resultArea: e.target.value })}>
                      {RESULT_AREAS.map((r) => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Type</span>
                    <select className={SELECT} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}>
                      {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">State</span>
                    <select
                      className={SELECT}
                      value={form.formState}
                      onChange={(e) => {
                        const next = e.target.value as StateId;
                        setForm({ ...form, formState: next, region: regionsOfState(next)[0]?.id ?? "" });
                      }}
                    >
                      {STATES.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Region</span>
                    <select className={SELECT} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                      {regionsOfState(form.formState).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Status</span>
                    <select className={SELECT} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}>
                      {(["on-track", "at-risk", "delayed", "complete"] as Project["status"][]).map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Public visibility</span>
                    <select className={SELECT} value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}>
                      {VISIBILITY_ORDER.map((v) => <option key={v} value={v}>{VISIBILITY_META[v].label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Lead institution</span>
                    <select className={SELECT} value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })}>
                      {INSTITUTIONS.map((i) => <option key={i.id} value={i.acronym}>{i.acronym}</option>)}
                    </select>
                  </label>

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Beneficiary groups</span>
                    <div className="flex flex-wrap gap-3">
                      {BENEFICIARY_GROUPS.map((g) => (
                        <label key={g} className="flex items-center gap-2 text-[12.5px] text-[var(--pms-text)]">
                          <Checkbox checked={form.groups.includes(g)} onCheckedChange={() => toggleGroup(g)} aria-label={g} />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">
                      Linked indicators <span className="font-normal text-[var(--pms-muted-text)]">({form.kpis.length} of {INDICATORS.length})</span>
                    </span>
                    <Input
                      value={formKpiQuery}
                      onChange={(e) => setFormKpiQuery(e.target.value)}
                      placeholder="Search all 73 indicators…"
                      className="h-9 rounded-[10px]"
                    />
                    <ul className="max-h-40 overflow-y-auto rounded-[10px] border border-[color:var(--pms-hairline-border)]">
                      {INDICATORS.filter(
                        (k) =>
                          !formKpiQuery.trim() ||
                          `${k.id} ${k.name}`.toLowerCase().includes(formKpiQuery.trim().toLowerCase()),
                      ).map((k) => (
                        <li key={k.id}>
                          <button
                            type="button"
                            onClick={() => toggleFormKpi(k.id)}
                            className="flex w-full items-center gap-2.5 border-b border-[color:var(--pms-divide)] px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-[var(--pms-row-hover)]"
                          >
                            <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{k.id}</span>
                            <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--pms-text)]">{k.name}</span>
                            <iconify-icon
                              icon={form.kpis.includes(k.id) ? "solar:check-circle-bold" : "solar:add-circle-linear"}
                              className="text-[17px] text-[var(--pms-icon-info-fg)]"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Evidence</span>
                    <input ref={fileRef} type="file" multiple hidden onChange={pickFiles} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-[var(--pms-radius-control)]" onClick={() => fileRef.current?.click()}>
                        Attach evidence
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
              </div>

              {!valid ? (
                <p className="text-[12px] font-medium text-[var(--pms-icon-danger-fg)]">
                  A name, a funding amount, both dates and at least one beneficiary group are required.
                </p>
              ) : null}
              <DialogFooter>
                <Button disabled={!valid || saving} onClick={register}>{saving ? "Saving…" : "Register"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* One register card: the filter bar sits in its header, the table below it. */}
      <Panel>
        <div className={cn("flex flex-wrap items-center gap-2 pb-3 pt-5", GUTTER)}>
          <h2 className="mr-auto text-[15px] font-semibold text-[var(--pms-text-strong)]">Project register</h2>
          <select aria-label="Lead institution" className={SELECT} value={lead} onChange={(e) => setLead(e.target.value)}>
            <option value="all">All leads</option>
            {[...new Set(rows.map((p) => p.lead))].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select aria-label="State" className={SELECT} value={state} onChange={(e) => setState(e.target.value)}>
            <option value="all">All states</option>
            {STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select aria-label="Result area" className={SELECT} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">All result areas</option>
            {RESULT_AREAS.map((r) => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
          </select>
          <select aria-label="Period" className={SELECT} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">All periods</option>
            {PERIODS.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
          </select>
          <span className="text-[12px] tabular-nums text-[var(--pms-muted-text)]">{filtered.length} of {rows.length}</span>
        </div>

        <div className="border-t border-[color:var(--pms-divide)]" />

        <DataTable
          rows={filtered}
          columns={columns}
          loading={loading}
          pageSize={8}
          exportName="interventions"
          searchPlaceholder="Search project, lead or donor…"
          onRowClick={(p) => router.push(`/interventions/${p.id}`)}
          empty="No projects match those filters"
        />
      </Panel>

      <Dialog open={Boolean(picker)} onOpenChange={(v) => { if (!v) { setPicker(null); setPickerQuery(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link an indicator to {target?.id}</DialogTitle>
          </DialogHeader>
          <Input
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder={`Search all ${INDICATORS.length} indicators…`}
            className="h-9 rounded-[10px]"
          />
          <p className="-mt-1 text-[11.5px] text-[var(--pms-muted-text)]">
            {pickerFiltered.length} of {INDICATORS.length} indicators · {target?.kpis.length ?? 0} linked
          </p>
          <ul className="-mx-6 max-h-[50vh] overflow-y-auto">
            {pickerFiltered.map((k) => {
              const linked = target?.kpis.includes(k.id);
              return (
                <li key={k.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!target) return;
                      db.update<Project>(ENTITY.projects, target.id, {
                        kpis: linked ? target.kpis.filter((x) => x !== k.id) : [...target.kpis, k.id],
                      });
                      logAct({ actor, role, action: linked ? "project.unlink" : "project.link", target: `${target.id}/${k.id}`, note: k.name });
                      toast.success(linked ? "Unlinked" : "Linked");
                    }}
                    className="flex w-full items-center gap-3 border-b border-[color:var(--pms-divide)] px-6 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--pms-row-hover)]"
                  >
                    <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{k.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--pms-text)]">{k.name}</span>
                    <iconify-icon
                      icon={linked ? "solar:check-circle-bold" : "solar:add-circle-linear"}
                      className="text-[18px] text-[var(--pms-icon-info-fg)]"
                    />
                  </button>
                </li>
              );
            })}
            {pickerFiltered.length === 0 ? (
              <li className="px-6 py-4 text-[12.5px] text-[var(--pms-muted-text)]">No indicator matches that search.</li>
            ) : null}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
