"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { canOpen, homeFor } from "@/lib/access";
import { useStore } from "@/lib/store";

/**
 * The second half of role gating. Filtering the menu is not enough — typing the
 * URL must be refused too. The decision is derived during render; only the
 * redirect happens in an effect.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const role = useStore((s) => s.role);
  const pathname = usePathname();
  const router = useRouter();
  // The district field app is open to every demo role — it is the entry point
  // of the walk-through, and blocking it strands the reviewer.
  const allowed = pathname.startsWith("/district") || canOpen(role, pathname);

  React.useEffect(() => {
    if (allowed) return;
    toast.error("You do not have permission to open that page");
    router.replace(homeFor(role));
  }, [allowed, role, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
