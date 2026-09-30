"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { PERIODS } from "@/data/periods";
import { roleById } from "@/data/users";
import type { AuditEntry } from "@/lib/audit";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { fmtDateTime } from "@/lib/format";
import { bandsFor } from "@/lib/status";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { useStore } from "@/lib/store";
import { useCollection, useStored } from "@/lib/use-collection";
import { VISIBILITY_ORDER } from "@/lib/visibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResetDemo } from "@/components/system/ResetDemo";
import { IconChip, PageHeader, Pill, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

type BlockId = keyof Settings;

const DEFAULTS: Settings = DEFAULT_SETTINGS;

const BLOCK_LABEL: Record<BlockId, string> = {
  calendar: "Reporting calendar",
  bands: "Status bands",
  languages: "Languages",
  visibility: "Visibility rules",
  suppression: "Suppression",
};

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const CLOSE_MONTHS = ["Apr", "Jul", "Oct", "Jan"];
const SELECT = "h-8 rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-2 text-[12.5px]";

export default function SettingsPage() {
  const [openExport, exportDialog] = useExportDialog();
  const { role, bandMode, setBandMode } = useStore();
  const actor = roleById(role).name;
  const activity = useCollection<AuditEntry>(ENTITY.activity);
  const stored = useStored<Partial<Settings>>(ENTITY.settings, {});
  const settings: Settings = { ...DEFAULTS, ...stored };

  const [editing, setEditing] = React.useState<BlockId | null>(null);
  const [draft, setDraft] = React.useState<Settings>(DEFAULTS);
  /** Save and Reset apply the moment they are confirmed, so both ask first. */
  const [pending, setPending] = React.useState<{ block: BlockId; kind: "save" | "reset"; note: string } | null>(null);

  // The rest of the platform reads the band mode from the store — keep it in step.
  const savedMode = settings.bands.mode;
  React.useEffect(() => {
    if (savedMode !== bandMode) setBandMode(savedMode);
  }, [savedMode, bandMode, setBandMode]);

  function begin(block: BlockId) {
    setDraft(settings);
    setEditing(block);
  }

  function save(block: BlockId, note: string) {
    const next: Settings = { ...settings, [block]: draft[block] };
    db.setOne<Settings>(ENTITY.settings, next);
    if (block === "bands") setBandMode(next.bands.mode);
    logAct({ actor, role, action: "settings.update", target: BLOCK_LABEL[block], note });
    setEditing(null);
    toast.success(`${BLOCK_LABEL[block]} saved`);
  }

  function reset(block: BlockId) {
    const next: Settings = { ...settings, [block]: DEFAULTS[block] };
    db.setOne<Settings>(ENTITY.settings, next);
    if (block === "bands") setBandMode(DEFAULTS.bands.mode);
    logAct({ actor, role, action: "settings.reset", target: BLOCK_LABEL[block], note: "Restored to default" });
    if (editing === block) setEditing(null);
    toast.success(`${BLOCK_LABEL[block]} restored to default`);
  }

  function confirmSave(block: BlockId, note: string) {
    setPending({ block, kind: "save", note });
  }

  function confirmReset(block: BlockId) {
    setPending({ block, kind: "reset", note: "Restored to default" });
  }

  function applyPending() {
    if (!pending) return;
    if (pending.kind === "save") save(pending.block, pending.note);
    else reset(pending.block);
    setPending(null);
  }

  function actions(block: BlockId, note: () => string) {
    const open = editing === block;
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        {open ? (
          <>
            <Button size="sm" className="h-8 rounded-[var(--pms-radius-control)]" onClick={() => confirmSave(block, note())}>
              Save
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-[var(--pms-radius-control)]" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="h-8 rounded-[var(--pms-radius-control)]" onClick={() => begin(block)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-[var(--pms-radius-control)] text-[12px] text-[var(--pms-muted-text)]"
              onClick={() => confirmReset(block)}
            >
              Reset to default
            </Button>
          </>
        )}
      </div>
    );
  }

  const cal = editing === "calendar" ? draft.calendar : settings.calendar;
  const bands = editing === "bands" ? draft.bands : settings.bands;
  const langs = editing === "languages" ? draft.languages : settings.languages;
  const vis = editing === "visibility" ? draft.visibility : settings.visibility;
  const sup = editing === "suppression" ? draft.suppression : settings.suppression;

  const pendingTitle = pending
    ? pending.kind === "reset"
      ? `Reset ${BLOCK_LABEL[pending.block]} to default?`
      : `Save ${BLOCK_LABEL[pending.block]}?`
    : "";

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}

      <Dialog open={Boolean(pending)} onOpenChange={(v) => { if (!v) setPending(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{pendingTitle}</DialogTitle></DialogHeader>
          <p className="text-[13px] leading-[1.6] text-[var(--pms-text)]">
            {pending?.kind === "reset"
              ? `${BLOCK_LABEL[pending.block]} goes back to the shipped default at once, for every user of the platform.`
              : `${pending ? BLOCK_LABEL[pending.block] : ""} changes apply at once, for every user of the platform.`}
            {pending?.note ? <span className="mt-1.5 block text-[12px] text-[var(--pms-muted-text)]">{pending.note}</span> : null}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={applyPending}>{pending?.kind === "reset" ? "Reset to default" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader onPrint={printPage} onExport={openExport} title="System settings" meta="The rules the whole platform runs on." actions={<ResetDemo className="h-9 rounded-[var(--pms-radius-control)]" />} />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-2">
        <PmsCard
          title="Reporting calendar"
          action={actions("calendar", () => `Closes day ${draft.calendar.closeDay}, reminder ${draft.calendar.reminderDays} days before`)}
          flush
        >
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {PERIODS.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-[12.5px]">
                <span className="w-24 shrink-0 font-mono text-[11.5px] text-[var(--pms-muted-text)]">{p.id}</span>
                <span className="min-w-0 flex-1 text-[var(--pms-text)]">{p.label}</span>
                <span className="shrink-0 text-[var(--pms-muted-text)]">
                  closes {cal.closeDay} {CLOSE_MONTHS[PERIODS.indexOf(p) % 4]}
                </span>
              </li>
            ))}
          </ul>

          {editing === "calendar" ? (
            <div className="grid grid-cols-2 gap-3 border-t border-[color:var(--pms-divide)] px-5 py-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Closing day</span>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={draft.calendar.closeDay}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, calendar: { ...d.calendar, closeDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)) } }))
                  }
                  className="h-8 rounded-[10px]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Reminder, days before</span>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={draft.calendar.reminderDays}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, calendar: { ...d.calendar, reminderDays: Math.min(30, Math.max(0, Number(e.target.value) || 0)) } }))
                  }
                  className="h-8 rounded-[10px]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Week starts</span>
                <select
                  className={SELECT}
                  value={draft.calendar.weekStart}
                  onChange={(e) => setDraft((d) => ({ ...d, calendar: { ...d.calendar, weekStart: e.target.value } }))}
                >
                  {DAYS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Week ends</span>
                <select
                  className={SELECT}
                  value={draft.calendar.weekEnd}
                  onChange={(e) => setDraft((d) => ({ ...d, calendar: { ...d.calendar, weekEnd: e.target.value } }))}
                >
                  {DAYS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p className="border-t border-[color:var(--pms-divide)] px-5 py-3 text-[11.5px] text-[var(--pms-muted-text)]">
              The working week runs {cal.weekStart} to {cal.weekEnd}. Reminders go out {cal.reminderDays} days before a deadline.
            </p>
          )}
        </PmsCard>

        <PmsCard title="Status bands" action={actions("bands", () => `Band mode set to ${draft.bands.mode}`)}>
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-[var(--pms-radius-control)] bg-[var(--pms-segmented-track)] p-1">
            {([3, 6] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={editing !== "bands"}
                onClick={() => setDraft((d) => ({ ...d, bands: { mode: m } }))}
                className={`h-9 rounded-[var(--pms-radius-control)] text-[13px] font-medium transition-colors disabled:cursor-default ${
                  bands.mode === m ? "bg-[var(--pms-segmented-thumb)] text-[var(--pms-text-strong)] shadow-sm" : "text-[var(--pms-muted-text)]"
                }`}
              >
                {m} bands
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-1.5">
            {bandsFor(bands.mode).map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-[12.5px]">
                <span className="size-3 rounded-[3px]" style={{ backgroundColor: b.color }} />
                <span className="flex-1 text-[var(--pms-text)]">{b.label}</span>
                <span className="tabular-nums text-[var(--pms-muted-text)]">{b.min >= 0 ? `${b.min}+` : "no data"}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 rounded-[10px] bg-[var(--pms-icon-warning-bg)] px-3 py-2 text-[12px] font-medium text-[var(--pms-icon-warning-fg)]">
            The screen design shows three bands; the workbook shows six. The ministry must confirm which is official.
          </p>
        </PmsCard>

        <PmsCard
          title="Languages"
          action={actions("languages", () => `${draft.languages.filter((l) => l.on).length} of ${draft.languages.length} enabled`)}
          flush
        >
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {langs.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <IconChip icon="solar:global-linear" tone={l.on ? "success" : "neutral"} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--pms-text-strong)]">
                    {l.label}
                    {l.rtl ? <Pill tone="accent">right to left</Pill> : null}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--pms-segmented-track)]">
                      <span className="block h-full rounded-full bg-[var(--pms-chart-collected)]" style={{ width: `${l.complete}%` }} />
                    </span>
                    <span className="text-[11px] tabular-nums text-[var(--pms-muted-text)]">{l.complete}% translated</span>
                  </span>
                </span>
                <Switch
                  checked={l.on}
                  disabled={editing !== "languages"}
                  onCheckedChange={(v) =>
                    setDraft((d) => ({ ...d, languages: d.languages.map((x) => (x.id === l.id ? { ...x, on: v } : x)) }))
                  }
                  aria-label={l.label}
                />
              </li>
            ))}
          </ul>
          <p className="border-t border-[color:var(--pms-divide)] px-5 py-3 text-[11.5px] text-[var(--pms-muted-text)]">
            {langs.filter((l) => l.on).length < 2
              ? `The language control in the top bar reads "${langs.find((l) => l.on)?.label ?? "English"} only" \u2014 it offers no other option while one language is enabled.`
              : `The language control in the top bar offers ${langs.filter((l) => l.on).map((l) => l.label).join(", ")}.`}
          </p>
        </PmsCard>

        <PmsCard title="Visibility rules" action={actions("visibility", () => "Visibility wording updated")} flush>
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {VISIBILITY_ORDER.map((v) => (
              <li key={v} className="px-5 py-2.5">
                <p className="text-[12.5px] font-semibold capitalize text-[var(--pms-text-strong)]">{v}</p>
                {editing === "visibility" ? (
                  <Input
                    value={draft.visibility[v] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, visibility: { ...d.visibility, [v]: e.target.value } }))}
                    className="mt-1 h-8 rounded-[10px] text-[12px]"
                  />
                ) : (
                  <p className="mt-0.5 text-[11.5px] text-[var(--pms-muted-text)]">{vis[v]}</p>
                )}
              </li>
            ))}
          </ul>
        </PmsCard>

        <PmsCard
          title="Suppression"
          action={actions("suppression", () => `Threshold ${draft.suppression.threshold}${draft.suppression.suppressEvents ? ", events included" : ""}`)}
        >
          {editing === "suppression" ? (
            <div className="flex flex-col gap-3">
              <label className="flex max-w-[220px] flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Threshold</span>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={draft.suppression.threshold}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, suppression: { ...d.suppression, threshold: Math.min(50, Math.max(1, Number(e.target.value) || 1)) } }))
                  }
                  className="h-8 rounded-[10px]"
                />
              </label>
              <label className="flex items-center gap-3 text-[12.5px] text-[var(--pms-text)]">
                <Switch
                  checked={draft.suppression.suppressEvents}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, suppression: { ...d.suppression, suppressEvents: v } }))}
                  aria-label="Suppress event counts too"
                />
                Suppress event counts as well as people
              </label>
            </div>
          ) : (
            <>
              <p className="text-[13px] leading-[1.6] text-[var(--pms-text)]">
                Any published count of <b>people</b> below <b>{sup.threshold}</b> is hidden and reads
                &ldquo;suppressed — too few records&rdquo;. Counts of events, meetings and agreements are{" "}
                {sup.suppressEvents ? "suppressed on the same rule" : "not suppressed"}.
              </p>
              <p className="mt-2 text-[12px] text-[var(--pms-muted-text)]">
                So &ldquo;three injured&rdquo; is visible to authorized users and appears publicly as &ldquo;fewer than {sup.threshold}&rdquo;.
              </p>
            </>
          )}
        </PmsCard>

        <PmsCard
          title="Change history"
          action={
            <Link
              href="/audit-log"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--pms-muted-text)] no-underline transition-colors hover:text-[var(--pms-text-strong)]"
            >
              Full audit log
              <iconify-icon icon="solar:arrow-right-up-linear" className="text-[14px]" />
            </Link>
          }
          flush
        >
          <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
            {activity.filter((a) => a.action.startsWith("settings")).slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-[12.5px]">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[var(--pms-text-strong)]">{a.target}</span>
                  <span className="block text-[11px] text-[var(--pms-muted-text)]">{a.actor} · {a.note}</span>
                </span>
                <Pill tone={a.action === "settings.reset" ? "warn" : "info"}>{a.action === "settings.reset" ? "reset" : "saved"}</Pill>
                <span className="shrink-0 text-[11px] text-[var(--pms-muted-text)]">{fmtDateTime(a.ts)}</span>
              </li>
            ))}
            {activity.filter((a) => a.action.startsWith("settings")).length === 0 ? (
              <li className="px-5 py-4 text-[13px] text-[var(--pms-muted-text)]">No settings have been changed yet.</li>
            ) : null}
          </ul>
        </PmsCard>
      </div>
    </div>
  );
}
