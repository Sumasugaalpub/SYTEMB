"use client";

import * as React from "react";

import { BreakGlass } from "@/components/system/BreakGlass";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { Alert } from "@/data/alerts";
import { REGIONS } from "@/data/geography";
import { roleById, USERS } from "@/data/users";
import { wait } from "@/lib/async";
import { assignOwner, closeAlert, createAlert, escalateAlert, recordAction } from "@/lib/alert-actions";
import { ENTITY } from "@/lib/entities";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { canSee } from "@/lib/visibility";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, PANEL_BODY, Panel, PanelHead, Rule, TabTrack } from "@/components/pms/dashboard-sections";
import { EmptyState, NoData, PageHeader, Pill, type PillTone, printPage } from "@/components/pms/ui";

const LEVEL: Record<Alert["level"], PillTone> = { watch: "info", warning: "warn", critical: "bad" };
const LEVEL_TONE: Record<Alert["level"], string> = { watch: "info", warning: "warning", critical: "danger" };
const STATUS: Record<Alert["status"], PillTone> = { open: "bad", responding: "warn", closed: "good" };
const SELECT = "h-9 w-full rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-2.5 text-[13px]";

/** The five stages an alert passes through, in order. */
const STAGES = ["New", "Verified", "Escalated", "Response in progress", "Closed"] as const;

type Stage = { label: string; done: boolean; at?: string; by?: string; note: string };

/**
 * Reads the strip off the alert itself: its status and its recorded actions.
 * A stage is only filled when something in the record actually happened.
 */
function stagesOf(a: Alert): Stage[] {
  const acts = a.actions ?? [];
  const raised = acts[0];
  // Verification is the first action taken by a person rather than the system.
  const verified = acts.find((x) => x.by !== "System");
  const escalated = acts.find((x) => /^escalated/i.test(x.text));
  // Responding begins with the first substantive action after the alert was raised.
  const responded = acts.find(
    (x) => x !== raised && x !== escalated && !/^owner set to/i.test(x.text) && !/^closed —/i.test(x.text),
  );
  const closedAct = acts.find((x) => /^closed —/i.test(x.text));

  return [
    { label: STAGES[0], done: true, at: raised?.at ?? a.opened, by: raised?.by ?? "System", note: "Alert raised" },
    { label: STAGES[1], done: Boolean(verified) || a.status !== "open", at: verified?.at, by: verified?.by, note: verified ? verified.text : "Not yet confirmed by a duty officer" },
    { label: STAGES[2], done: Boolean(escalated) || a.level === "critical", at: escalated?.at, by: escalated?.by, note: escalated ? escalated.text : a.level === "critical" ? "Opened at critical level" : "Not escalated" },
    { label: STAGES[3], done: a.status === "responding" || a.status === "closed", at: responded?.at, by: responded?.by, note: responded ? responded.text : "No response action recorded" },
    { label: STAGES[4], done: a.status === "closed", at: a.closed ?? closedAct?.at, by: closedAct?.by, note: closedAct ? closedAct.text : "Open" },
  ];
}

