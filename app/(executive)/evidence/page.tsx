"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EVIDENCE_GROUPS, evidenceGroupCount, type Evidence } from "@/data/evidence";
import { EVIDENCE_TYPES, type EvidenceTypeId } from "@/data/evidenceTypes";
import { DISTRICTS } from "@/data/geography";
import { INDICATORS } from "@/data/indicators";
import { RESULT_AREAS } from "@/data/resultAreas";
import { roleById, USERS } from "@/data/users";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { checkFile, compressImage } from "@/lib/capture";
import { db } from "@/lib/db";
import { downloadBlob } from "@/lib/download";
import { ENTITY } from "@/lib/entities";
import { fmtDate } from "@/lib/format";
import { nextId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { canSee, VISIBILITY_ORDER, type Visibility } from "@/lib/visibility";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GUTTER, GHOST_BUTTON, Panel, PanelHead, Rule, TabTrack } from "@/components/pms/dashboard-sections";
import { CAPTION, CounterTile, DefGrid, FIELD_LABEL, FORM_FIELD, TILE_TONE, TOOLBAR_FIELD, Toolbar, toneStyle } from "@/components/pms/exec-kit";
import { EmptyState, PageHeader, Pill, type PillTone, printPage, useExportDialog } from "@/components/pms/ui";
import { SkeletonRows } from "@/components/system/Skeleton";

const VIS_TONE: Record<Visibility, PillTone> = { public: "good", aggregated: "info", authorized: "warn", restricted: "bad" };
const CATEGORY_TONE: Record<string, PillTone> = { Reports: "info", Evidence: "accent", Knowledge: "good" };
const TH = "px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--pms-muted-text)] sm:px-6";
const TD = "px-5 py-2.5 text-[13px] text-[var(--pms-text)] sm:px-6";

