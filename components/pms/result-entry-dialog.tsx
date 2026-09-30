"use client";

import * as React from "react";
import { toast } from "sonner";

import { INDICATORS } from "@/data/indicators";
import { PERIODS } from "@/data/periods";
import { roleById } from "@/data/users";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY, type ResultEntry } from "@/lib/entities";
import { nextId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SELECT = "h-9 w-full rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-2.5 text-[13px]";
const QUALITIES: ResultEntry["quality"][] = ["verified", "provisional", "estimated"];

/**
 * The institutional result entry form — one row of the workbook's results
 * template. This is where an institution reports a figure; the state
 * submissions list is a reviewing screen, not a submitting one.
 */
export function ResultEntryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { role, period } = useStore();
  const actor = roleById(role).name;
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    indicator: INDICATORS[0].id,
    period,
    value: "",
    source: "District Returns",
    quality: "provisional" as ResultEntry["quality"],
    notes: "",
  });

  const kpi = INDICATORS.find((k) => k.id === form.indicator);
  const numeric = form.value.trim() !== "" && Number.isFinite(Number(form.value));
  const valid = numeric && Number(form.value) >= 0 && form.source.trim().length > 1;

  async function save() {
    if (!valid || !kpi) return;
    setBusy(true);
    await wait();
    const id = nextId("RES", 2026);
    db.add<ResultEntry>(ENTITY.results, {
      id,
      indicator: kpi.id,
      period: form.period,
      value: Number(form.value),
      source: form.source.trim(),
      quality: form.quality,
      notes: form.notes.trim(),
      institution: kpi.owner,
      submittedBy: actor,
      submittedAt: new Date().toISOString(),
    });
    logAct({
      actor,
      role,
      action: "result.submit",
      target: id,
      note: `${kpi.id} ${form.period} = ${form.value} ${kpi.unit} · ${form.quality}`,
    });
    setBusy(false);
    setForm({ ...form, value: "", notes: "" });
    onOpenChange(false);
    toast.success(`${id} saved — ${kpi.id} ${form.period}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Submit an institutional result</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Indicator</span>
            <select className={SELECT} value={form.indicator} onChange={(e) => setForm({ ...form, indicator: e.target.value })}>
              {INDICATORS.map((k) => (
                <option key={k.id} value={k.id}>{k.id} — {k.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Period</span>
              <select className={SELECT} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Value{kpi ? ` (${kpi.unit})` : ""}</span>
              <Input
                inputMode="decimal"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="h-9 rounded-[10px]"
                aria-invalid={form.value.trim() !== "" && !numeric}
              />
              {form.value.trim() !== "" && !numeric ? (
                <span className="text-[11.5px] font-medium text-[var(--pms-icon-danger-fg)]">A result must be a number.</span>
              ) : null}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Source</span>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="h-9 rounded-[10px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Quality</span>
              <select className={SELECT} value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value as ResultEntry["quality"] })}>
                {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Notes</span>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9 rounded-[10px]" />
          </label>

          {kpi ? (
            <p className="text-[11.5px] text-[var(--pms-muted-text)]">
              {kpi.owner} · baseline {kpi.baseline} · target {kpi.target} · {kpi.frequency.toLowerCase()}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button disabled={!valid || busy} onClick={save}>{busy ? "Saving…" : "Save result"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
