import { format, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";

import { periodLabel } from "@/data/periods";

export const fmtDate = (iso: string) => format(parseISO(iso), "d MMM yyyy");
export const fmtDateTime = (iso: string) => format(parseISO(iso), "d MMM yyyy, HH:mm");
export const fmtTime = (iso: string) => format(parseISO(iso), "HH:mm");
export const fmtPeriod = (id: string) => periodLabel(id);
export const fmtNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
export const fmtMoney = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const fmtCompact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Somali working week: Sunday–Thursday. */
export function workWeek(iso: string): { start: Date; end: Date; label: string } {
  const start = startOfWeek(parseISO(iso), { weekStartsOn: 0 });
  const end = addDays(start, 4);
  return { start, end, label: `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}` };
}

export const weekBounds = (iso: string) => ({ start: startOfWeek(parseISO(iso), { weekStartsOn: 0 }), end: endOfWeek(parseISO(iso), { weekStartsOn: 0 }) });

export function fmtValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit === "%") return `${value}%`;
  if (unit === "days") return `${value} d`;
  return fmtNumber(value);
}
