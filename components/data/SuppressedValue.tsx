"use client";

import { useTranslations } from "next-intl";

import { fmtValue } from "@/lib/format";
import { useSuppressionThreshold } from "@/lib/settings";
import { isSuppressed } from "@/lib/suppression";
import { NoDataBlock } from "./NoDataBlock";

/** Renders a value, "fewer than <threshold>" for small people counts, or No Data. */
export function SuppressedValue({ value, unit, peopleCount }: { value: number | null; unit: string; peopleCount: boolean }) {
  const t = useTranslations("common");
  const threshold = useSuppressionThreshold();
  if (value === null) return <NoDataBlock compact className="inline-flex" />;
  if (isSuppressed(value, peopleCount, threshold))
    return (
      <span
        className="inline-flex items-center gap-1 text-[var(--inv-muted)] italic"
        title={`People counts below ${threshold} are suppressed \u2014 too few records`}
      >
        <iconify-icon icon="solar:eye-closed-linear" className="text-[13px]" />
        {t("suppressed", { n: threshold })}
      </span>
    );
  return <>{fmtValue(value, unit)}</>;
}
