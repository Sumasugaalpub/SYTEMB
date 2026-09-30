"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { INSTITUTIONS } from "@/data/institutions";
import { ROLES, type RoleId, type User, userGroup } from "@/data/users";
import { roleById } from "@/data/users";
import type { AuditEntry } from "@/lib/audit";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { fmtDateTime } from "@/lib/format";
import { nextId } from "@/lib/ids";
import { rules } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, Panel, PanelHead } from "@/components/pms/dashboard-sections";
import { CAPTION, DefGrid, FIELD_LABEL, FORM_FIELD, Row } from "@/components/pms/exec-kit";
import { PageHeader, Pill, printPage, useExportDialog } from "@/components/pms/ui";

export default function UsersPage() {
  const [openExport, exportDialog] = useExportDialog();
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const actor = roleById(role).name;
  const users = useCollection<User>(ENTITY.users);
  const activity = useCollection<AuditEntry>(ENTITY.activity);

  const [group, setGroup] = React.useState(params.get("group") ?? "all");
  const [open, setOpen] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", role: "executive-user" as RoleId, institution: "MOIFAR" });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  // One shared definition of the five access groups, so the dashboard counters
  // and these chips can never disagree.
  const groupOf = (u: User) => userGroup(u);

  const rows = users.filter((u) => group === "all" || groupOf(u) === group);
  const user = users.find((u) => u.id === open);
  const valid = form.name.trim().length > 2 && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email);

  async function addUser() {
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      return toast.error("That email address already has an account.");
    }
    setBusy(true);
    await wait();
    const id = nextId("USR", 2026, 3);
    db.add<User>(ENTITY.users, {
      id,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      institution: form.institution,
      lastActive: new Date().toISOString(),
      active: true,
    });
    logAct({ actor, role, action: "user.create", target: id, note: `${form.name} · ${form.role}` });
    setBusy(false);
    setForm({ ...form, name: "", email: "" });
    toast.success(`${id} created`);
  }

  function changeRole(u: User, next: RoleId) {
    db.update<User>(ENTITY.users, u.id, { role: next });
    logAct({ actor, role, action: "user.role", target: u.id, note: `${u.role} → ${next}` });
    toast.success(`${u.name} is now ${roleById(next).name}`);
  }

  function suspend(u: User) {
    const rule = rules.canDeleteUser(users, u, "U-001");
    if (!rule.ok) return toast.error(rule.reason);
    db.update<User>(ENTITY.users, u.id, { active: false });
    logAct({ actor, role, action: "user.suspend", target: u.id, note: reason });
    setReason("");
    toast.success(`${u.name} suspended`);
  }

  const columns: Column<User>[] = [
    { key: "name", header: "Name", value: (u) => u.name, cell: (u) => <span className="font-semibold text-[var(--pms-text-strong)]">{u.name}</span> },
    { key: "email", header: "Email", value: (u) => u.email, cell: (u) => <span className="text-[var(--pms-muted-text)]">{u.email}</span> },
    { key: "role", header: "Role", value: (u) => roleById(u.role).name, cell: (u) => <Pill tone="info">{roleById(u.role).name}</Pill> },
    { key: "institution", header: "Institution", value: (u) => u.institution },
    { key: "scope", header: "Scope", value: (u) => u.state ?? "national", cell: (u) => <span className="text-[var(--pms-muted-text)]">{u.state ?? "national"}</span> },
    { key: "last", header: "Last active", value: (u) => u.lastActive, cell: (u) => <span className="tabular-nums text-[var(--pms-muted-text)]">{fmtDateTime(u.lastActive)}</span> },
    { key: "status", header: "Status", value: (u) => (u.active ? "active" : "suspended"), cell: (u) => <Pill tone={u.active ? "good" : "bad"}>{u.active ? "active" : "suspended"}</Pill> },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title="Users & roles"
        meta="Who can open what. Hiding a link is not access control — the route is blocked too."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-[var(--pms-radius-control)]">Add user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a user</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL}>Name</span>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 rounded-[10px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL}>Email</span>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-9 rounded-[10px]"
                    aria-invalid={Boolean(form.email) && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email)}
                  />
                  {form.email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email) ? (
                    <span className="text-[11.5px] font-medium text-[var(--pms-icon-danger-fg)]">That is not a valid email address.</span>
                  ) : null}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className={FIELD_LABEL}>Role</span>
                    <select className={FORM_FIELD} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleId })}>
                      {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={FIELD_LABEL}>Institution</span>
                    <select className={FORM_FIELD} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })}>
                      {INSTITUTIONS.map((i) => <option key={i.id} value={i.acronym}>{i.acronym}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!valid || busy} onClick={addUser}>{busy ? "Saving…" : "Add user"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Panel>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={10}
          exportName="users"
          searchPlaceholder="Search name, email or institution…"
          activeFilter={group}
          onFilter={setGroup}
          matchFilter={(u, f) => groupOf(u) === f}
          onRowClick={(u) => setOpen(u.id)}
          empty="No users in that group"
          filters={[
            { id: "all", label: "All", count: users.length },
            { id: "federal", label: "Federal", count: users.filter((u) => groupOf(u) === "federal").length },
            { id: "states", label: "States", count: users.filter((u) => groupOf(u) === "states").length },
            { id: "banadir", label: "Banadir", count: users.filter((u) => groupOf(u) === "banadir").length },
            { id: "districts", label: "Districts", count: users.filter((u) => groupOf(u) === "districts").length },
            { id: "partners", label: "Partners", count: users.filter((u) => groupOf(u) === "partners").length },
          ]}
        />
      </Panel>

      {user ? (
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-5">
            <PanelHead
              title={user.name}
              action={
                <button type="button" onClick={() => setOpen(null)} className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]">
                  Close
                </button>
              }
            />
            <div className={cn("pb-4", GUTTER)}>
              <DefGrid
                items={[
                  ["Email", user.email],
                  ["Institution", user.institution],
                  ["Scope", user.state ?? "national"],
                  ["Clearance", <Pill key="c" tone={roleById(user.role).clearance === "restricted" ? "bad" : roleById(user.role).clearance === "authorized" ? "warn" : "info"}>{roleById(user.role).clearance}</Pill>],
                ]}
              />
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
                  <span className={FIELD_LABEL}>Change role</span>
                  <select className={FORM_FIELD} value={user.role} onChange={(e) => changeRole(user, e.target.value as RoleId)}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-[var(--pms-radius-control)]" disabled={!user.active}>
                      Suspend user
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Suspend {user.name}?</DialogTitle></DialogHeader>
                    <p className="text-[13px] text-[var(--pms-text)]">
                      They lose access immediately. The account is kept so the audit log stays readable.
                    </p>
                    <label className="flex flex-col gap-1.5">
                      <span className={FIELD_LABEL}>Reason (required)</span>
                      <Input value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 rounded-[10px]" />
                    </label>
                    <DialogFooter>
                      <Button variant="destructive" disabled={!reason.trim()} onClick={() => suspend(user)}>Suspend</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Panel>

          <Panel className="xl:col-span-7">
            <PanelHead title="Their activity" action={<span className={CAPTION}>{activity.filter((a) => a.actor === user.name).length}</span>} />
            <ul className="flex flex-col pb-2">
              {activity.filter((a) => a.actor === user.name).slice(0, 8).map((a) => (
                <Row
                  key={a.id}
                  icon="solar:history-2-linear"
                  tone="neutral"
                  title={a.action}
                  meta={`${a.target} · ${a.note}`}
                  right={<span className={cn(CAPTION, "tabular-nums")}>{fmtDateTime(a.ts)}</span>}
                />
              ))}
              {activity.filter((a) => a.actor === user.name).length === 0 ? (
                <li className={cn("py-4 text-[13px] text-[var(--pms-muted-text)]", GUTTER)}>Nothing recorded for this account.</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-6">
          <PanelHead title="The eleven roles" action={<span className={CAPTION}>{ROLES.length}</span>} />
          <ul className="flex flex-col pb-2">
            {ROLES.map((r) => (
              <Row
                key={r.id}
                title={r.name}
                meta={r.description}
                right={<Pill tone={r.clearance === "restricted" ? "bad" : r.clearance === "authorized" ? "warn" : "info"}>{r.clearance}</Pill>}
              />
            ))}
          </ul>
        </Panel>

        <Panel className="xl:col-span-6">
          <PanelHead title="Institutions" action={<span className={CAPTION}>{INSTITUTIONS.length}</span>} />
          <ul className="flex flex-col pb-2">
            {INSTITUTIONS.map((i) => (
              <Row
                key={i.id}
                badge={i.acronym.slice(0, 2)}
                tone={i.level === "federal" ? "info" : i.level === "state" ? "accent" : "neutral"}
                title={i.name}
                meta={i.acronym}
                right={<Pill tone={i.level === "federal" ? "info" : i.level === "state" ? "accent" : "neutral"}>{i.level}</Pill>}
              />
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
