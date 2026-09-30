"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { REGIONS } from "@/data/geography";
import { TIMELINE } from "@/data/timeline";
import { ENTITY } from "@/lib/entities";
import { STATUS_LABEL, type SubStatus } from "@/lib/flow";
import { fmtDateTime, fmtPeriod } from "@/lib/format";
import type { StoredSubmission } from "@/lib/seed";
import { remindDistrict } from "@/lib/state-actions";
import { useCollection } from "@/lib/use-collection";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/pms/DataTable";
import { PageHeader, Pill, type PillTone, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

const TONE: Record<SubStatus, PillTone> = {
  approved: "good",
  pending: "warn",
  returned: "bad",
  draft: "neutral",
  missing: "accent",
};

const REVIEWER = "Sahra Aadan";

export default function SubmissionsInbox() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const rows = useCollection<StoredSubmission>(ENTITY.submissions);
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const count = (s: SubStatus) => rows.filter((r) => r.status === s).length;
  const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? id;

  const columns: Column<StoredSubmission>[] = [
    { key: "district", header: "District", value: (r) => r.district, cell: (r) => <span className="font-semibold text-[var(--pms-text-strong)]">{r.district}</span> },
    { key: "region", header: "Region", value: (r) => regionName(r.region) },
    { key: "period", header: "Period", value: (r) => fmtPeriod(r.period) },
    { key: "received", header: "Received", value: (r) => r.submittedAt ?? "", cell: (r) => (r.submittedAt ? fmtDateTime(r.submittedAt) : <span className="text-[var(--pms-muted-text)]">—</span>) },
    { key: "disputes", header: "Disputes", value: (r) => r.disputes, align: "right" },
    { key: "resolved", header: "Resolved", value: (r) => r.resolved, align: "right" },
    { key: "status", header: "Status", value: (r) => STATUS_LABEL[r.status as SubStatus], cell: (r) => <Pill tone={TONE[r.status as SubStatus]}>{STATUS_LABEL[r.status as SubStatus]}</Pill> },
    {
      key: "action",
      header: "",
      value: () => "",
      align: "right",
      cell: (r) =>
        r.submittedAt ? (
          <Button size="sm" variant="outline" className="h-8 rounded-[var(--pms-radius-control)]" onClick={(e) => { e.stopPropagation(); router.push(`/state/submissions/${r.id}`); }}>
            Open
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-[var(--pms-radius-control)]"
            onClick={(e) => {
              e.stopPropagation();
              remindDistrict(r.id, r.district, REVIEWER);
              toast.success(`Reminder sent to ${r.district}`);
            }}
          >
            Remind
          </Button>
        ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="Submissions"
        meta={`${fmtPeriod(TIMELINE.period)} · ${rows.filter((r) => r.submittedAt).length} of ${rows.length} districts in`}
      />
      <PmsCard flush>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          exportName={`south-west-${TIMELINE.period}-returns`}
          searchPlaceholder="Search district, region or status…"
          activeFilter={filter}
          onFilter={setFilter}
          onRowClick={(r) => r.submittedAt && router.push(`/state/submissions/${r.id}`)}
          matchFilter={(r, f) => r.status === f}
          empty="No returns match that filter"
          filters={[
            { id: "all", label: "All", count: rows.length },
            { id: "pending", label: "Awaiting review", count: count("pending") },
            { id: "approved", label: "Approved", count: count("approved") },
            { id: "returned", label: "Sent back", count: count("returned") },
            { id: "missing", label: "Late", count: count("missing") },
          ]}
        />
      </PmsCard>
    </div>
  );
}
