"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABEL: Record<string, string> = {
  executive: "Dashboard",
  welcome: "Welcome & orientation",
  brief: "Executive overview",
  framework: "Framework",
  "result-areas": "Result areas",
  interventions: "Interventions",
  indicators: "Indicators",
  "national-indicators": "National indicators",
  "conflict-navigator": "Conflict navigator",
  "early-warning": "Early warning",
  "conflict-intelligence": "Conflict intelligence",
  map: "National map",
  "data-explorer": "Data explorer",
  analytics: "Performance analytics",
  evidence: "Evidence library",
  knowledge: "Knowledge & learning",
  reports: "Reports",
  users: "Users & roles",
  settings: "System settings",
  support: "Support & help",
  state: "State portal",
  submissions: "Submissions",
  sharing: "Sharing control",
  "access-log": "Access log",
  return: "Return for correction",
  district: "District app",
};

/** Top-left breadcrumb on every page. */
export function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  // Top-level pages need no trail — the sidebar already shows where you are.
  if (parts.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-[var(--pms-muted-text)]">
      <Link href="/executive" className="no-underline hover:text-[var(--pms-text-strong)]">
        Raad-Raac
      </Link>
      {parts.map((p, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1.5">
            <iconify-icon icon="solar:alt-arrow-right-linear" className="text-[12px]" />
            {last ? (
              <span className="font-medium text-[var(--pms-text-strong)]">{LABEL[p] ?? p}</span>
            ) : (
              <Link href={href} className="no-underline hover:text-[var(--pms-text-strong)]">
                {LABEL[p] ?? p}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
