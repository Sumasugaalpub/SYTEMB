"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { IconRail, SidePanel } from "./SideNav";
import { activeGroupKey, type RailGroup } from "./nav";
import { PMS_FRAME_PADDING_CLASS } from "@/components/pms/layout-tokens";
import { TopBar } from "./TopBar";
import { Breadcrumb } from "./Breadcrumb";

/** Double sidebar shell: 72px icon rail · 208px contextual panel · blank main. */
export function AppShell({
  groups,
  cta,
  children,
}: {
  groups: RailGroup[];
  cta?: { label: string; href: string };
  children?: React.ReactNode;
}) {
  const collapsed = useStore((s) => s.isSidebarCollapsed);
  const pathname = usePathname();
  const t = useTranslations("app");
  // Rail selection is view state only; it resets to the route's own group on navigation.
  const [picked, setPicked] = React.useState<{ path: string; key: string } | null>(null);
  const active = picked && picked.path === pathname ? picked.key : activeGroupKey(groups, pathname);
  const group = groups.find((g) => g.key === active) ?? groups[0];

  return (
    <div
      data-collapsed={collapsed ? "" : undefined}
      className={cn(
        "group/shell m-0 grid h-[calc(100vh/0.9)] w-full min-w-0 flex-none overflow-hidden bg-[var(--inv-app)] p-0 transition-[grid-template-columns] duration-[320ms] ease-[cubic-bezier(.4,0,.2,1)] max-[900px]:grid-cols-[1fr] print:block print:h-auto [&>*]:min-h-0",
        collapsed ? "grid-cols-[72px_0px_1fr]" : "grid-cols-[72px_208px_1fr]",
      )}
    >
      <a href="#main-content" className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:shadow">
        {t("skip")}
      </a>
      <IconRail groups={groups} activeKey={active} onSelect={(key) => setPicked({ path: pathname, key })} />
      <SidePanel group={group} groups={groups} cta={cta} />
      <main
        id="main-content"
        className="mt-0 min-h-0 overflow-y-auto bg-[var(--pms-canvas)] print:overflow-visible print:bg-white"
      >
        <TopBar />
        <div className={cn(PMS_FRAME_PADDING_CLASS, "pt-0 lg:pt-0")}>
          <div className="mb-3 print:hidden">
            <Breadcrumb />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
