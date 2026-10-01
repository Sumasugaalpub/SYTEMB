"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useHistory } from "@/components/mobile/actions";
import { useOfficer } from "@/components/mobile/officers";
import { useT } from "@/components/mobile/state";
import { BackButton, Card, Chip, Icon, IconChip, ListenButton, Screen, SHADOW, STATUS_CHIP, TopBar } from "@/components/mobile/ui";

type Filter = "all" | "report" | "event";

/** My past reports — every return and event sent, each opening its receipt. */
export default function ReportsPage() {
  const t = useT();
  const officer = useOfficer();
  const history = useHistory(officer);
  const [filter, setFilter] = React.useState<Filter>("all");
  const shown = history.filter((h) => filter === "all" || h.kind === filter);

  const stats = [
    { icon: "check-circle-linear", tone: "green" as const, n: history.filter((h) => h.status === "approved").length, label: t("La ansixiyay", "Approved") },
    { icon: "clock-circle-linear", tone: "amber" as const, n: history.filter((h) => h.status === "pending" || h.status === "returned").length, label: t("Sugaya", "Waiting") },
    { icon: "danger-triangle-linear", tone: "red" as const, n: history.filter((h) => h.kind === "event").length, label: t("Dhacdooyin", "Events") },
  ];
  const filters: [Filter, string][] = [
    ["all", t("Dhammaan", "All")],
    ["report", t("Rubuc", "Quarterly")],
    ["event", t("Dhacdo", "Events")],
  ];

  return (
    <Screen
      nav="history"
      top={
        <TopBar
          title={t("Warbixinnadaydii", "My reports")}
          left={<BackButton href="/mobile/home" />}
          right={<ListenButton clip="reports" text="Halkan waxaa ku jira warbixinnadii aad dirtay. Riix mid si aad u aragto rasiidkiisa." />}
        />
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.icon} className={cn("flex flex-col gap-2.5 rounded-[16px] bg-[var(--m-card)] p-3.5", SHADOW)}>
            <IconChip icon={s.icon} tone={s.tone} size={36} />
            <span className="text-[26px] leading-none font-extrabold">{s.n}</span>
            <span className="text-[13.5px] leading-[1.2] font-extrabold">{s.label}</span>
          </div>
        ))}
      </div>

      <div role="radiogroup" aria-label={t("Kala sooc", "Filter")} className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "h-[42px] rounded-full px-4 text-[14.5px]",
              filter === value ? "bg-[var(--m-cta)] font-extrabold text-[var(--m-cta-text)]" : cn("bg-[var(--m-card)] font-bold text-[var(--m-text)]", SHADOW),
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length ? (
        shown.map((h) => {
          const chip = STATUS_CHIP[h.status];
          return (
            <Link key={`${h.kind}-${h.id}`} href={h.href} className={cn("flex items-center gap-3 rounded-[16px] bg-[var(--m-card)] p-3.5 text-[var(--m-text)] no-underline", SHADOW)}>
              <IconChip icon={h.kind === "report" ? "clipboard-check-linear" : "danger-triangle-linear"} tone={h.kind === "report" ? "blue" : "red"} />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-[15px] font-extrabold">{h.title}</span>
                <Chip tone={chip.tone}>{t(chip.so, chip.en)}</Chip>
              </span>
              <Icon name="alt-arrow-right-linear" size={20} className="text-[var(--m-faint)]" />
            </Link>
          );
        })
      ) : (
        <Card className="flex-row items-center gap-3">
          <IconChip icon="history-linear" />
          <p className="text-[15px] font-extrabold">{t("Wali wax lama dirin", "Nothing sent yet")}</p>
        </Card>
      )}
    </Screen>
  );
}
