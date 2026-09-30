"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { USERS } from "@/data/users";
import type { AuditEntry } from "@/lib/audit";
import { ENTITY } from "@/lib/entities";
import { fmtDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { GUTTER, Panel } from "@/components/pms/dashboard-sections";
import { CAPTION } from "@/components/pms/exec-kit";
import { PageHeader, Pill, printPage, useExportDialog } from "@/components/pms/ui";

/**
 * Page 21 — the federal audit log (module M12). Every action across all three
 * portals, in one place that nobody can edit. `?mine=1` narrows it to the
 * signed-in person, which is what the account menu's "My activity" opens.
 */
export default function AuditLogPage() {
  const params = useSearchParams();
  const role = useStore((s) => s.role);
  const [openExport, exportDialog] = useExportDialog();
  const all = useCollection<AuditEntry>(ENTITY.activity);
  const [mine, setMine] = React.useState(params.get("mine") === "1");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const me = USERS.find((u) => u.role === role)?.name ?? "";
  const rows = mine ? all.filter((r) => r.actor === me) : all;

  const columns: Column<AuditEntry>[] = [
    { key: "ts", header: "When", value: (r) => r.ts, cell: (r) => <span className="tabular-nums text-[var(--pms-muted-text)]">{fmtDateTime(r.ts)}</span>, width: "180px" },
    {
      key: "actor",
      header: "Who",
      value: (r) => r.actor,
      cell: (r) => <span className="font-semibold text-[var(--pms-text-strong)]">{r.actor}</span>,
    },
    { key: "role", header: "Role", value: (r) => String(r.role) },
    {
      key: "action",
      header: "Action",
      value: (r) => r.action,
      cell: (r) => (
        <Pill
          tone={
            r.action.startsWith("restricted")
              ? "bad"
              : r.action.includes("return")
                ? "warn"
                : r.action.includes("approve")
                  ? "good"
                  : "info"
          }
        >
          {r.action}
        </Pill>
      ),
    },
    { key: "target", header: "Record", value: (r) => r.target, cell: (r) => <span className="font-mono text-[12px]">{r.target}</span> },
    { key: "note", header: "Note", value: (r) => r.note },
    { key: "ip", header: "From", value: (r) => r.ip, cell: (r) => <span className="font-mono text-[12px] text-[var(--pms-muted-text)]">{r.ip}</span> },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}
      <PageHeader
        title={mine ? "My activity" : "Audit log"}
        meta={
          mine
            ? "Everything recorded against your name. It cannot be edited or deleted."
            : "Every action across all three portals. It cannot be edited or deleted."
        }
        onPrint={printPage}
        onExport={openExport}
      />

      <Panel>
        <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 pt-5", GUTTER)}>
          <h2 className="min-w-0 shrink-0 text-[15px] font-semibold text-[var(--pms-text-strong)]">
            {mine ? "My activity" : "Every recorded action"}
          </h2>
          <span className={cn(CAPTION, "hidden tabular-nums sm:inline")}>{rows.length} entries</span>
          <button
            type="button"
            onClick={() => setMine((m) => !m)}
            aria-pressed={mine}
            className="ml-auto inline-flex h-8 shrink-0 items-center gap-2 rounded-[var(--pms-radius-control)] border border-[color:var(--pms-icon-button-border)] px-3 text-[12px] font-medium text-[var(--pms-text)] transition-colors hover:bg-[var(--pms-row-hover)]"
          >
            <iconify-icon icon={mine ? "solar:users-group-rounded-linear" : "solar:user-linear"} className="text-[15px]" />
            {mine ? "Show everyone" : "Only my activity"}
          </button>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          exportName={mine ? "my-activity" : "federal-audit-log"}
          searchPlaceholder="Search person, action or record…"
          pageSize={14}
          empty="Nothing recorded yet."
        />
      </Panel>
    </div>
  );
}
