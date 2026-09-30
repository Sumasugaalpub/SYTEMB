"use client";

import { useStore } from "@/lib/store";
import { roleById } from "@/data/users";
import { canSee, type Visibility } from "@/lib/visibility";
import { EMPTYC, EMPTYC_S, EMPTYC_T, BIGCARD } from "@/lib/skin";

/** Page-level padlock: renders children only when the current role has clearance. */
export function RestrictedGate({ level = "restricted", children }: { level?: Visibility; children: React.ReactNode }) {
  const role = useStore((s) => s.role);
  const r = roleById(role);
  if (canSee(r.clearance, level)) return <>{children}</>;
  return (
    <div className={BIGCARD}>
      <div className={EMPTYC}>
        <div className="mx-auto mb-[14px] grid size-[56px] place-items-center rounded-[15px] bg-[#fdecec] text-[27px] text-[var(--inv-red)] dark:bg-[rgba(217,74,74,.14)]"><iconify-icon icon="solar:lock-keyhole-bold" /></div>
        <div className={EMPTYC_T}>Restricted area</div>
        <div className={EMPTYC_S}>Your role <b>{r.name}</b> does not hold <b>{level}</b> clearance. Switch role from the account menu to continue the demo.</div>
      </div>
    </div>
  );
}
