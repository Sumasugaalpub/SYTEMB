import { Fragment } from "react";
import {
  BellRing,
  ClipboardCheck,
  Gauge,
  Map as MapIcon,
  Ruler,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Stats bar — ported 1:1 from the PROHAPA staging dashboard.
 * Stat icons in perfect circles (~40px), glyph ~60% of diameter, centered.
 */
const C = {
  barBg: "var(--pms-stat-bar-bg)",
  barRadius: "var(--pms-radius-card)",
  barShadow: "var(--pms-stat-bar-shadow)",
  barBorder: "1px solid var(--pms-hairline-border)",
  statDividerColor: "var(--pms-stat-divider)",
  cellPad: "24px",
  cellMinHeight: "148px",
  iconTextGap: "16px",
  titleToValue: "-4px",
  valueToTrend: "10px",
  label: "var(--pms-muted-text)",
  labelSize: "12px",
  labelLineHeight: "12px",
  value: "var(--pms-stat-value)",
  valueSize: "24px",
  trendSize: "11px",
  trendLineHeight: "14px",
  trendGood: "var(--pms-stat-trend-good)",
  trendBad: "var(--pms-stat-trend-bad)",
  iconCircle: "40px",
  iconGlyph: "24px",
  iconStroke: 1.75,
  iconOffsetY: "9px",
  statDividerInset: "14px",
} as const;

export type StatMetricItem = {
  title: string;
  value: string;
  trend: string;
  trendVariant: "good" | "bad";
  Icon: LucideIcon;
  iconTone: "neutral" | "success" | "info" | "warning" | "danger" | "accent";
};

type StatItem = StatMetricItem;

function iconToneStyle(tone: StatItem["iconTone"]) {
  return {
    backgroundColor: `var(--pms-icon-${tone}-bg)`,
    color: `var(--pms-icon-${tone}-fg)`,
  };
}

const STATS: StatItem[] = [
  {
    title: "Composite score",
    value: "74",
    trend: "+3 vs last quarter",
    trendVariant: "good",
    Icon: Gauge,
    iconTone: "info",
  },
  {
    title: "Districts reported",
    value: "68 / 90",
    trend: "76% coverage",
    trendVariant: "good",
    Icon: ClipboardCheck,
    iconTone: "success",
  },
  {
    title: "Open alerts",
    value: "4",
    trend: "1 overdue",
    trendVariant: "bad",
    Icon: BellRing,
    iconTone: "danger",
  },
  {
    title: "Incidents this period",
    value: "23",
    trend: "6 still ongoing",
    trendVariant: "bad",
    Icon: MapIcon,
    iconTone: "warning",
  },
  {
    title: "Indicators lagging",
    value: "19 / 73",
    trend: "-4 vs last quarter",
    trendVariant: "good",
    Icon: Ruler,
    iconTone: "accent",
  },
];

function StatDivider() {
  return (
    <div
      className="hidden shrink-0 self-stretch px-0 lg:flex lg:w-px lg:flex-col"
      style={{ paddingTop: C.statDividerInset, paddingBottom: C.statDividerInset }}
      aria-hidden
    >
      <div className="min-h-0 flex-1" style={{ width: 1, backgroundColor: C.statDividerColor }} />
    </div>
  );
}

export function StatsMetricsStrip({ items = STATS }: { items?: StatMetricItem[] }) {
  const metrics = items.length ? items : STATS;
  return (
    <section aria-label="Key metrics">
      <div
        className="flex w-full min-w-0 flex-col overflow-hidden lg:flex-row lg:items-stretch"
        style={{
          backgroundColor: C.barBg,
          borderRadius: C.barRadius,
          boxShadow: C.barShadow,
          border: C.barBorder,
        }}
      >
        {metrics.map((stat, index) => {
          const Icon = stat.Icon;
          const trendColor = stat.trendVariant === "good" ? C.trendGood : C.trendBad;
          return (
            <Fragment key={stat.title}>
              <div
                className={cn(
                  "flex min-h-0 min-w-0 flex-1 basis-0 flex-col items-stretch",
                  index < metrics.length - 1 &&
                    "border-b border-[color:var(--pms-hairline-border)] lg:border-b-0",
                )}
                style={{ padding: C.cellPad, minHeight: C.cellMinHeight }}
              >
                <div
                  className="flex min-h-0 min-w-0 flex-1 flex-row items-start"
                  style={{ gap: C.iconTextGap }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{
                      marginTop: C.iconOffsetY,
                      width: C.iconCircle,
                      height: C.iconCircle,
                      minWidth: C.iconCircle,
                      minHeight: C.iconCircle,
                      boxSizing: "border-box",
                      borderRadius: "50%",
                      ...iconToneStyle(stat.iconTone),
                    }}
                  >
                    <Icon
                      className="shrink-0"
                      style={{ width: C.iconGlyph, height: C.iconGlyph }}
                      strokeWidth={C.iconStroke}
                      aria-hidden
                    />
                  </div>

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch">
                    <div className="flex min-w-0 items-center" style={{ minHeight: C.iconCircle }}>
                      <p
                        className="m-0 min-w-0 p-0 font-medium"
                        style={{
                          color: C.label,
                          fontSize: C.labelSize,
                          lineHeight: C.labelLineHeight,
                        }}
                      >
                        {stat.title}
                      </p>
                    </div>
                    <p
                      className="m-0 box-border p-0 font-bold tabular-nums tracking-tight"
                      style={{
                        marginTop: C.titleToValue,
                        color: C.value,
                        fontSize: C.valueSize,
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="m-0 box-border p-0 font-medium"
                      style={{
                        marginTop: C.valueToTrend,
                        color: trendColor,
                        fontSize: C.trendSize,
                        lineHeight: C.trendLineHeight,
                      }}
                    >
                      {stat.trend}
                    </p>
                  </div>
                </div>
              </div>
              {index < metrics.length - 1 ? <StatDivider /> : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
