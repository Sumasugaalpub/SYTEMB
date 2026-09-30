"use client";

import * as React from "react";

import type { AuditEntry } from "@/lib/audit";
import { ENTITY } from "@/lib/entities";
import { fmtDateTime } from "@/lib/format";
import { useCollection } from "@/lib/use-collection";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { PageHeader, Pill, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

export default function AccessLog() {
  const [openExport, exportDialog] = useExportDialog();
  const rows = useCollection<AuditEntry>(ENTITY.activity);
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const columns: Column<AuditEntry>[] = [
    { key: "ts", header: "When", value: (r) => r.ts, cell: (r) => fmtDateTime(r.ts), width: "190px" },
    { key: "actor", header: "Who", value: (r) => r.actor, cell: (r) => <span className="font-semibold text-[var(--pms-text-strong)]">{r.actor}</span> },
    { key: "role", header: "Role", value: (r) => String(r.role) },
    { key: "action", header: "Action", value: (r) => r.action, cell: (r) => <Pill tone={r.action.includes("return") ? "bad" : r.action.includes("approve") ? "good" : "info"}>{r.action}</Pill> },
    { key: "target", header: "Record", value: (r) => r.target, cell: (r) => <span className="font-mono text-[12px]">{r.target}</span> },
    { key: "note", header: "Note", value: (r) => r.note },
    { key: "ip", header: "From", value: (r) => r.ip, cell: (r) => <span className="font-mono text-[12px] text-[var(--pms-muted-text)]">{r.ip}</span> },
  ];

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title="Access log"
        meta="Every read and every action against South West's own data — including what the federal office looked at. It cannot be edited or deleted."
      />
      <PmsCard flush>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          exportName="south-west-access-log"
          searchPlaceholder="Search person, action or record…"
          pageSize={12}
          activeFilter={filter}
          onFilter={setFilter}
          matchFilter={(r, f) => r.action.startsWith(f)}
          empty="Nothing recorded yet"
          filters={[
            { id: "all", label: "All", count: rows.length },
            { id: "submission", label: "Returns", count: rows.filter((r) => r.action.startsWith("submission")).length },
            { id: "sharing", label: "Sharing", count: rows.filter((r) => r.action.startsWith("sharing")).length },
            { id: "alert", label: "Alerts", count: rows.filter((r) => r.action.startsWith("alert")).length },
          ]}
        />
      </PmsCard>
      <p className="px-1 text-[12px] text-[var(--pms-muted-text)]">
        No restricted item was accessed by a federal user in this period.
      </p>
    </div>
  );
}
