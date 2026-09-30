import { AppShell } from "@/components/shell/AppShell";
import { EXECUTIVE_GROUPS } from "@/components/shell/nav";
import { RouteGuard } from "@/components/system/RouteGuard";

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell groups={EXECUTIVE_GROUPS} cta={{ label: "+ New Report", href: "/reports" }}>
      <RouteGuard>{children}</RouteGuard>
    </AppShell>
  );
}
