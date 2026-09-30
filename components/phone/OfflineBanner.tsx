"use client";

import { useTranslations } from "next-intl";

export function OfflineBanner() {
  const t = useTranslations("district");
  return (
    <div className="flex items-center gap-2 bg-[#fdf3e1] px-4 py-2 text-[12px] font-semibold text-[var(--inv-amber)] dark:bg-[rgba(217,138,6,.14)]">
      <iconify-icon icon="solar:cloud-cross-linear" className="text-[16px]" />
      {t("offline")}
    </div>
  );
}
