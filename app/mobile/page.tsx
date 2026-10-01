"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/components/mobile/state";

/** /mobile opens Home for a signed-in officer, Sign in otherwise. */
export default function MobileIndex() {
  const router = useRouter();
  const signedIn = useSession((s) => s.officerId !== null);
  React.useEffect(() => {
    router.replace(signedIn ? "/mobile/home" : "/mobile/login");
  }, [signedIn, router]);
  return null;
}
