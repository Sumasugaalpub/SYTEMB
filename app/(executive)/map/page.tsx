"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { Incident } from "@/data/alerts";
import {
  CONFLICT_RISK,
  EARLY_WARNING,
  GIS_LAYERS,
  PEACE_ECOSYSTEM,
  PEOPLE,
  REGION_CENTROID,
  RISK_OVERLAY_MIN,
} from "@/data/gisLayers";
import { PROJECTS, type Project } from "@/data/projects";
import { DISTRICTS, REGIONS, disputeNote, districtStatus, isDisputed, regionById } from "@/data/geography";
import { REGION_REPORTED, REGION_SCORES } from "@/data/regionStatus";
import { roleById } from "@/data/users";
import { ENTITY } from "@/lib/entities";
import { fmtDate } from "@/lib/format";
import { bandOf, bandsFor } from "@/lib/status";
import { useStore } from "@/lib/store";
import { useCollection } from "@/lib/use-collection";
import { canSee } from "@/lib/visibility";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BoundaryDisclaimer } from "@/components/map/BoundaryDisclaimer";
import { MAP_HOME_CENTER, MAP_HOME_ZOOM, MAP_MAX_ZOOM, MAP_MIN_ZOOM, SomaliaMap } from "@/components/map/SomaliaMap";
import { IconChip, NoData, PageHeader, Pill, PmsCard, printPage, useExportDialog } from "@/components/pms/ui";

/** What the map draws boundaries for. Nothing below district exists in the workbook yet. */
const LEVELS = [
  { id: "national", label: "National", hint: "The country as one shape. No internal administrative fill." },
  { id: "state", label: "State", hint: "Regions painted by the federal member state they belong to." },
  { id: "district", label: "District", hint: "Regions drawn separately, with district detail wherever the state shares it." },
  { id: "community", label: "Community", hint: "Community boundaries have never been supplied. Nothing is drawn below district." },
] as const;

type DrawLevel = (typeof LEVELS)[number]["id"];

const NATIONAL_FILL = "#8fb4e4";

const STATE_FILL: Record<string, string> = {
  "south-west": "#2f77e6",
  hirshabelle: "#159a52",
  galmudug: "#d98a06",
  jubaland: "#7a5af8",
  puntland: "#0d9488",
  banadir: "#b3241f",
  northern: "#64748b",
};

/** Disputed regions are painted with this dotted neutral hatch instead of a solid fill. */
const DISPUTED_PAINT = "url(#spm-disputed-hatch)";

