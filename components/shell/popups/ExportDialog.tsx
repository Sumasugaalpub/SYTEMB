"use client";

import * as React from "react";
import { toast } from "sonner";

import { RESULT_AREAS } from "@/data/resultAreas";
import { roleById } from "@/data/users";
import { logAct } from "@/lib/audit";
import { downloadCSV, downloadPDF } from "@/lib/download";
import { fmtPeriod } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FORMATS = ["PDF", "Excel", "CSV"] as const;
const SCOPES = ["This page", "Current filter", "Everything visible"] as const;

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { role, period, region } = useStore();
  const [format, setFormat] = React.useState<(typeof FORMATS)[number]>("PDF");
  const [scope, setScope] = React.useState<(typeof SCOPES)[number]>("This page");
  const [busy, setBusy] = React.useState(false);

  async function run() {
    setBusy(true);
    const rows = RESULT_AREAS.map((r) => ({
      Code: r.code,
      "Result area": r.name,
      Lead: r.lead,
      Score: r.score,
      Change: r.trend,
      Coverage: `${r.reported} of 90 districts`,
      Source: "District Returns",
      Period: fmtPeriod(period),
    }));

    if (format === "PDF") {
      downloadPDF(
        `Raad-Raac export — ${fmtPeriod(period)}`,
        [
          `Scope: ${scope} · Region: ${region}`,
          `Coverage: 68 of 90 districts reported · District Returns · ${fmtPeriod(period)}`,
          "",
          ...RESULT_AREAS.map((r) => `${r.code}  ${r.name} — ${r.score} (${r.trend >= 0 ? "+" : ""}${r.trend})`),
        ],
        `raad-raac-${period}.pdf`,
      );
    } else {
      downloadCSV(rows, `raad-raac-${period}.${format === "Excel" ? "xls.csv" : "csv"}`);
    }

    logAct({ actor: roleById(role).name, role, action: "export", target: scope, note: `${format} · ${region} · ${period}` });
    setBusy(false);
    onOpenChange(false);
    toast.success(`Exported as ${format}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[var(--pms-text-strong)]">Format</p>
            <div className="grid grid-cols-3 gap-1 rounded-[var(--pms-radius-control)] bg-[var(--pms-segmented-track)] p-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`h-9 rounded-[var(--pms-radius-control)] text-sm font-medium transition-colors ${
                    format === f ? "bg-[var(--pms-segmented-thumb)] text-[var(--pms-text-strong)] shadow-sm" : "text-[var(--pms-muted-text)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[var(--pms-text-strong)]">Scope</p>
            <div className="flex flex-col gap-1.5">
              {SCOPES.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setScope(sc)}
                  className={`rounded-[10px] border px-3.5 py-2 text-left text-[13px] transition-colors ${
                    scope === sc
                      ? "border-[var(--pms-primary)] bg-[var(--pms-icon-info-bg)] font-semibold text-[var(--pms-text-strong)]"
                      : "border-[color:var(--pms-hairline-border)] text-[var(--pms-text)] hover:bg-[var(--pms-row-hover)]"
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[var(--pms-segmented-track)] px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-[var(--pms-text)]">Include origin line</span>
            <Switch checked disabled aria-label="Include origin line" />
          </div>

          <p className="text-[12px] leading-[1.5] text-[var(--pms-muted-text)]">
            Exports carry the origin line and are recorded in the audit log.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={run} disabled={busy}>{busy ? "Exporting…" : "Export"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
