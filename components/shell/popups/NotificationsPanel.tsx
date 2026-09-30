"use client";

import Link from "next/link";
import { toast } from "sonner";

import type { Notification } from "@/data/notifications";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { fmtDateTime } from "@/lib/format";
import { useCollection } from "@/lib/use-collection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconChip } from "@/components/pms/ui";

const TONE = { brand: "info", amber: "warning", red: "danger", blue: "info" } as const;

/** The three things a desk actually works through, in the order it works them. */
const GROUPS = [
  { key: "action", label: "Needs action", match: (n: Notification) => n.tone === "red" },
  { key: "approval", label: "Awaiting approval", match: (n: Notification) => n.tone === "amber" || n.tone === "brand" },
  { key: "late", label: "Late districts", match: (n: Notification) => n.tone === "blue" },
] as const;

export function NotificationsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const rows = useCollection<Notification>(ENTITY.notifications);
  const unread = rows.filter((n) => n.unread).length;
  const grouped = GROUPS.map((g) => ({ ...g, items: rows.filter(g.match) })).filter((g) => g.items.length > 0);
  const rest = rows.filter((n) => !GROUPS.some((g) => g.match(n)));
  const sections = rest.length ? [...grouped, { key: "other", label: "Other", items: rest }] : grouped;

  function markAll() {
    db.set(ENTITY.notifications, rows.map((n) => ({ ...n, unread: false })));
    toast.success("All notifications marked as read");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notifications {unread ? `· ${unread} unread` : ""}</DialogTitle>
        </DialogHeader>

        <div className="-mx-6 max-h-[60vh] overflow-y-auto">
          {sections.map((section) => (
            <section key={section.key}>
              <p className="sticky top-0 z-[1] bg-[var(--pms-surface)] px-6 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]">
                {section.label} · {section.items.length}
              </p>
              <ul>
                {section.items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        db.update<Notification>(ENTITY.notifications, n.id, { unread: false });
                        onOpenChange(false);
                      }}
                      className="flex items-start gap-3 px-6 py-2.5 no-underline transition-colors hover:bg-[var(--pms-row-hover)]"
                    >
                      <IconChip icon={n.icon} tone={TONE[n.tone]} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-[var(--pms-muted-text)]">
                            {fmtDateTime(n.at).split(",")[0]}
                          </span>
                          {n.unread ? <span className="size-1.5 shrink-0 rounded-full bg-[var(--pms-danger)]" /> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--pms-muted-text)]">{n.body}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={markAll}>Mark all as read</Button>
          <Link
            href="/settings"
            onClick={() => onOpenChange(false)}
            className="text-sm font-medium text-[var(--pms-muted-text)] no-underline hover:text-[var(--pms-text-strong)]"
          >
            Notification settings
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