export default function NationalMapPage() {
  const [openExport, exportDialog] = useExportDialog();
  const router = useRouter();
  const params = useSearchParams();
  const { region, setRegion, bandMode, role, sharing } = useStore();
  const clearance = roleById(role).clearance;
  const incidents = useCollection<Incident>(ENTITY.incidents);
  const projects = useCollection<Project>(ENTITY.projects, PROJECTS);

  // Page 6 links here with ?project=PRJ-0142 — the map opens zoomed to that project.
  const projectId = params.get("project");
  const project = projectId ? projects.find((p) => p.id === projectId) : undefined;
  /** The regions the project's districts sit in, in the order the districts were recorded. */
  const projectRegions = React.useMemo(() => {
    if (!project) return [] as string[];
    const ids = project.districts
      .map((d) => DISTRICTS.find((x) => x.name.toLowerCase() === d.toLowerCase())?.region)
      .filter((x): x is string => Boolean(x));
    if (project.region && !ids.includes(project.region)) ids.push(project.region);
    return [...new Set(ids)];
  }, [project]);

  const [layers, setLayers] = React.useState<Record<string, boolean>>(
    Object.fromEntries(GIS_LAYERS.map((l) => [l.id, l.defaultOn])),
  );
  const [band, setBand] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(params.get("region"));
  const [district, setDistrict] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(MAP_HOME_ZOOM);
  const [center, setCenter] = React.useState<[number, number]>(MAP_HOME_CENTER);
  const [projectDistrict, setProjectDistrict] = React.useState<string | null>(null);
  const [level, setLevel] = React.useState<DrawLevel>("district");

  // Zoom to the project's districts once, when the page is opened from page 6.
  const zoomed = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!project || zoomed.current === project.id || !projectRegions.length) return;
    zoomed.current = project.id;
    const pts = projectRegions.map((r) => REGION_CENTROID[r]).filter(Boolean);
    if (pts.length) {
      setCenter([
        pts.reduce((a, c) => a + c[0], 0) / pts.length,
        pts.reduce((a, c) => a + c[1], 0) / pts.length,
      ]);
      setZoom(pts.length > 1 ? 2.6 : 3.4);
    }
    setSelected(projectRegions[0]);
    setRegion(projectRegions[0]);
    setLayers((l) => ({ ...l, projects: true }));
  }, [project, projectRegions, setRegion]);

  /**
   * Fill order: a disputed boundary always wins and is drawn neutral and dotted;
   * then the project in view; then the drawing level; then the layer rules.
   */
  const paintRegion = React.useCallback(
    (id: string) => {
      if (isDisputed(id)) return DISPUTED_PAINT;
      if (project && projectRegions.includes(id)) return "var(--pms-chart-collected)";
      if (level === "national") return NATIONAL_FILL;
      if (level === "state") return STATE_FILL[regionById(id)?.state ?? ""];
      return undefined;
    },
    [project, projectRegions, level],
  );

  const tipRegion = React.useCallback(
    (id: string) => {
      const lines: string[] = [];
      const note = disputeNote(id);
      if (note) lines.push(note, "Drawn dotted and neutral. No administration is implied.");
      if (project && projectRegions.includes(id)) {
        lines.push(
          `${project.id} · ${project.title}`,
          project.districts.filter((d) => DISTRICTS.find((x) => x.name === d)?.region === id).join(", ") ||
            "districts not named",
        );
      }
      return lines.length ? lines : undefined;
    },
    [project, projectRegions],
  );

  const open = selected ? regionById(selected) : null;
  const openState = open ? sharing[open.state] : undefined;

  const counted = (rid: string) => Boolean(sharing[regionById(rid)?.state ?? ""]?.counts);
  const located = (rid: string) => Boolean(sharing[regionById(rid)?.state ?? ""]?.locations);

  /** What each active layer actually puts on the canvas this render. */
  const drawn: Record<string, number> = {
    peace: REGIONS.filter((r) => counted(r.id) && (PEACE_ECOSYSTEM[r.id]?.committees ?? 0) > 0).length,
    risk:
      REGIONS.filter((r) => counted(r.id) && (CONFLICT_RISK[r.id] ?? 0) >= RISK_OVERLAY_MIN).length +
      incidents.filter((i) => located(i.region)).length,
    warning: canSee(clearance, "restricted") ? REGIONS.filter((r) => counted(r.id) && EARLY_WARNING[r.id]).length : 0,
    people: REGIONS.filter((r) => counted(r.id) && (PEOPLE[r.id]?.displaced ?? 0) > 0).length,
    performance: REGIONS.filter((r) => counted(r.id)).length,
    projects: REGIONS.filter((r) => counted(r.id) && PROJECTS.some((p) => p.region === r.id || p.districts.some((d) => r.districts.includes(d)))).length,
    basemap: REGIONS.length,
    satellite: 1,
  };
  const emptyLayers = GIS_LAYERS.filter((l) => layers[l.id] && !drawn[l.id]);

  function focusRegion(id: string) {
    setSelected(id);
    setRegion(id);
    const rid = regionById(id) ? id : REGIONS.find((r) => r.state === id)?.id;
    const c = rid ? REGION_CENTROID[rid] : undefined;
    if (c) {
      setCenter(c);
      setZoom((z) => Math.max(z, 2.6));
    }
  }

  // Arriving from the dashboard map: open that region, zoomed in.
  const fromQuery = params.get("region");
  React.useEffect(() => {
    if (!fromQuery) return;
    setSelected(fromQuery);
    setRegion(fromQuery);
    const rid = regionById(fromQuery) ? fromQuery : REGIONS.find((r) => r.state === fromQuery)?.id;
    const c = rid ? REGION_CENTROID[rid] : undefined;
    if (c) {
      setCenter(c);
      setZoom((z) => Math.max(z, 2.6));
    }
  }, [fromQuery, setRegion]);

  function goHome() {
    setZoom(MAP_HOME_ZOOM);
    setCenter(MAP_HOME_CENTER);
  }

  function toggle(id: string, on: boolean) {
    const layer = GIS_LAYERS.find((l) => l.id === id)!;
    if (layer.restricted && !canSee(clearance, "restricted")) {
      toast.error("Restricted layer — your role does not have access");
      return;
    }
    setLayers((s) => ({ ...s, [id]: on }));
  }

  function downloadPng() {
    const svg = document.querySelector("#national-map svg");
    if (!svg) return toast.error("Map not ready");
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height - 60);
      ctx.fillStyle = "#4b5563";
      ctx.font = "16px sans-serif";
      ctx.fillText("Boundaries and names shown do not imply official endorsement or acceptance.", 24, canvas.height - 28);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "somalia-map.png";
        a.click();
        toast.success("Map downloaded with the disclaimer");
      });
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {exportDialog}
      <PageHeader filters
        onPrint={printPage}
        onExport={openExport}
        title="National map"
        meta="Eighteen regions. What each one shows depends on that state's sharing settings."
        actions={
          <>
            <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" onClick={downloadPng}>
              Download PNG
            </Button>
            <Button variant="outline" className="h-9 rounded-[var(--pms-radius-control)]" onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-12">
        <PmsCard className="xl:col-span-9">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-[var(--pms-radius-control)] bg-[var(--pms-segmented-track)] p-1">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  title={l.hint}
                  className={`h-8 rounded-[var(--pms-radius-control)] px-3 text-[12.5px] font-medium transition-colors ${
                    level === l.id
                      ? "bg-[var(--pms-segmented-thumb)] text-[var(--pms-text-strong)] shadow-sm"
                      : "text-[var(--pms-muted-text)] hover:text-[var(--pms-text-strong)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-[var(--pms-muted-text)]">
              {LEVELS.find((l) => l.id === level)?.hint}
            </span>
          </div>

          {level === "community" ? (
            <div className="mb-3">
              <NoData label="No data received — community boundaries have never been supplied" />
            </div>
          ) : null}

          <div id="national-map" className="relative">
            <svg aria-hidden focusable="false" width="0" height="0" className="absolute">
              <defs>
                <pattern id="spm-disputed-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="7" height="7" fill="#e6e9ee" />
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#8b94a1" strokeWidth="1.8" strokeDasharray="1.6 2.4" />
                </pattern>
              </defs>
            </svg>

            <SomaliaMap
              height={520}
              layers={layers}
              focusState={undefined}
              zoom={zoom}
              center={center}
              regionColor={paintRegion}
              regionTooltip={tipRegion}
              onSelectRegion={focusRegion}
            />

            <div className="absolute right-3 top-3 flex flex-col gap-1.5">
              {[
                { icon: "solar:add-circle-linear", label: "Zoom in", disabled: zoom >= MAP_MAX_ZOOM, run: () => setZoom((z) => Math.min(MAP_MAX_ZOOM, Math.round((z + 0.5) * 10) / 10)) },
                { icon: "solar:minus-circle-linear", label: "Zoom out", disabled: zoom <= MAP_MIN_ZOOM, run: () => setZoom((z) => Math.max(MAP_MIN_ZOOM, Math.round((z - 0.5) * 10) / 10)) },
                { icon: "solar:home-2-linear", label: "Reset view", disabled: zoom === MAP_HOME_ZOOM && center[0] === MAP_HOME_CENTER[0] && center[1] === MAP_HOME_CENTER[1], run: goHome },
              ].map((b) => (
                <Button
                  key={b.label}
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={b.label}
                  title={b.label}
                  disabled={b.disabled}
                  onClick={b.run}
                  className="size-8 rounded-[var(--pms-radius-control)] bg-[var(--pms-surface)] shadow-[var(--pms-card-shadow)]"
                >
                  <iconify-icon icon={b.icon} className="text-[17px]" />
                </Button>
              ))}
            </div>

            <span className="absolute bottom-3 left-3 rounded-[8px] bg-[var(--pms-surface)]/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--pms-muted-text)] shadow-[var(--pms-card-shadow)]">
              {zoom.toFixed(1)}×
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {bandsFor(bandMode).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBand(band === b.id ? null : b.id)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1 text-[11.5px] transition-colors"
                style={{
                  borderColor: band === b.id ? "var(--pms-primary)" : "var(--pms-hairline-border)",
                  color: band === b.id ? "var(--pms-text-strong)" : "var(--pms-muted-text)",
                }}
              >
                <span className="size-[10px] rounded-[3px]" style={{ background: b.color }} />
                {b.label}
              </button>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--pms-muted-text)]">
              <span
                className="size-[10px] rounded-[3px] border border-dotted border-[#8b94a1]"
                style={{ background: "repeating-linear-gradient(45deg, #8b94a1 0 1.5px, #e6e9ee 1.5px 4px)" }}
              />
              Disputed boundary — drawn dotted and neutral
            </span>
            {band ? (
              <span className="text-[11.5px] text-[var(--pms-muted-text)]">
                Showing only regions in the “{bandsFor(bandMode).find((b) => b.id === band)?.label}” band —{" "}
                {REGIONS.filter((r) => bandOf(REGION_SCORES[r.id], bandMode).id === band).map((r) => r.name).join(", ") || "none"}
              </span>
            ) : null}
          </div>

          <BoundaryDisclaimer />
        </PmsCard>

        <div className="flex flex-col gap-3 lg:gap-4 xl:col-span-3">
          <PmsCard title="Layers" flush>
            <ul className="flex flex-col divide-y divide-[color:var(--pms-divide)]">
              {GIS_LAYERS.map((l) => {
                const blocked = l.restricted && !canSee(clearance, "restricted");
                return (
                  <li key={l.id} className="flex items-start gap-3 px-5 py-2.5">
                    <Checkbox
                      checked={Boolean(layers[l.id])}
                      disabled={blocked}
                      onCheckedChange={(v) => toggle(l.id, Boolean(v))}
                      aria-label={l.name}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--pms-text-strong)]">
                        {l.name}
                        {l.restricted ? <iconify-icon icon="solar:lock-keyhole-linear" className="text-[13px] text-[var(--pms-muted-text)]" /> : null}
                      </span>
                      <span className="block text-[11px] text-[var(--pms-muted-text)]">{l.description}</span>
                      {l.id === "satellite" ? (
                        <Pill tone="warn" className="mt-1">unconfirmed in the workbook</Pill>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            {emptyLayers.length ? (
              <div className="border-t border-[color:var(--pms-divide)] px-5 py-3">
                <NoData label={`No data received — ${emptyLayers.map((l) => l.name).join(", ")}`} />
              </div>
            ) : null}
          </PmsCard>

          {project ? (
            <PmsCard
              title="Project in view"
              action={
                <button
                  type="button"
                  onClick={() => router.push("/map")}
                  className="text-sm text-[var(--pms-muted-text)] hover:text-[var(--pms-text-strong)]"
                >
                  Clear
                </button>
              }
            >
              <div className="flex items-start gap-3">
                <IconChip icon="solar:case-round-linear" tone="accent" />
                <div className="min-w-0">
                  <p className="font-mono text-[11.5px] text-[var(--pms-muted-text)]">{project.id}</p>
                  <p className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{project.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--pms-muted-text)]">
                    {projectRegions.map((r) => regionById(r)?.name ?? r).join(", ")} · {project.districts.length} districts
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.districts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setProjectDistrict(d);
                      const rid = DISTRICTS.find((x) => x.name === d)?.region;
                      if (rid) focusRegion(rid);
                    }}
                    className={`rounded-[10px] border px-2.5 py-1 text-[11.5px] transition-colors ${
                      projectDistrict === d
                        ? "border-[var(--pms-primary)] bg-[var(--pms-icon-info-bg)] text-[var(--pms-icon-info-fg)]"
                        : "border-[color:var(--pms-hairline-border)] text-[var(--pms-muted-text)] hover:bg-[var(--pms-row-hover)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-[var(--pms-radius-control)]"
                onClick={() => router.push(`/interventions/${project.id}`)}
              >
                Open the project
              </Button>
            </PmsCard>
          ) : null}

          <PmsCard title={open ? open.name : "Pick a region"}>
            {open ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <IconChip icon="solar:map-linear" tone="info" />
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--pms-text-strong)]">{open.name}</p>
                    <p className="text-[11.5px] text-[var(--pms-muted-text)]">{open.state}</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 text-[12.5px]">
                  <li className="flex justify-between">
                    <span className="text-[var(--pms-muted-text)]">Score</span>
                    <b className="tabular-nums">{openState?.counts ? REGION_SCORES[open.id] : "not shared"}</b>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[var(--pms-muted-text)]">Coverage</span>
                    <b className="tabular-nums">{REGION_REPORTED[open.id]}/{open.districts.length}</b>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[var(--pms-muted-text)]">Incidents</span>
                    <b className="tabular-nums">{incidents.filter((i) => i.region === open.id).length}</b>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[var(--pms-muted-text)]">District detail</span>
                    <Pill tone={openState?.districtNames ? "good" : "neutral"}>
                      {openState?.districtNames ? "shared" : "withheld"}
                    </Pill>
                  </li>
                </ul>

                {openState?.districtNames ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]">
                      Districts
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {open.districts.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDistrict(d)}
                          className={`rounded-[10px] border px-2.5 py-1 text-[11.5px] transition-colors ${
                            district === d
                              ? "border-[var(--pms-primary)] bg-[var(--pms-icon-info-bg)] text-[var(--pms-icon-info-fg)]"
                              : "border-[color:var(--pms-hairline-border)] text-[var(--pms-muted-text)] hover:bg-[var(--pms-row-hover)]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-[10px] bg-[var(--pms-segmented-track)] px-3 py-2 text-[12px] text-[var(--pms-muted-text)]">
                    This state has not shared district-level detail, so the region is drawn as one shape with no pins.
                  </p>
                )}

                {district ? (() => {
                  const row = DISTRICTS.find((d) => d.name === district);
                  const st = row ? districtStatus(row.id) : undefined;
                  return (
                    <div className="rounded-[10px] border border-[color:var(--pms-hairline-border)] px-3 py-2.5">
                      <p className="text-[12.5px] font-semibold text-[var(--pms-text-strong)]">{district}</p>
                      <p className="mt-0.5 text-[11.5px] text-[var(--pms-muted-text)]">
                        {regionById(row?.region ?? "")?.name ?? row?.region}
                      </p>

                      <ul className="mt-2 flex flex-col gap-1.5 text-[12px]">
                        <li className="flex items-center justify-between gap-3">
                          <span className="text-[var(--pms-muted-text)]">Incidents this period</span>
                          <b className="tabular-nums">{incidents.filter((i) => i.district === district).length}</b>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                          <span className="text-[var(--pms-muted-text)]">Last report</span>
                          <b className="tabular-nums">{st ? fmtDate(st.lastReport) : "never"}</b>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                          <span className="text-[var(--pms-muted-text)]">Coverage</span>
                          <b className="tabular-nums">{st ? `${st.coverage}%` : "—"}</b>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                          <span className="text-[var(--pms-muted-text)]">Council</span>
                          <Pill tone={st?.council === "seated" ? "good" : st?.council === "interim" ? "warn" : "neutral"}>
                            {st ? (st.council === "none" ? "not formed" : st.council) : "not recorded"}
                          </Pill>
                        </li>
                      </ul>

                      {st ? null : (
                        <div className="mt-2">
                          <NoData label="No return has ever been received from this district" />
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-8 rounded-[var(--pms-radius-control)]"
                        onClick={() => router.push(`/conflict-navigator?district=${encodeURIComponent(district)}`)}
                      >
                        Open in navigator
                      </Button>
                    </div>
                  );
                })() : null}

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[var(--pms-radius-control)]"
                  onClick={() => { setSelected(null); setDistrict(null); setRegion("all"); goHome(); }}
                >
                  Reset to the whole country
                </Button>
              </div>
            ) : (
              <p className="text-[13px] text-[var(--pms-muted-text)]">
                Click a region on the map. The filter in the top bar follows your selection.
              </p>
            )}
          </PmsCard>

          <PmsCard title="Current filter">
            <p className="text-[12.5px] text-[var(--pms-text)]">
              {region === "all" ? "All regions — denominator 90 districts." : `${regionById(region)?.name ?? region} — denominator ${regionById(region)?.districts.length ?? 90} districts.`}
            </p>
          </PmsCard>
        </div>
      </div>
    </div>
  );
}
