"use client";

import type { RoleId } from "@/data/users";

/**
 * Role-gated navigation, enforced twice: the menu is filtered, and the route is
 * blocked. Hiding a link is not access control.
 */
export const ROLE_PAGES: Record<RoleId, string[]> = {
  "super-admin": ["*"],
  "mel-admin": ["*"],
  "federal-admin": [
    "executive", "welcome", "brief", "framework", "result-areas", "interventions",
    "indicators", "national-indicators", "conflict-navigator", "map", "data-explorer",
    "analytics", "evidence", "verify", "knowledge", "reports", "users", "settings", "audit-log", "support",
    "state", "state/submissions", "state/sharing", "state/access-log", "state/map",
  ],
  "state-admin": ["state", "state/submissions", "state/sharing", "state/access-log", "state/map", "district", "support"],
  "district-admin": ["district", "support"],
  "data-entry": ["district", "state", "state/submissions", "support"],
  reviewer: ["state", "state/submissions", "state/map", "district", "support"],
  approver: ["state", "state/submissions", "state/sharing", "state/access-log", "state/map", "support"],
  "executive-user": [
    "executive", "welcome", "brief", "framework", "result-areas", "interventions",
    "indicators", "national-indicators", "conflict-navigator", "map",
    "analytics", "evidence", "verify", "knowledge", "reports", "support",
  ],
  partner: ["executive", "welcome", "interventions", "indicators", "evidence", "verify", "knowledge", "support"],
  "read-only": ["welcome", "brief", "result-areas", "national-indicators", "map", "knowledge"],
};

/** Path → the permission slug used above. */
export function slugOf(pathname: string): string {
  const clean = pathname.replace(/^\/+/, "").split("?")[0];
  if (clean.startsWith("state/")) return clean.split("/").slice(0, 2).join("/");
  if (clean.startsWith("district")) return "district";
  return clean.split("/")[0] || "executive";
}

export function canOpen(role: RoleId, pathname: string): boolean {
  const slug = slugOf(pathname);
  const list = ROLE_PAGES[role] ?? [];
  if (list.includes(`!${slug}`)) return false;
  if (list.includes("*")) return true;
  return list.includes(slug);
}

/** Where a blocked role gets sent instead. */
export function homeFor(role: RoleId): string {
  if (role === "district-admin" || role === "data-entry") return "/district";
  if (role === "state-admin" || role === "reviewer" || role === "approver") return "/state";
  if (role === "read-only") return "/welcome";
  return "/executive";
}
