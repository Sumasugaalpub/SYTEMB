import { AppShell } from "@/components/shell/AppShell";
import { STATE_GROUPS } from "@/components/shell/nav";
import { RouteGuard } from "@/components/system/RouteGuard";

export default function StateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell groups={STATE_GROUPS} cta={{ label: "Review inbox", href: "/state/submissions" }}>
      <RouteGuard>{children}</RouteGuard>
    </AppShell>
  );
}
