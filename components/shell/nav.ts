/**
 * Two-level shell navigation (icon rail + contextual panel), same pattern as the
 * Inventory System. Labels are i18n keys under `nav.*`; groups under `groups.*`.
 */
export type NavItem = { key: string; href: string; icon: string; num?: number; restricted?: boolean };
export type RailGroup = { key: string; icon: string; items: NavItem[]; bottom?: boolean };

export const EXECUTIVE_GROUPS: RailGroup[] = [
  {
    key: "overview",
    icon: "solar:home-smile-linear",
    items: [
      { key: "executive", href: "/executive", icon: "solar:home-smile-linear", num: 1 },
      { key: "welcome", href: "/welcome", icon: "solar:hand-heart-linear", num: 2 },
      { key: "brief", href: "/brief", icon: "solar:printer-minimalistic-linear", num: 3 },
    ],
  },
  {
    key: "framework",
    icon: "solar:widget-5-linear",
    items: [
      { key: "framework", href: "/framework", icon: "solar:structure-linear", num: 4 },
      { key: "result-areas", href: "/result-areas", icon: "solar:widget-5-linear", num: 5 },
      { key: "interventions", href: "/interventions", icon: "solar:case-round-linear", num: 6 },
      { key: "indicators", href: "/indicators", icon: "solar:ruler-pen-linear", num: 7 },
      { key: "national-indicators", href: "/national-indicators", icon: "solar:graph-up-linear", num: 8 },
    ],
  },
  {
    key: "conflict",
    icon: "solar:shield-warning-linear",
    items: [
      { key: "conflict-navigator", href: "/conflict-navigator", icon: "solar:compass-linear", num: 9 },
      { key: "early-warning", href: "/early-warning", icon: "solar:bell-bing-linear", num: 10, restricted: true },
      { key: "early-response", href: "/early-response", icon: "solar:shield-check-linear", num: 10, restricted: true },
      { key: "conflict-intelligence", href: "/conflict-intelligence", icon: "solar:eye-scan-linear", num: 11, restricted: true },
      { key: "map", href: "/map", icon: "solar:map-linear", num: 12 },
    ],
  },
  {
    key: "data",
    icon: "solar:chart-square-linear",
    items: [
      { key: "data-explorer", href: "/data-explorer", icon: "solar:database-linear", num: 13 },
      { key: "analytics", href: "/analytics", icon: "solar:chart-square-linear", num: 14 },
    ],
  },
  {
    key: "knowledge",
    icon: "solar:library-linear",
    items: [
      { key: "evidence", href: "/evidence", icon: "solar:gallery-wide-linear", num: 15 },
      { key: "knowledge", href: "/knowledge", icon: "solar:book-bookmark-linear", num: 16 },
      { key: "reports", href: "/reports", icon: "solar:document-text-linear", num: 17 },
      { key: "verify", href: "/verify", icon: "solar:qr-code-linear" },
    ],
  },
  {
    key: "admin",
    icon: "solar:settings-linear",
    bottom: true,
    items: [
      { key: "users", href: "/users", icon: "solar:shield-user-linear", num: 18 },
      { key: "settings", href: "/settings", icon: "solar:settings-linear", num: 19 },
      { key: "support", href: "/support", icon: "solar:chat-round-help-linear", num: 20 },
    ],
  },
];

export const STATE_GROUPS: RailGroup[] = [
  {
    key: "state-overview",
    icon: "solar:home-smile-linear",
    items: [
      { key: "state", href: "/state", icon: "solar:home-smile-linear", num: 1 },
      { key: "state-map", href: "/state/map", icon: "solar:map-linear", num: 7 },
    ],
  },
  {
    key: "state-inbox",
    icon: "solar:inbox-linear",
    items: [{ key: "submissions", href: "/state/submissions", icon: "solar:inbox-linear", num: 2 }],
  },
  {
    key: "state-governance",
    icon: "solar:shield-keyhole-linear",
    bottom: true,
    items: [
      { key: "sharing", href: "/state/sharing", icon: "solar:shield-keyhole-linear", num: 5 },
      { key: "access-log", href: "/state/access-log", icon: "solar:history-2-linear", num: 6 },
    ],
  },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/state") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeGroupKey(groups: RailGroup[], pathname: string): string {
  let best: { key: string; len: number } | null = null;
  for (const g of groups)
    for (const i of g.items)
      if (isActive(i.href, pathname) && (!best || i.href.length > best.len)) best = { key: g.key, len: i.href.length };
  return best?.key ?? groups[0].key;
}