export default function EvidenceLibrary() {
  const [openExport, exportDialog] = useExportDialog();
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const clearance = roleById(role).clearance;
  const actor = roleById(role).name;
  const rows = useCollection<Evidence>(ENTITY.evidence);

  const [type, setType] = React.useState(params.get("type") ?? "all");
  const [area, setArea] = React.useState("all");
  const [vis, setVis] = React.useState("all");
  // The conflict navigator links here with ?district=<name>.
  const [district, setDistrict] = React.useState(params.get("district") ?? "all");
  const [indicator, setIndicator] = React.useState("all");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [open, setOpen] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [approver, setApprover] = React.useState("");
  const [nextVis, setNextVis] = React.useState<Visibility>("public");
  // The dashboard links here with ?upload=1 — the form opens on mount.
  const [uploadOpen, setUploadOpen] = React.useState(params.get("upload") === "1");
  const [up, setUp] = React.useState({
    title: "",
    type: "report" as EvidenceTypeId,
    indicator: "",
    district: "Berdale",
    visibility: "authorized" as Visibility,
  });
  const [upFile, setUpFile] = React.useState<{ file: File; mb: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const visible = rows.filter((e) => canSee(clearance, e.visibility));
  const filtered = visible.filter(
    (e) =>
      (type === "all" || e.type === type) &&
      (area === "all" || e.resultArea === area) &&
      (vis === "all" || e.visibility === vis) &&
      (district === "all" || e.district === district) &&
      (indicator === "all" || e.linked.includes(indicator)),
  );
  const item = rows.find((e) => e.id === open);

  /** Districts that actually hold something, so the filter never offers an empty list. */
  const districtOptions = [...new Set(rows.map((e) => e.district))].sort((a, b) => a.localeCompare(b));
  /** Indicators something in the library is filed against. */
  const indicatorOptions = INDICATORS.filter((k) => rows.some((e) => e.linked.includes(k.id)));

  const counts = EVIDENCE_GROUPS.map((g) => ({ ...g, n: evidenceGroupCount(g, rows) }));
  const countTotal = Math.max(1, counts.reduce((a, c) => a + c.n, 0));

  function pickUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const bad = checkFile(file, file.type.startsWith("image/") ? "image" : "doc");
    if (bad) return toast.error(bad);
    setUpFile({ file, mb: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
    setUp((f) => ({
      ...f,
      title: f.title || file.name.replace(/\.[^.]+$/, ""),
      type: file.type.startsWith("image/") ? "photo" : f.type,
    }));
  }

  const uploadValid = Boolean(up.title.trim() && up.district && upFile);

  async function submitUpload() {
    if (!upFile) return;
    setBusy(true);
    await wait();
    if (upFile.file.type.startsWith("image/")) await compressImage(upFile.file);
    const id = nextId("EV", 2026, 4);
    const region = DISTRICTS.find((d) => d.name === up.district)?.region ?? "bay";
    const linkedIndicator = INDICATORS.find((k) => k.id === up.indicator);
    db.add<Evidence>(ENTITY.evidence, {
      id,
      type: up.type,
      title: up.title.trim(),
      district: up.district,
      region,
      date: new Date().toISOString().slice(0, 10),
      submittedBy: actor,
      visibility: up.visibility,
      resultArea: linkedIndicator?.resultArea ?? RESULT_AREAS[1].id,
      linked: up.indicator ? [up.indicator] : [],
      size: upFile.mb,
      description: `Uploaded from the evidence library as ${EVIDENCE_TYPES.find((t) => t.id === up.type)?.label}. Location metadata removed on upload.`,
    });
    logAct({
      actor,
      role,
      action: "evidence.upload",
      target: id,
      note: `${up.title.trim()} · ${up.type} · ${up.district} · ${up.indicator || "no indicator"}`,
    });
    setBusy(false);
    setUpFile(null);
    setUp({ title: "", type: "report", indicator: "", district: "Berdale", visibility: "authorized" });
    setUploadOpen(false);
    toast.success(`${id} filed — location metadata removed`);
  }

  function download(ev: Evidence) {
    downloadBlob(
      new Blob([`${ev.id}\n${ev.title}\n${ev.district} · ${ev.date}\n${ev.description}`], { type: "text/plain" }),
      `${ev.id}.txt`,
    );
    logAct({ actor, role, action: "evidence.download", target: ev.id, note: ev.title });
    toast.success("Downloaded and recorded");
  }

  function changeVisibility(ev: Evidence) {
    if (!reason.trim()) return toast.error("A visibility change needs a reason.");
    if (!approver) return toast.error("A second approver must countersign a visibility change.");
    db.update<Evidence>(ENTITY.evidence, ev.id, { visibility: nextVis });
    logAct({
      actor,
      role,
      action: "evidence.visibility",
      target: ev.id,
      note: `${ev.visibility} → ${nextVis} — ${reason.trim()} — approved by ${approver}`,
    });
    setReason("");
    setApprover("");
    toast.success(`Visibility changed to ${nextVis}, countersigned by ${approver}`);
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}

      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="Evidence library"
        meta="Every document, photograph and dataset behind a reported number."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 rounded-[var(--pms-radius-control)]">
              <Link href="/verify?mode=generate">Generate QR</Link>
            </Button>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 rounded-[var(--pms-radius-control)]">Upload evidence</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Upload evidence</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className={FIELD_LABEL}>Title</span>
                    <Input value={up.title} onChange={(e) => setUp({ ...up, title: e.target.value })} className="h-9 rounded-[10px]" />
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                      <span className={FIELD_LABEL}>Type</span>
                      <select className={FORM_FIELD} value={up.type} onChange={(e) => setUp({ ...up, type: e.target.value as EvidenceTypeId })}>
                        {EVIDENCE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} — {t.category}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className={FIELD_LABEL}>District</span>
                      <select className={FORM_FIELD} value={up.district} onChange={(e) => setUp({ ...up, district: e.target.value })}>
                        {DISTRICTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className={FIELD_LABEL}>Linked indicator</span>
                    <select className={FORM_FIELD} value={up.indicator} onChange={(e) => setUp({ ...up, indicator: e.target.value })}>
                      <option value="">Not linked yet</option>
                      {INDICATORS.map((k) => <option key={k.id} value={k.id}>{k.id} — {k.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={FIELD_LABEL}>Visibility</span>
                    <select className={FORM_FIELD} value={up.visibility} onChange={(e) => setUp({ ...up, visibility: e.target.value as Visibility })}>
                      {VISIBILITY_ORDER.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <span className={FIELD_LABEL}>File</span>
                    <input ref={fileRef} type="file" hidden onChange={pickUploadFile} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-[var(--pms-radius-control)]" onClick={() => fileRef.current?.click()}>
                        Choose a file
                      </Button>
                      <span className={CAPTION}>{upFile ? `${upFile.file.name} · ${upFile.mb}` : "No file chosen"}</span>
                    </div>
                  </div>
                  {!uploadValid ? (
                    <p className="text-[12px] font-medium text-[var(--pms-icon-danger-fg)]">A title, a district and a file are required.</p>
                  ) : null}
                  <p className={CAPTION}>Location metadata is removed before the item is stored.</p>
                </div>
                <DialogFooter>
                  <Button disabled={!uploadValid || busy} onClick={submitUpload}>{busy ? "Uploading…" : "Upload"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {counts.map((c, i) => (
          <CounterTile
            key={c.label}
            icon={c.icon}
            tone={TILE_TONE[i % TILE_TONE.length]}
            label={c.label}
            value={c.n.toLocaleString("en-US")}
            pill={`${Math.round((c.n / countTotal) * 100)}%`}
            active={type === c.filter}
            onClick={() => setType(c.filter)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <Panel className={item ? "xl:col-span-8" : "xl:col-span-12"}>
          <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 pt-5", GUTTER)}>
            <h2 className="shrink-0 text-[15px] font-semibold text-[var(--pms-text-strong)]">Library</h2>
            <span className={cn(CAPTION, "shrink-0 tabular-nums")}>{filtered.length} of {visible.length} visible to you</span>
            <Toolbar className="w-full sm:ml-auto sm:w-auto">
              <select aria-label="Type" className={cn(TOOLBAR_FIELD, "w-[calc(50%-0.25rem)] sm:w-auto")} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All types</option>
                {EVIDENCE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <select aria-label="Result area" className={cn(TOOLBAR_FIELD, "w-[calc(50%-0.25rem)] sm:w-auto")} value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="all">All result areas</option>
                {RESULT_AREAS.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
              </select>
              <select aria-label="Visibility" className={cn(TOOLBAR_FIELD, "w-[calc(50%-0.25rem)] sm:w-auto")} value={vis} onChange={(e) => setVis(e.target.value)}>
                <option value="all">Any visibility</option>
                {VISIBILITY_ORDER.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select aria-label="Indicator" className={cn(TOOLBAR_FIELD, "w-[calc(50%-0.25rem)] sm:w-[150px]")} value={indicator} onChange={(e) => setIndicator(e.target.value)}>
                <option value="all">All indicators</option>
                {indicatorOptions.map((k) => <option key={k.id} value={k.id}>{k.id} — {k.name}</option>)}
              </select>
              <select aria-label="District" className={cn(TOOLBAR_FIELD, "w-full sm:w-auto")} value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="all">All districts</option>
                {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Toolbar>
          </div>

          <div className={cn("pb-3", GUTTER)}>
            <TabTrack tabs={[{ k: "grid", l: "Grid" }, { k: "list", l: "List" }] as const} active={view} onChange={setView} />
          </div>

          {loading ? (
            <div className={cn("pb-5", GUTTER)}><SkeletonRows rows={6} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No evidence matches those filters" hint="Try a different type or visibility." />
          ) : view === "grid" ? (
            <div className={cn("grid grid-cols-1 gap-3 pb-5 sm:grid-cols-2 xl:grid-cols-3", GUTTER)}>
              {filtered.map((e) => {
                const t = EVIDENCE_TYPES.find((x) => x.id === e.type);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { setOpen(e.id); setNextVis(e.visibility); }}
                    className={cn(
                      "flex flex-col gap-2 rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 text-left shadow-[var(--pms-card-shadow)] transition-colors hover:bg-[var(--pms-row-hover)]",
                      open === e.id && "border-[color:var(--pms-primary)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle("info")}>
                        <iconify-icon icon={t?.icon ?? "solar:file-linear"} className="text-[15px]" />
                      </span>
                      <Pill tone={VIS_TONE[e.visibility]}>{e.visibility}</Pill>
                    </div>
                    <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--pms-text-strong)]">{e.title}</p>
                    <p className={CAPTION}>{e.district} · {fmtDate(e.date)} · {e.size}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <ul className="flex flex-col pb-2">
              {filtered.map((e) => {
                const t = EVIDENCE_TYPES.find((x) => x.id === e.type);
                return (
                  <li key={e.id} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
                    <button
                      type="button"
                      onClick={() => { setOpen(e.id); setNextVis(e.visibility); }}
                      className={cn(
                        "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-[var(--pms-row-hover)] sm:px-6",
                        open === e.id && "bg-[var(--pms-row-hover)]",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-[9px]" style={toneStyle("neutral")}>
                        <iconify-icon icon={t?.icon ?? "solar:file-linear"} className="text-[16px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{e.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--pms-muted-text)]">{e.id} · {e.district} · {fmtDate(e.date)}</span>
                      </span>
                      <Pill tone={VIS_TONE[e.visibility]}>{e.visibility}</Pill>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {item ? (
          <Panel className="xl:col-span-4">
            <PanelHead
              title={EVIDENCE_TYPES.find((t) => t.id === item.type)?.label ?? item.type}
              action={
                <span className="flex shrink-0 items-center gap-2">
                  <Pill tone={VIS_TONE[item.visibility]}>{item.visibility}</Pill>
                  <button type="button" onClick={() => setOpen(null)} className="text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]">
                    Close
                  </button>
                </span>
              }
            />
            <div className={cn("pb-4", GUTTER)}>
              <p className="font-mono text-[11px] text-[var(--pms-muted-text)]">{item.id}</p>
              <h3 className="mt-1 text-[15px] font-semibold text-[var(--pms-text-strong)]">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--pms-muted-text)]">{item.description}</p>

              <DefGrid
                className="mt-3 sm:grid-cols-1"
                items={[
                  ["District", item.district],
                  ["Date", fmtDate(item.date)],
                  ["Uploaded by", item.submittedBy],
                  ["Size", item.size],
                  ["Supports", item.linked.join(", ") || "—"],
                ]}
              />
            </div>

            <Rule />

            <div className={cn("flex flex-wrap gap-2 py-4", GUTTER)}>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className={GHOST_BUTTON}>Link an indicator</button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Link {item.id}</DialogTitle></DialogHeader>
                  <ul className="-mx-6 max-h-[50vh] overflow-y-auto">
                    {INDICATORS.slice(0, 30).map((k) => {
                      const on = item.linked.includes(k.id);
                      return (
                        <li key={k.id}>
                          <button
                            type="button"
                            onClick={() => {
                              db.update<Evidence>(ENTITY.evidence, item.id, {
                                linked: on ? item.linked.filter((x) => x !== k.id) : [...item.linked, k.id],
                              });
                              logAct({ actor, role, action: on ? "evidence.unlink" : "evidence.link", target: `${item.id}/${k.id}`, note: k.name });
                              toast.success(on ? "Unlinked" : "Linked");
                            }}
                            className="flex w-full items-center gap-3 border-b border-[color:var(--pms-divide)] px-6 py-2.5 text-left last:border-b-0 hover:bg-[var(--pms-row-hover)]"
                          >
                            <span className="font-mono text-[11px] text-[var(--pms-muted-text)]">{k.id}</span>
                            <span className="min-w-0 flex-1 truncate text-[12.5px]">{k.name}</span>
                            <iconify-icon icon={on ? "solar:check-circle-bold" : "solar:add-circle-linear"} className="text-[17px] text-[var(--pms-icon-info-fg)]" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className={GHOST_BUTTON}>Change visibility</button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Change visibility of {item.id}</DialogTitle></DialogHeader>
                  <div className="flex flex-col gap-2">
                    {VISIBILITY_ORDER.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setNextVis(v)}
                        className={cn(
                          "rounded-[10px] border px-3.5 py-2 text-left text-[13px] capitalize",
                          nextVis === v
                            ? "border-[color:var(--pms-primary)] bg-[var(--pms-icon-info-bg)] font-semibold"
                            : "border-[color:var(--pms-hairline-border)]",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                    <label className="mt-2 flex flex-col gap-1.5">
                      <span className={FIELD_LABEL}>Reason (required)</span>
                      <Input value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 rounded-[10px]" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className={FIELD_LABEL}>Second approver (required)</span>
                      <select className={FORM_FIELD} value={approver} onChange={(e) => setApprover(e.target.value)}>
                        <option value="">Choose a second approver…</option>
                        {USERS.filter((u) => u.name !== actor).map((u) => (
                          <option key={u.id} value={u.name}>{u.name} — {u.institution}</option>
                        ))}
                      </select>
                    </label>
                    <p className={CAPTION}>
                      A visibility change needs a reason and a second approver. Both are written to the audit log.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!reason.trim() || !approver || nextVis === item.visibility}
                      onClick={() => changeVisibility(item)}
                    >
                      Apply
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link href={`/verify?mode=generate&item=${item.id}`} className={GHOST_BUTTON}>
                Generate QR
                <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
              </Link>
              <Button size="sm" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => download(item)}>
                Download
              </Button>
            </div>
          </Panel>
        ) : null}
      </div>

      <Panel>
        <PanelHead title="Accepted evidence types" action={<span className={CAPTION}>{EVIDENCE_TYPES.length}</span>} />
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-y border-[color:var(--pms-divide)]">
                {["Type", "Category", "Links to", "Accepted formats", "Maximum size"].map((h) => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVIDENCE_TYPES.map((t) => (
                <tr key={t.id} className="border-b border-[color:var(--pms-divide)] last:border-b-0">
                  <td className={cn(TD, "font-semibold text-[var(--pms-text-strong)]")}>{t.label}</td>
                  <td className={TD}><Pill tone={CATEGORY_TONE[t.category]}>{t.category}</Pill></td>
                  <td className={cn(TD, "text-[var(--pms-muted-text)]")}>An indicator or a reported result</td>
                  <td className={cn(TD, "text-[var(--pms-muted-text)]")}>{t.formats.join(" · ")}</td>
                  <td className={cn(TD, "tabular-nums text-[var(--pms-muted-text)]")}>{t.maxMb} MB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
