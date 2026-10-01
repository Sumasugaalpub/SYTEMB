"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { sendAll } from "./actions";
import { officerById } from "./officers";
import { useMobileHydrated, useOnline, useOutbox, usePrefs, useSession } from "./state";
import { OfflineStrip } from "./ui";

/** When the signal comes back, whatever is waiting in the outbox is sent. */
function useAutoSync(online: boolean, ready: boolean) {
  const was = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (!ready) return;
    const before = was.current;
    was.current = online;
    // Only a real offline → online change counts, not the first reading.
    if (before !== false || !online || !useOutbox.getState().items.length) return;
    void sendAll(true).then((n) => {
      if (!n) return;
      const en = usePrefs.getState().lang === "en";
      toast.success(en ? `Signal is back — ${n} sent` : `Internetku wuu soo laabtay — ${n} waa la diray`);
    });
  }, [online, ready]);
}

/**
 * Portal 4 frame. On a phone the app fills the screen; on a computer it is
 * drawn inside a phone so the demo reads correctly. Every page inside is a
 * fixed top bar, a scrolling middle and a fixed bottom nav.
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  const ready = useMobileHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const signedIn = Boolean(officerById(useSession((s) => s.officerId)));
  const lang = usePrefs((s) => s.lang);
  const online = useOnline();
  const open = pathname === "/mobile/login";

  React.useEffect(() => {
    if (ready && !open && !signedIn) router.replace("/mobile/login");
  }, [ready, open, signedIn, router]);

  useAutoSync(online, ready);

  return (
    <div lang={lang} className="m-app flex h-[calc(100dvh/0.9)] items-center justify-center bg-[var(--m-page)] font-display text-[var(--m-text)] sm:p-6">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--m-bg)] sm:h-[min(864px,100%)] sm:w-[410px] sm:rounded-[46px] sm:border-[10px] sm:border-[#171a20] sm:shadow-[0_30px_70px_rgba(16,24,40,.25)]">
        {!online ? <OfflineStrip /> : null}
        {ready && (open || signedIn) ? children : null}
      </div>
    </div>
  );
}
