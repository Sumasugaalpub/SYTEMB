"use client";

import { useSession } from "./state";

/**
 * District officers who can sign in to the phone app. The account carries the
 * district, so the officer never picks or types an institution code.
 */
export type Officer = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  district: string;
  region: string;
  regionName: string;
  stateName: string;
  /** District code used in receipt numbers, e.g. BRD-2026Q2-0043. */
  code: string;
  lat: number;
  lng: number;
};

export const OFFICERS: Officer[] = [
  { id: "U-008", name: "Bashiir Muuse", initials: "BM", phone: "+252 61 555 0142", district: "Berdale", region: "bay", regionName: "Bay", stateName: "South West", code: "BRD", lat: 3.21, lng: 43.53 },
  { id: "OFF-BDA", name: "Abdi Hassan", initials: "AH", phone: "+252 61 555 0108", district: "Baidoa", region: "bay", regionName: "Bay", stateName: "South West", code: "BDA", lat: 3.11, lng: 43.65 },
  { id: "OFF-HDR", name: "Sahra Maxamuud", initials: "SM", phone: "+252 61 555 0131", district: "Hudur", region: "bakool", regionName: "Bakool", stateName: "South West", code: "HDR", lat: 4.12, lng: 43.89 },
];

const digits = (s: string) => s.replace(/\D/g, "");

/** Matches on the last seven digits, so "+252 61…", "061…" and "61…" all work. */
export function officerByPhone(phone: string): Officer | undefined {
  const d = digits(phone);
  if (d.length < 7) return undefined;
  return OFFICERS.find((o) => digits(o.phone).endsWith(d.slice(-7)));
}

export const officerById = (id: string | null | undefined) => OFFICERS.find((o) => o.id === id);

/** The signed-in officer. The mobile shell only renders pages once one exists. */
export function useOfficer(): Officer {
  const id = useSession((s) => s.officerId);
  return officerById(id) ?? OFFICERS[0];
}
