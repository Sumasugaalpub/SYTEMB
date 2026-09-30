"use client";

import Link from "next/link";

import type { ResultArea } from "@/data/resultAreas";
import { indicatorsOf } from "@/data/indicators";
import { useStore } from "@/lib/store";
import { bandOf } from "@/lib/status";
import { getDenominator, scopedReported } from "@/lib/coverage";
import { CARD } from "@/lib/skin";
import { cn } from "@/lib/utils";
import { StatusDot } from "./StatusDot";
import { ProvenanceLine } from "./ProvenanceLine";

/** One of the nine Result Area cards. */
export function ResultAreaCard({ ra }: { ra: ResultArea }) {
  const { bandMode, region, period } = useStore();
  const band = bandOf(ra.score, bandMode);
  const kpis = indicatorsOf(ra.id).length;

  return (
    <Link href={`/result-areas#${ra.id}`} className={cn(CARD, "group flex flex-col p-0.5 no-underline")}>
      <div className="flex flex-1 flex-col rounded-[11px] border border-[#e6e8ee] bg-white px-4 py-4 transition-shadow group-hover:shadow-[0_6px_18px_rgba(16,24,40,.08)] dark:border-[var(--inv-card-border)] dark:bg-[#131418]">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-[21px]" style={{ background: band.soft, color: band.color }}>
            <iconify-icon icon={ra.icon} />
          </span>
          <div className="text-right">
            <div className="text-[26px] leading-none font-bold tracking-[-.02em] text-[var(--inv-value)] tabular-nums">{ra.score}</div>
            <div className={cn("mt-1 text-[11px] font-bold", ra.trend >= 0 ? "text-[var(--inv-green)]" : "text-[var(--inv-red)]")}>{ra.trend >= 0 ? "▲" : "▼"} {Math.abs(ra.trend)} pts</div>
          </div>
        </div>
        <div className="mt-3 font-mono text-[10.5px] font-semibold text-[var(--inv-muted2)]">{ra.code} · {ra.lead} · {kpis} KPIs</div>
        <div className="mt-0.5 text-[14px] leading-[1.3] font-bold text-[var(--inv-value)]">{ra.name}</div>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.45] text-[var(--inv-muted)]">{ra.summary}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--inv-line)]">
          <div className="h-full rounded-full" style={{ width: `${ra.score}%`, background: band.color }} />
        </div>
        <div className="mt-3 flex items-center justify-between"><StatusDot score={ra.score} /></div>
      </div>
      <div className="mx-[7px] mt-[7px] mb-[5px]">
        <ProvenanceLine reported={scopedReported(ra.reported, region)} total={getDenominator(region)} source="District Returns" period={period} quality="verified" />
      </div>
    </Link>
  );
}
