"use client";

import * as React from "react";
import { toast } from "sonner";

import { KNOWLEDGE } from "@/data/knowledge";
import { roleById } from "@/data/users";
import { logAct } from "@/lib/audit";
import { downloadBlob } from "@/lib/download";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GUTTER, GHOST_BUTTON, Panel, PanelHead, Rule, TabTrack } from "@/components/pms/dashboard-sections";
import { CAPTION, Row, toneStyle } from "@/components/pms/exec-kit";
import { EmptyState, PageHeader, Pill, printPage, useExportDialog } from "@/components/pms/ui";

const COLLECTIONS = [
  { k: "all", l: "All" },
  { k: "Research", l: "Research" },
  { k: "Evaluations", l: "Evaluations" },
  { k: "Case studies", l: "Case studies" },
  { k: "Lessons learned", l: "Lessons" },
] as const;

type Collection = (typeof COLLECTIONS)[number]["k"];

const BODY: Record<string, string> = {
  "KB-01": "A district focal point opens the field app, answers six short steps and attaches evidence. The return saves on the phone if there is no signal and sends when there is. The receipt is the officer's proof that the return was filed.",
  "KB-02": "Every indicator carries a method sheet: what it means, how it is calculated, who reports it, how often, and how it may be broken down. Without a published method, a number cannot be compared between districts.",
  "KB-03": "Four labels decide who sees what: public, aggregated public, authorized, restricted. Counts of people below five are never published. Clan-related fields exist on one restricted page only.",
  "KB-04": "Xeer settles most disputes in practice. This note sets out when a case should be referred to the formal courts, and how a referral is recorded without naming the parties.",
  "KB-05": "Two sub-clans clashed over the Goof-Gaduud grazing corridor after the Gu' rains failed. Elders mediated on 8 April; an agreement was signed and the water point repaired. The diya case remains open.",
  "KB-06": "A testimony is only published with written consent from the speaker, or from the family where the speaker has died. Consent can be withdrawn, and withdrawal removes the item from the public museum.",
  "KB-07": "An alert has a level, a named owner and a date. Read the owner column first: an alert with no owner is nobody's job. The closing note is what turns an alert into a record of response.",
  "KB-08": "The museum collects agreements, oral testimony, photographs and objects that document how Somalis made peace. Items are catalogued, cleared for release, and only then shown publicly.",
  "KB-09": "Committees in 42 districts were assessed against their founding terms. Committees with a written mandate and a named treasurer resolved disputes twice as fast. Twelve existed on paper only and have been referred back to the state ministry.",
  "KB-10": "Thirty-one grants issued in Galmudug between 2024 and 2026 were traced to outcome. Grants paid before a reconciliation conference held; grants paid after it lapsed. The evaluation recommends front-loading disbursement and dropping the second tranche.",
  "KB-11": "The Gaalkacyo ceasefire held for 94 days. Monitoring reports arrived on time while fuel was funded and stopped within a week of the fuel line closing. Monitoring cost, not monitoring willingness, was the binding constraint.",
  "KB-12": "A household survey in seventeen Banadir districts sets the 2026 baseline for perceived safety after dark, trust in local authority and willingness to report a dispute. Women reported lower safety in every district; the gap is widest in Daynile.",
  "KB-13": "Two communities on the Afgoye corridor shared one borehole and no schedule. Elders, the district commissioner and the water committee agreed rotating days and a jointly held repair fund. No dispute has been recorded at the point since.",
  "KB-14": "Fishing and port work in Kismaayo is allocated through clan networks, and young men outside those networks are the first recruited by armed groups. A youth employment scheme that hired across clan lines reduced recorded recruitment approaches in two neighbourhoods.",
  "KB-15": "When the Shabelle burst its banks, district focal points kept filing. Returns queued on the phone for up to nine days and sent when the network returned. What failed was not the app but the charging: solar banks are now part of the kit.",
  "KB-16": "Elders settle most killings through diya rather than the courts. Recording a diya settlement without naming the parties is possible and is now the standard: the case, the amount agreed and the date paid, with the clans held on the restricted record only.",
};

