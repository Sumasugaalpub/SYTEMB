/** Visibility ladder — each level includes everything below it. */
export type Visibility = "public" | "aggregated" | "authorized" | "restricted";

export const VISIBILITY_ORDER: Visibility[] = ["public", "aggregated", "authorized", "restricted"];

export const VISIBILITY_META: Record<Visibility, { label: string; icon: string; tone: string }> = {
  public: { label: "Public", icon: "solar:earth-linear", tone: "bg-[#e7f6ee] text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.16)]" },
  aggregated: { label: "Aggregated", icon: "solar:layers-minimalistic-linear", tone: "bg-[#eaf1fd] text-[var(--inv-blue)] dark:bg-[rgba(47,119,230,.16)]" },
  authorized: { label: "Authorized", icon: "solar:shield-user-linear", tone: "bg-[#fdf3e1] text-[var(--inv-amber)] dark:bg-[rgba(217,138,6,.16)]" },
  restricted: { label: "Restricted", icon: "solar:lock-keyhole-linear", tone: "bg-[#fdecec] text-[var(--inv-red)] dark:bg-[rgba(217,74,74,.16)]" },
};

export function canSee(clearance: Visibility, level: Visibility): boolean {
  return VISIBILITY_ORDER.indexOf(clearance) >= VISIBILITY_ORDER.indexOf(level);
}
