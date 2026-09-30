"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { GUTTER, PANEL_BODY, Panel, PanelHead, PanelLink } from "@/components/pms/dashboard-sections";
import { PageHeader, printPage, useExportDialog } from "@/components/pms/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The counter-tile surface the dashboard uses for every small card. */
const TILE =
  "rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-cost-mini-bg)] px-4 py-3.5 shadow-[var(--pms-card-shadow)]";

type Tone = "neutral" | "success" | "info" | "warning" | "accent" | "danger";

function toneStyle(tone: Tone) {
  return { backgroundColor: `var(--pms-icon-${tone}-bg)`, color: `var(--pms-icon-${tone}-fg)` };
}

const GUIDES: { icon: string; title: string; sub: string; href: string; tone: Tone }[] = [
  { icon: "solar:home-smile-linear", title: "Executive", sub: "National picture, brief, decisions", href: "/executive", tone: "info" },
  { icon: "solar:buildings-2-linear", title: "State portal", sub: "Review returns, control sharing", href: "/state", tone: "accent" },
  { icon: "solar:smartphone-linear", title: "District app", sub: "File the quarterly return offline", href: "/district", tone: "success" },
  { icon: "solar:bell-bing-linear", title: "Early warning", sub: "Alerts with a named owner", href: "/early-warning", tone: "warning" },
  { icon: "solar:gallery-wide-linear", title: "Evidence", sub: "Proof behind every number", href: "/evidence", tone: "neutral" },
  { icon: "solar:library-linear", title: "Knowledge", sub: "Research, lessons, case studies", href: "/knowledge", tone: "info" },
];

const PARAGRAPHS: { icon: string; tone: Tone; label: string; body: string }[] = [
  {
    icon: "solar:info-circle-linear",
    tone: "info",
    label: "What it is",
    body:
      "A national system that turns what happens in Somali districts into numbers the government can trust, and keeps the country\u2019s peace record where citizens can see it.",
  },
  {
    icon: "solar:ruler-pen-linear",
    tone: "success",
    label: "What it measures",
    body:
      "Nine result areas, seventy-three indicators, filed quarterly by districts, checked by states, and published with their coverage attached.",
  },
  {
    icon: "solar:shield-keyhole-linear",
    tone: "warning",
    label: "What it will never do",
    body:
      "It stores no names of witnesses, victims or informants. It hides counts of people below five. And it never shows a figure without saying how many districts stand behind it.",
  },
];

const FAQ = [
  ["Where do the numbers come from?", "District focal points file a quarterly return. The state reviews and approves it. Only approved returns reach federal screens."],
  ["Why does every figure show a coverage line?", "A percentage means nothing without knowing how many districts answered. 78% from 31 of 37 districts is not the same as 78% from all of them."],
  ["What happens when a district does not report?", "The system shows a grey block reading 'no data received'. It never shows a zero, because a zero is a claim."],
  ["Can Mogadishu see everything a state holds?", "No. Each state sets what it shares on its own sharing page, and every federal access is written to a log the state can read."],
  ["Are people's names stored?", "No names of witnesses, victims, informants or people affected. Only government staff who must answer for an action."],
  ["Why are two pages locked?", "Early warning and conflict intelligence carry information that could put people at risk. Access is by role, every view is recorded, and exports are refused."],
  ["What does 'lower is better' mean on the indexes?", "Group Grievance and Factionalized Elites are fragility measures. A falling score is progress, so the bar fills as the number goes down."],
  ["Is this the real system?", "No. It is a working prototype. Data lives in this browser only, and everything simulated wears a DEMO badge."],
] as const;

const TOUR = [
  { title: "Result areas", body: "The nine result-area cards are the whole peace plan at a glance." },
  { title: "Coverage", body: "Every number carries its coverage, source and period underneath." },
  { title: "The map", body: "The map greys out any district that did not report." },
  { title: "Locked pages", body: "Locked pages show a padlock and refuse to export." },
  { title: "Your role", body: "The role switcher changes what you are allowed to open." },
] as const;

