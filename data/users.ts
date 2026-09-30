import type { Visibility } from "@/lib/visibility";

export type RoleId =
  | "super-admin"
  | "mel-admin"
  | "federal-admin"
  | "state-admin"
  | "district-admin"
  | "data-entry"
  | "reviewer"
  | "approver"
  | "executive-user"
  | "partner"
  | "read-only";
export type Role = { id: RoleId; name: string; portal: "executive" | "state" | "district"; clearance: Visibility; description: string };

/** The 11 roles named in the ministry's configuration workbook (sheet 10_ROLES). Clearance is the highest visibility level the role can open. */
export const ROLES: Role[] = [
  { id: "super-admin", name: "Super Administrator", portal: "executive", clearance: "restricted", description: "Full system access, including restricted early warning." },
  { id: "mel-admin", name: "National MEL Administrator", portal: "executive", clearance: "restricted", description: "National platform administration without approval rights." },
  { id: "federal-admin", name: "Federal Institution Administrator", portal: "executive", clearance: "authorized", description: "Manages the assigned institution's reporting." },
  { id: "state-admin", name: "Regional/State Administrator", portal: "state", clearance: "authorized", description: "Runs the assigned Federal Member State workspace." },
  { id: "district-admin", name: "District Administrator", portal: "district", clearance: "aggregated", description: "Runs the assigned district and files its returns." },
  { id: "data-entry", name: "Data Entry Officer", portal: "district", clearance: "aggregated", description: "Enters and updates assigned records." },
  { id: "reviewer", name: "Reviewer", portal: "state", clearance: "authorized", description: "Reviews district submissions and returns them for correction." },
  { id: "approver", name: "Approver", portal: "state", clearance: "authorized", description: "Approves submissions and controls what the state shares." },
  { id: "executive-user", name: "Executive User", portal: "executive", clearance: "authorized", description: "Views executive intelligence and briefs." },
  { id: "partner", name: "Partner / NGO User", portal: "executive", clearance: "aggregated", description: "Restricted authorised access to own projects and aggregates." },
  { id: "read-only", name: "Read-only User", portal: "executive", clearance: "public", description: "Published figures only." },
];

export type User = { id: string; name: string; email: string; role: RoleId; institution: string; state?: string; lastActive: string; active: boolean };

export const USERS: User[] = [
  { id: "U-001", name: "Hon. Axmed Maxamuud", email: "admin@moifar.gov.so", role: "super-admin", institution: "MOIFAR", lastActive: "2026-05-20T08:40", active: true },
  { id: "U-002", name: "Dr. Faadumo Cabdi", email: "mel@moifar.gov.so", role: "mel-admin", institution: "MOIFAR", lastActive: "2026-05-20T08:55", active: true },
  { id: "U-003", name: "Cabdiraxmaan Nuur", email: "focal@opm.gov.so", role: "federal-admin", institution: "OPM", lastActive: "2026-05-19T17:10", active: true },
  { id: "U-004", name: "Hodan Maxamed", email: "exec@snbs.gov.so", role: "executive-user", institution: "SNBS", lastActive: "2026-05-20T07:30", active: true },
  { id: "U-005", name: "Yuusuf Cali", email: "approver@sw-moi.gov.so", role: "approver", institution: "SW-MOI", state: "south-west", lastActive: "2026-05-20T09:00", active: true },
  { id: "U-006", name: "Sahra Aadan", email: "state.admin@sw-moi.gov.so", role: "state-admin", institution: "SW-MOI", state: "south-west", lastActive: "2026-05-20T08:15", active: true },
  { id: "U-007", name: "Ibraahim Xasan", email: "review@sw-moi.gov.so", role: "reviewer", institution: "SW-MOI", state: "south-west", lastActive: "2026-05-18T12:00", active: true },
  { id: "U-008", name: "Bashiir Muuse", email: "berdale@sw-moi.gov.so", role: "district-admin", institution: "SW-MOI", state: "south-west", lastActive: "2026-04-14T09:10", active: true },
  { id: "U-009", name: "Maryan Jaamac", email: "m.jaamac@undp.org", role: "partner", institution: "UNDP", lastActive: "2026-05-16T10:20", active: true },
  { id: "U-010", name: "Cumar Faarax", email: "entry@peacemuseum.so", role: "data-entry", institution: "MOCHE", lastActive: "2026-05-19T15:45", active: true },
  { id: "U-011", name: "Guest", email: "public@peacemuseum.so", role: "read-only", institution: "—", lastActive: "2026-05-10T11:00", active: false },
  { id: "U-012", name: "Xaawo Siciid", email: "admin@bra.gov.so", role: "state-admin", institution: "BRA", state: "banadir", lastActive: "2026-05-20T08:05", active: true },
  { id: "U-013", name: "Maxamed Warsame", email: "review@bra.gov.so", role: "reviewer", institution: "BRA", state: "banadir", lastActive: "2026-05-19T16:20", active: true },
];

export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id)!;

/**
 * Which access group a user belongs to — the same five groups the dashboard's
 * System access panel counts and the users page filters by. Banadir is its own
 * group, so the check for it comes before the generic state check.
 */
export type UserGroup = "federal" | "states" | "banadir" | "districts" | "partners";

export function userGroup(u: User): UserGroup {
  if (u.role === "partner") return "partners";
  if (u.institution === "BRA") return "banadir";
  if (u.role === "district-admin") return "districts";
  return u.state ? "states" : "federal";
}
