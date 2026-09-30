"use client";

import * as React from "react";

import { roleById, USERS } from "@/data/users";
import { logAct } from "@/lib/audit";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

/**
 * Break-glass gate for the two restricted pages.
 *
 * Full access is not the same as silent access. Even the Super Administrator
 * states a reason before the page opens; the name, the reason and the time go
 * to the audit log, and the grant lasts for this session only — closing the tab
 * locks the door again.
 */
export function BreakGlass({ page, children }: { page: string; children: React.ReactNode }) {
  const role = useStore((s) => s.role);
  const key = `spm-breakglass:${page}`;
  const [reason, setReason] = React.useState("");
  // Read through useSyncExternalStore so the grant is never set from an effect.
  const [bump, setBump] = React.useState(0);
  const granted = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    React.useCallback(() => {
      void bump;
      try {
        return sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    }, [key, bump]),
    () => false,
  );

  if (granted) return <>{children}</>;

  const valid = reason.trim().length >= 8;

  function unlock() {
    if (!valid) return;
    const actor = USERS.find((u) => u.role === role)?.name ?? "Unknown user";
    logAct({ actor, role, action: "restricted.open", target: page, note: reason.trim() });
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* a blocked store only means the reason is asked for again */
    }
    setBump((n) => n + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-10">
      <div className="rounded-[var(--pms-radius-card)] border border-[color:var(--pms-icon-danger-fg)] bg-[var(--pms-icon-danger-bg)] px-4 py-3">
        <p className="text-[13px] font-semibold text-[var(--pms-icon-danger-fg)]">
          Restricted page. Every view is recorded against your name.
        </p>
      </div>

      <div className="rounded-[var(--pms-radius-card)] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-surface)] p-5">
        <p className="text-[15px] font-semibold text-[var(--pms-text-strong)]">Why do you need to open this page?</p>
        <p className="mt-1 text-[12.5px] text-[var(--pms-muted-text)]">
          {roleById(role).name} · access lasts for this session only
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="State the reason for this access request"
          aria-label="Reason for access"
          className="mt-3 w-full rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-canvas)] px-3 py-2 text-[13px] text-[var(--pms-text)] outline-none focus-visible:border-[color:var(--pms-primary)]"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-[var(--pms-muted-text)]">
            {valid ? "This reason will be written to the audit log." : "At least eight characters."}
          </p>
          <Button onClick={unlock} disabled={!valid}>
            Open page
          </Button>
        </div>
      </div>
    </div>
  );
}