export default function WelcomePage() {
  const [openExport, exportDialog] = useExportDialog();
  const [videoFailed, setVideoFailed] = React.useState(false);
  const [open, setOpen] = React.useState<number | null>(null);
  const [tour, setTour] = React.useState<number | null>(null);

  const closeTour = React.useCallback(() => setTour(null), []);

  React.useEffect(() => {
    if (tour === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [tour, closeTour]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader
        onPrint={printPage}
        onExport={openExport}
        title="Welcome & orientation"
        meta="What the system is, what it measures, and what it will never do."
        actions={
          <Button className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => setTour(0)}>
            Start guided tour
          </Button>
        }
      />

      {tour !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Guided tour"
          onClick={closeTour}
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[var(--pms-radius-card)] border border-[color:var(--pms-hairline-border)] bg-[var(--pms-surface)] p-5 shadow-[var(--pms-card-shadow)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-[var(--pms-text-strong)]">{TOUR[tour].title}</h2>
              <button
                type="button"
                onClick={closeTour}
                aria-label="Close guided tour"
                className="text-[var(--pms-muted-text)] hover:text-[var(--pms-text-strong)]"
              >
                <iconify-icon icon="solar:close-circle-linear" className="text-[18px]" />
              </button>
            </div>

            <p className="mt-2 text-[13px] leading-[1.55] text-[var(--pms-text)]">{TOUR[tour].body}</p>

            <div className="mt-5 flex items-center gap-2">
              <span className="text-[11px] tabular-nums text-[var(--pms-muted-text)]">
                Step {tour + 1} of {TOUR.length}
              </span>
              <span className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" disabled={tour === 0} onClick={() => setTour(tour - 1)}>
                  Back
                </Button>
                {tour < TOUR.length - 1 ? (
                  <Button size="sm" onClick={() => setTour(tour + 1)}>Next</Button>
                ) : (
                  <Button size="sm" onClick={() => { closeTour(); toast.success("Tour finished"); }}>Finish</Button>
                )}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* The tutorial itself — a real player, not a placeholder. */}
      <Panel>
        <PanelHead title="Tutorial introduction" action={<PanelLink href="/support">Support</PanelLink>} />
        <div className={cn(PANEL_BODY, GUTTER, "pb-5")}>
          {videoFailed ? (
            <div className="grid aspect-[16/9] w-full place-items-center rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-segmented-track)] text-center">
              <div>
                <iconify-icon icon="solar:videocamera-linear" className="text-[26px] text-[var(--pms-muted-text)]" />
                <p className="mt-1.5 text-[12px] text-[var(--pms-muted-text)]">Tutorial video not loaded in this demo</p>
              </div>
            </div>
          ) : (
            <video
              src="/video/museum-intro.mp4"
              poster="/img/museum-intro.jpg"
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
              className="aspect-[16/9] w-full rounded-2xl border border-[color:var(--pms-hairline-border)] bg-[var(--pms-segmented-track)] object-cover"
            />
          )}
          <p className="mt-2.5 text-[11px] text-[var(--pms-muted-text)]">
            4 min · what the system measures, and what it never does
          </p>
        </div>
      </Panel>

      {/* Three equal cards — the whole orientation in three lines. */}
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3 lg:gap-4">
        {PARAGRAPHS.map((c) => (
          <div key={c.label} className={cn(TILE, "flex flex-col")}>
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-[9px]" style={toneStyle(c.tone)}>
                <iconify-icon icon={c.icon} className="text-[15px]" />
              </span>
              <span className="truncate text-xs font-medium text-[var(--pms-muted-text)]">{c.label}</span>
            </div>
            <p className="mt-2 text-[13px] leading-[1.55] text-[var(--pms-text)]">{c.body}</p>
          </div>
        ))}
      </div>

      <Panel>
        <PanelHead title="Where to go" action={<PanelLink href="/executive">Dashboard</PanelLink>} />
        <div className={cn("grid grid-cols-1 gap-3 pb-5 sm:grid-cols-2 xl:grid-cols-3", GUTTER)}>
          {GUIDES.map((g) => (
            <Link key={g.title} href={g.href} className={cn(TILE, "flex items-center gap-3 no-underline transition-colors hover:bg-[var(--pms-row-hover)]")}>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={toneStyle(g.tone)}>
                <iconify-icon icon={g.icon} className="text-[17px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--pms-text-strong)]">{g.title}</span>
                <span className="block truncate text-[11px] text-[var(--pms-muted-text)]">{g.sub}</span>
              </span>
              <iconify-icon icon="solar:arrow-right-up-linear" className="shrink-0 text-[15px] text-[var(--pms-muted-text)]" />
            </Link>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Questions people ask" action={<PanelLink href="/support">Support</PanelLink>} />
        <ul className="flex flex-col pb-2">
          {FAQ.map(([q, a], i) => (
            <li key={q} className="border-t border-[color:var(--pms-divide)] first:border-t-0">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className={cn("flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-[var(--pms-row-hover)]", GUTTER)}
              >
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--pms-text-strong)]">{q}</span>
                <iconify-icon
                  icon={open === i ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                  className="shrink-0 text-[15px] text-[var(--pms-muted-text)]"
                />
              </button>
              {open === i ? (
                <p className={cn("pb-3 text-[12px] leading-[1.55] text-[var(--pms-muted-text)]", GUTTER)}>{a}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
