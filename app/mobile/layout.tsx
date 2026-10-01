import type { Metadata } from "next";

import { MobileShell } from "@/components/mobile/MobileShell";

export const metadata: Metadata = { title: "District App" };

/** Portal 4 — the district field app, mobile first. */
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
