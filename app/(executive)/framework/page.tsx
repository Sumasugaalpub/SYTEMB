"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { HIERARCHY, type Node } from "@/data/hierarchy";
import { INDICATORS } from "@/data/indicators";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GUTTER, Panel } from "@/components/pms/dashboard-sections";
import { PageHeader, printPage, useExportDialog } from "@/components/pms/ui";

type Tone = "neutral" | "success" | "info" | "warning" | "accent";

const LEVEL_META: Record<Node["level"], { label: string; tone: Tone; icon: string }> = {
  CL: { label: "Result area", tone: "info", icon: "solar:widget-5-linear" },
  OBJ: { label: "Objective", tone: "accent", icon: "solar:target-linear" },
  FUN: { label: "Function", tone: "neutral", icon: "solar:settings-linear" },
  ACT: { label: "Action", tone: "warning", icon: "solar:checklist-minimalistic-linear" },
  KPI: { label: "Indicator", tone: "success", icon: "solar:ruler-pen-linear" },
};

const TILE =
  "rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]";

function toneStyle(tone: Tone) {
  return { backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` };
}

function countKpis(n: Node): number {
  return n.level === "KPI" ? 1 : n.children.reduce((a, c) => a + countKpis(c), 0);
}
function countWithData(n: Node): number {
  if (n.level === "KPI") return INDICATORS.find((k) => k.id === n.id)?.value !== null ? 1 : 0;
  return n.children.reduce((a, c) => a + countWithData(c), 0);
}
function countLevel(nodes: Node[], level: Node["level"]): number {
  return nodes.reduce((a, n) => a + (n.level === level ? 1 : 0) + countLevel(n.children, level), 0);
}
function matches(n: Node, q: string): boolean {
  if (!q) return true;
  const hit = `${n.id} ${n.name}`.toLowerCase().includes(q);
  return hit || n.children.some((c) => matches(c, q));
}

function Branch({
  node,
  open,
  toggle,
  query,
}: {
  node: Node;
  open: Set<string>;
  toggle: (id: string) => void;
  query: string;
}) {
  const router = useRouter();
  if (!matches(node, query)) return null;

  const meta = LEVEL_META[node.level];
  const isOpen = open.has(node.id) || query.length > 0;
  const total = countKpis(node);
  const withData = countWithData(node);
  const unconfirmed = node.level !== "CL" && node.level !== "KPI";

  return (
    <li>
      <div className="flex min-w-0 items-center gap-2 rounded-[8px] py-1 pr-1 transition-colors hover:bg-[var(--pms-row-hover)]">
        {node.children.length ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="grid size-5 shrink-0 place-items-center rounded-[6px] text-[var(--pms-muted-text)] hover:text-[var(--pms-text-strong)]"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <iconify-icon icon={isOpen ? "solar:alt-arrow-down-linear" : "solar:alt-arrow-right-linear"} className="text-[13px]" />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <span
          className="grid size-6 shrink-0 place-items-center rounded-[8px]"
          style={toneStyle(meta.tone)}
          title={meta.label}
        >
          <iconify-icon icon={meta.icon} className="text-[12px]" />
        </span>

        <span className="hidden shrink-0 whitespace-nowrap font-mono text-[11px] text-[var(--pms-muted-text)] sm:inline">
          {node.id}
        </span>

        <button
          type="button"
          onClick={() => node.level === "KPI" && router.push(`/indicators/${node.id}`)}
          className={cn(
            "min-w-0 flex-1 truncate text-left text-[13px]",
            node.level === "CL" ? "font-semibold text-[var(--pms-text-strong)]" : "text-[var(--pms-text)]",
            unconfirmed && "text-[var(--pms-muted-text)]",
            node.level === "KPI" && "hover:underline",
          )}
        >
          {node.name}
        </button>

        {unconfirmed ? (
          <span className="hidden shrink-0 rounded-full bg-[var(--pms-segmented-track)] px-2 py-0.5 text-[10px] font-medium text-[var(--pms-muted-text)] lg:inline">
            unconfirmed
          </span>
        ) : null}

        {node.level !== "KPI" ? (
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--pms-muted-text)]">
            {withData}/{total}
            <span className="hidden md:inline"> with data</span>
          </span>
        ) : null}
      </div>

      {isOpen && node.children.length ? (
        <ul className="ml-[9px] border-l border-[color:var(--pms-divide)] pl-2.5">
          {node.children.map((c) => (
            <Branch key={c.id} node={c} open={open} toggle={toggle} query={query} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function allIds(nodes: Node[]): string[] {
  return nodes.flatMap((n) => [n.id, ...allIds(n.children)]);
}

export default function FrameworkPage() {
  const [openExport, exportDialog] = useExportDialog();
  const [open, setOpen] = React.useState<Set<string>>(new Set(HIERARCHY.map((n) => n.id)));
  const [query, setQuery] = React.useState("");

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const kpis = HIERARCHY.reduce((a, n) => a + countKpis(n), 0);
  const withData = HIERARCHY.reduce((a, n) => a + countWithData(n), 0);

  const tiles: { icon: string; tone: Tone; label: string; value: number; pill: string }[] = [
    { icon: "solar:widget-5-linear", tone: "info", label: "Result areas", value: HIERARCHY.length, pill: "CL" },
    { icon: "solar:target-linear", tone: "accent", label: "Objectives", value: countLevel(HIERARCHY, "OBJ"), pill: "OBJ" },
    { icon: "solar:checklist-minimalistic-linear", tone: "warning", label: "Actions", value: countLevel(HIERARCHY, "ACT"), pill: "ACT" },
    {
      icon: "solar:ruler-pen-linear",
      tone: "success",
      label: "Indicators with data",
      value: withData,
      pill: `${Math.round((withData / Math.max(1, kpis)) * 100)}%`,
    },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title="Framework"
        meta="Result area → objective → function → action → indicator, using the workbook's own identifiers."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => setOpen(new Set(allIds(HIERARCHY)))}>
              Expand all
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => setOpen(new Set())}>
              Collapse all
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={TILE}>
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle(t.tone)}>
                <iconify-icon icon={t.icon} className="text-[15px]" />
              </span>
              <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{t.label}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-xl font-bold tabular-nums tracking-tight text-[var(--pms-text-strong)]">{t.value}</span>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums" style={toneStyle(t.tone)}>
                {t.pill}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Panel>
        {/* Card header — title left, the search that drives the tree right. */}
        <div className={cn("flex shrink-0 flex-wrap items-center justify-between gap-3 pb-3 pt-5", GUTTER)}>
          <h2 className="text-[15px] font-semibold text-[var(--pms-text-strong)]">Framework tree</h2>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value.toLowerCase())}
            placeholder="Search by name or identifier…"
            className="h-9 w-full max-w-full rounded-[var(--pms-radius-control)] border-[color:var(--pms-search-border)] bg-[var(--pms-search-bg)] px-3.5 text-[13px] sm:w-64"
          />
        </div>

        <div className="border-t border-[color:var(--pms-divide)]" />

        <ul className={cn("min-w-0 py-2.5", GUTTER)}>
          {HIERARCHY.map((n) => (
            <Branch key={n.id} node={n} open={open} toggle={toggle} query={query} />
          ))}
        </ul>
      </Panel>
    </div>
  );
}