/** Counter tile — the dashboard's mini-card. */
function Tile({ icon, tone, label, value, pill }: { icon: string; tone: string; label: string; value: string; pill: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]">
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-[9px]"
          style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
        >
          <iconify-icon icon={icon} className="text-[15px]" />
        </span>
        <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{label}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{value}</span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
          style={{ backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` }}
        >
          {pill}
        </span>
      </div>
    </div>
  );
}

function EarlyWarningPageBody() {
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const clearance = roleById(role).clearance;
  const actor = roleById(role).name;
  const rows = useCollection<Alert>(ENTITY.alerts);
  // The dashboard links straight to an alert, or straight to the new-alert form.
  const [open, setOpen] = React.useState<string | null>(params.get("alert"));
  const [create, setCreate] = React.useState(params.get("new") === "1");
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [closeNote, setCloseNote] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [tab, setTab] = React.useState<"progress" | "update" | "history">("progress");
  const [form, setForm] = React.useState({ title: "", district: "Berdale", level: "warning" as Alert["level"], trigger: "", owner: "", due: "" });

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  if (!canSee(clearance, "restricted")) {
    return (
      <EmptyState
        icon="solar:lock-keyhole-linear"
        title="Restricted"
        hint="Your role does not have access to early warning. Switch role in the top bar to view it."
      />
    );
  }

  const alert = rows.find((a) => a.id === open);
  const openCount = rows.filter((a) => a.status === "open").length;
  const overdue = rows.filter((a) => a.status !== "closed" && a.due < "2026-05-20").length;
  const closed = rows.filter((a) => a.status === "closed").length;
  const avgDays =
    closed === 0
      ? 0
      : Math.round(
          rows
            .filter((a) => a.closed)
            .reduce((sum, a) => sum + (new Date(a.closed!).getTime() - new Date(a.opened).getTime()) / 864e5, 0) / closed,
        );

  const share = (n: number) => `${rows.length ? Math.round((n / rows.length) * 100) : 0}%`;

  async function run(fn: () => { ok: boolean; error?: string }, success: string) {
    setBusy(true);
    await wait(600);
    const res = fn();
    setBusy(false);
    if (!res.ok) return toast.error(res.error!);
    toast.success(success);
  }

  const columns: Column<Alert>[] = [
    {
      key: "id",
      header: "Reference",
      value: (a) => a.id,
      width: "128px",
      cell: (a) => (
        <span className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: `var(--pms-icon-${LEVEL_TONE[a.level]}-fg)` }}
            aria-hidden
          />
          <span className={cn("font-mono text-[12px]", open === a.id && "font-semibold text-[var(--pms-text-strong)]")}>
            {a.id}
          </span>
        </span>
      ),
    },
    {
      key: "title",
      header: "Area",
      value: (a) => `${a.district} — ${a.title}`,
      cell: (a) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{a.title}</span>
          <span className="truncate text-[11px] text-[var(--pms-muted-text)]">{a.district}</span>
        </span>
      ),
    },
    { key: "level", header: "Level", value: (a) => a.level, cell: (a) => <Pill tone={LEVEL[a.level]}>{a.level}</Pill> },
    { key: "trigger", header: "Trigger", value: (a) => a.trigger, cell: (a) => <span className="text-[12.5px]">{a.trigger}</span> },
    { key: "opened", header: "Opened", value: (a) => a.opened, cell: (a) => <span className="text-[12px] tabular-nums">{fmtDateTime(a.opened)}</span> },
    { key: "owner", header: "Owner", value: (a) => a.owner, cell: (a) => <span className="text-[12.5px] font-semibold text-[var(--pms-text-strong)]">{a.owner}</span> },
    {
      key: "due",
      header: "Due",
      value: (a) => a.due,
      cell: (a) => (
        <span
          className="text-[12px] tabular-nums"
          style={a.status !== "closed" && a.due < "2026-05-20" ? { color: "var(--pms-icon-danger-fg)", fontWeight: 600 } : undefined}
        >
          {fmtDate(a.due)}
        </span>
      ),
    },
    { key: "status", header: "Status", value: (a) => a.status, cell: (a) => <Pill tone={STATUS[a.status]}>{a.status}</Pill> },
    {
      key: "action",
      header: "Action",
      width: "240px",
      value: (a) => a.actions[a.actions.length - 1]?.text ?? "",
      cell: (a) => {
        const last = a.actions[a.actions.length - 1];
        if (!last) return <NoData label="No action recorded" />;
        return (
          <span className="flex max-w-[240px] flex-col">
            <span className="truncate text-[12.5px] text-[var(--pms-text)]" title={last.text}>{last.text}</span>
            <span className="truncate text-[11px] text-[var(--pms-muted-text)]">{fmtDateTime(last.at)} · {last.by}</span>
          </span>
        );
      },
    },
    { key: "closed", header: "Closed", value: (a) => a.closed ?? "", cell: (a) => (a.closed ? <span className="text-[12px] tabular-nums">{fmtDateTime(a.closed)}</span> : <span className="text-[var(--pms-muted-text)]">—</span>) },
  ];

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <div className="flex items-center gap-2 rounded-[var(--pms-radius-card)] border border-[color:var(--pms-icon-danger-fg)] bg-[var(--pms-icon-danger-bg)] px-4 py-2">
        <iconify-icon icon="solar:lock-keyhole-linear" className="shrink-0 text-[15px] text-[var(--pms-icon-danger-fg)]" />
        <p className="min-w-0 text-[11.5px] font-semibold leading-[1.4] text-[var(--pms-icon-danger-fg)]">
          Restricted · every view is recorded · exports are not permitted from this page
        </p>
      </div>

      <PageHeader filters
        onPrint={printPage}
        exportDisabled
        title="Early warning"
        meta="Every alert carries a named owner and a clock."
        actions={
          <Dialog open={create} onOpenChange={setCreate}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-[var(--pms-radius-control)]">Create alert</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create an alert</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Title</span>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 rounded-[10px]" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">District</span>
                    <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="h-9 rounded-[10px]" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Level</span>
                    <select className={SELECT} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Alert["level"] })}>
                      <option value="watch">Watch</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Trigger</span>
                  <Input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="h-9 rounded-[10px]" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Owner</span>
                    <select className={SELECT} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
                      <option value="">Choose a person…</option>
                      {USERS.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Response due</span>
                    <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="h-9 rounded-[10px]" />
                  </label>
                </div>
                {!form.owner ? (
                  <p className="text-[12px] font-medium text-[var(--pms-icon-danger-fg)]">
                    An alert cannot be saved without a named owner.
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button
                  disabled={!form.title || !form.owner || !form.due || busy}
                  onClick={() =>
                    run(
                      () => createAlert({ ...form, region: REGIONS.find((r) => r.districts.includes(form.district))?.id ?? "bay", state: "south-west" }, actor, role),
                      "Alert created",
                    )
                  }
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? null : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Tile icon="solar:bell-bing-linear" tone="danger" label="Open" value={String(openCount)} pill={share(openCount)} />
          <Tile icon="solar:clock-circle-linear" tone="warning" label="Overdue" value={String(overdue)} pill={share(overdue)} />
          <Tile icon="solar:check-circle-linear" tone="success" label="Closed this quarter" value={String(closed)} pill={share(closed)} />
          <Tile icon="solar:stopwatch-linear" tone="info" label="Average days to close" value={String(avgDays)} pill="days" />
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <Panel className={alert ? "xl:col-span-8" : "xl:col-span-12"}>
          <PanelHead title="Alerts" className="pb-0" />
          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            pageSize={10}
            searchPlaceholder="Search alert, district or owner…"
            activeFilter={filter}
            onFilter={setFilter}
            matchFilter={(a, f) => a.status === f || a.level === f}
            onRowClick={(a) => { setOpen(a.id); setOwner(a.owner); setTab("progress"); }}
            empty="No alerts match that filter"
            filters={[
              { id: "all", label: "All", count: rows.length },
              { id: "open", label: "Open", count: openCount },
              { id: "responding", label: "Responding", count: rows.filter((a) => a.status === "responding").length },
              { id: "closed", label: "Closed", count: closed },
              { id: "critical", label: "Critical", count: rows.filter((a) => a.level === "critical").length },
            ]}
          />
        </Panel>

        {alert ? (
          <Panel className="xl:col-span-4">
            <PanelHead
              title={alert.id}
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
              <div className={cn("pb-3", GUTTER)}>
                <p className="text-[13px] font-semibold leading-[1.4] text-[var(--pms-text-strong)]">{alert.title}</p>
                <p className="mt-0.5 text-[11px] leading-[1.45] text-[var(--pms-muted-text)]">{alert.trigger}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Pill tone={LEVEL[alert.level]}>{alert.level}</Pill>
                  <Pill tone={STATUS[alert.status]}>{alert.status}</Pill>
                  <Pill tone="neutral">Due {fmtDate(alert.due)}</Pill>
                </div>
              </div>

              <div className={cn("pb-3", GUTTER)}>
                <TabTrack
                  tabs={[
                    { k: "progress", l: "Progress" },
                    { k: "update", l: "Update" },
                    { k: "history", l: "History" },
                  ] as const}
                  active={tab}
                  onChange={setTab}
                />
              </div>

              {tab === "progress" ? (
                <ol className={cn("flex flex-col pb-5", GUTTER)}>
                  {stagesOf(alert).map((st, i, all) => (
                    <li key={st.label} className="flex gap-2.5">
                      <span className="flex flex-col items-center">
                        <span
                          className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: st.done ? "var(--pms-icon-success-bg)" : "var(--pms-segmented-track)",
                            color: st.done ? "var(--pms-icon-success-fg)" : "var(--pms-muted-text)",
                          }}
                        >
                          {st.done ? <iconify-icon icon="solar:check-circle-bold" className="text-[13px]" /> : i + 1}
                        </span>
                        {i < all.length - 1 ? (
                          <span
                            className="w-[2px] flex-1"
                            style={{ backgroundColor: all[i + 1].done ? "var(--pms-icon-success-fg)" : "var(--pms-divide)" }}
                          />
                        ) : null}
                      </span>
                      <span className={cn("min-w-0 flex-1", i < all.length - 1 && "pb-2.5")}>
                        <span
                          className="block text-[12px] font-semibold leading-[1.3]"
                          style={{ color: st.done ? "var(--pms-text-strong)" : "var(--pms-muted-text)" }}
                        >
                          {st.label}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--pms-muted-text)]" title={st.note}>
                          {st.at ? `${fmtDateTime(st.at)}${st.by ? ` · ${st.by}` : ""}` : st.note}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}

              {tab === "update" ? (
                <div className={cn("flex flex-col gap-4 pb-5", GUTTER)}>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Owner</span>
                    <select className={SELECT} value={owner} onChange={(e) => setOwner(e.target.value)}>
                      {USERS.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 rounded-[var(--pms-radius-control)]"
                      disabled={busy || owner === alert.owner}
                      onClick={() => run(() => assignOwner(alert.id, owner, actor, role), "Owner assigned")}
                    >
                      Assign owner
                    </Button>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Record an action</span>
                    <textarea
                      value={note}
                      rows={2}
                      onChange={(e) => setNote(e.target.value)}
                      className="rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--pms-primary)]"
                    />
                    <Button
                      size="sm"
                      className="mt-1 rounded-[var(--pms-radius-control)]"
                      disabled={busy || !note.trim()}
                      onClick={() => run(() => { const r = recordAction(alert.id, note, actor, role); if (r.ok) setNote(""); return r; }, "Action recorded")}
                    >
                      Record action
                    </Button>
                  </label>

                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={alert.status === "closed"} className="rounded-[var(--pms-radius-control)]">
                          Close alert
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Close {alert.id}?</DialogTitle></DialogHeader>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Closing note (required)</span>
                          <textarea
                            value={closeNote}
                            rows={3}
                            onChange={(e) => setCloseNote(e.target.value)}
                            className="rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--pms-primary)]"
                          />
                        </label>
                        <DialogFooter>
                          <Button
                            disabled={!closeNote.trim() || busy}
                            onClick={() => run(() => { const r = closeAlert(alert.id, closeNote, actor, role); if (r.ok) setCloseNote(""); return r; }, "Alert closed")}
                          >
                            Close alert
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-[var(--pms-radius-control)]"
                      disabled={busy}
                      onClick={() => run(() => escalateAlert(alert.id, actor, role), "Escalated")}
                    >
                      Escalate
                    </Button>
                  </div>
                </div>
              ) : null}

              {tab === "history" ? (
                <>
                  <Rule />
                  <ol className="flex flex-col">
                    {alert.actions.map((a, i) => (
                      <li
                        key={i}
                        className={cn("flex items-start gap-3 border-t border-[color:var(--pms-divide)] py-2.5 first:border-t-0", GUTTER)}
                      >
                        <span
                          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[9px]"
                          style={{ backgroundColor: "var(--pms-icon-neutral-bg)", color: "var(--pms-icon-neutral-fg)" }}
                        >
                          <iconify-icon icon="solar:clock-circle-linear" className="text-[15px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-medium leading-[1.4] text-[var(--pms-text)]">{a.text}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-[var(--pms-muted-text)]">
                            {fmtDateTime(a.at)} · {a.by}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="pb-4" />
                </>
              ) : null}
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

export default function EarlyWarningPage() {
  return (
    <BreakGlass page="early-warning">
      <EarlyWarningPageBody />
    </BreakGlass>
  );
}