export default function KnowledgePage() {
  const [openExport, exportDialog] = useExportDialog();
  const role = useStore((s) => s.role);
  const actor = roleById(role).name;
  const [collection, setCollection] = React.useState<Collection>("all");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const [mine, setMine] = React.useState<string[]>([]);

  const rows = KNOWLEDGE.filter(
    (k) =>
      (collection === "all" || k.category === collection) &&
      (!query || `${k.title} ${k.category}`.toLowerCase().includes(query.toLowerCase())),
  );
  const item = KNOWLEDGE.find((k) => k.id === open);
  const featured = KNOWLEDGE[4];

  function download(id: string, title: string) {
    downloadBlob(new Blob([`${title}\n\n${BODY[id] ?? ""}`], { type: "text/plain" }), `${id}.txt`);
    logAct({ actor, role, action: "knowledge.download", target: id, note: title });
    toast.success("Downloaded");
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {exportDialog}
      <PageHeader onPrint={printPage} onExport={openExport} title="Knowledge & learning" meta="What the system has taught, written down so it is not lost." />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <Panel className={item ? "xl:col-span-7" : "xl:col-span-12"}>
          <PanelHead title="Knowledge library" action={<span className={CAPTION}>{rows.length} of {KNOWLEDGE.length}</span>} />

          <div className={cn("flex flex-col gap-3 pb-3", GUTTER)}>
            <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]">
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={toneStyle("accent")}>
                <iconify-icon icon={featured.icon} className="text-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pms-muted-text)]">Featured</span>
                <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{featured.title}</span>
                <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">{featured.category} · {featured.minutes} minute read</span>
              </span>
              <Button size="sm" className="h-8 shrink-0 rounded-[var(--pms-radius-control)]" onClick={() => setOpen(featured.id)}>Read</Button>
            </div>

            <TabTrack tabs={COLLECTIONS} active={collection} onChange={setCollection} />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the library…"
              className="h-9 rounded-[var(--pms-radius-control)] border-[color:var(--pms-search-border)] bg-[var(--pms-search-bg)] px-3.5 text-[13px]"
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState title="Nothing matches that search" hint="Try a different word or another collection." />
          ) : (
            <ul className="flex flex-col pb-2">
              {rows.map((k) => (
                <Row
                  key={k.id}
                  icon={k.icon}
                  tone="neutral"
                  title={k.title}
                  meta={`${k.id} · ${k.minutes} minute read`}
                  onClick={() => setOpen(k.id)}
                  active={open === k.id}
                  right={<Pill tone="info">{k.category}</Pill>}
                />
              ))}
            </ul>
          )}
        </Panel>

        {item ? (
          <Panel className="xl:col-span-5">
            <PanelHead
              title={item.category}
              action={
                <button type="button" onClick={() => setOpen(null)} className="shrink-0 text-[12px] font-medium text-[var(--pms-muted-text)] transition-colors hover:text-[var(--pms-text-strong)]">
                  Close
                </button>
              }
            />
            <div className={cn("pb-4", GUTTER)}>
              <p className="font-mono text-[11px] text-[var(--pms-muted-text)]">{item.id}</p>
              <h3 className="mt-1 text-[15px] font-semibold text-[var(--pms-text-strong)]">{item.title}</h3>
              <p className="mt-2.5 text-[13px] leading-[1.65] text-[var(--pms-text)]">{BODY[item.id]}</p>
            </div>
            <Rule />
            <div className={cn("flex flex-wrap gap-2 py-4", GUTTER)}>
              <button type="button" className={GHOST_BUTTON} onClick={() => download(item.id, item.title)}>
                Download
                <iconify-icon icon="solar:arrow-right-up-linear" className="text-[15px]" />
              </button>
              <button
                type="button"
                className={GHOST_BUTTON}
                onClick={() => {
                  setMine((m) => (m.includes(item.id) ? m.filter((x) => x !== item.id) : [...m, item.id]));
                  toast.success(mine.includes(item.id) ? "Removed from your collection" : "Added to your collection");
                }}
              >
                {mine.includes(item.id) ? "Remove from collection" : "Add to collection"}
              </button>
              <button type="button" className={GHOST_BUTTON} onClick={() => window.print()}>
                Print
              </button>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
