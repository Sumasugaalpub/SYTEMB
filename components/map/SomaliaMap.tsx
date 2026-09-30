"use client";

import * as React from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

import { useStore } from "@/lib/store";
import { mapBandOf, NO_DATA } from "@/lib/status";
import { REGIONS, regionById, stateById } from "@/data/geography";
import { REGION_REPORTED, REGION_SCORES } from "@/data/regionStatus";
import { INCIDENTS, ALERTS } from "@/data/alerts";
import { PROJECTS } from "@/data/projects";
import {
  CONFLICT_RISK,
  EARLY_WARNING,
  PEACE_ECOSYSTEM,
  PEOPLE,
  PERFORMANCE,
  REGION_CENTROID,
  RISK_OVERLAY_MIN,
} from "@/data/gisLayers";
import { roleById } from "@/data/users";
import { canSee } from "@/lib/visibility";

const GEO_URL = "/geo/somalia-regions.json";

export const MAP_HOME_CENTER: [number, number] = [46.2, 5.4];
export const MAP_HOME_ZOOM = 1;
export const MAP_MIN_ZOOM = 1;
export const MAP_MAX_ZOOM = 6;

type Hover = { title: string; lines: string[]; x: number; y: number } | null;

/** Layer ids the map understands, plus the legacy ids earlier callers pass. */
function resolveLayers(layers: Record<string, boolean>) {
  const pick = (...keys: string[]) => {
    for (const k of keys) if (layers[k] !== undefined) return Boolean(layers[k]);
    return false;
  };
  return {
    peace: pick("peace", "status"),
    risk: pick("risk", "incidents"),
    riskOverlay: layers.risk === true,
    warning: pick("warning", "alerts"),
    people: layers.people === true,
    performance: pick("performance", "coverage"),
    projects: pick("projects"),
    basemap: layers.basemap === undefined ? true : Boolean(layers.basemap),
    satellite: layers.satellite === true,
  };
}

/**
 * Reads the state sharing switches from the store:
 *  counts=false        → region renders as No Data
 *  districtNames=false → the whole state renders as one polygon (internal borders hidden, names withheld)
 *  locations=false     → no pins inside that state
 */
export function SomaliaMap({
  layers = { status: true, incidents: true },
  focusState,
  height = 460,
  onSelectRegion,
  zoom: zoomProp,
  center: centerProp,
  regionColor,
  regionTooltip,
}: {
  layers?: Record<string, boolean>;
  focusState?: string;
  height?: number;
  onSelectRegion?: (id: string) => void;
  /** Controlled zoom. Defaults to the focus-aware value the map has always used. */
  zoom?: number;
  /** Controlled centre, [lng, lat]. Defaults to the focus-aware value the map has always used. */
  center?: [number, number];
  /** Per-region fill override — return undefined to fall back to the layer rules. */
  regionColor?: (regionId: string) => string | undefined;
  /** Extra tooltip lines for a region, replacing the default ones when returned. */
  regionTooltip?: (regionId: string) => string[] | undefined;
}) {
  const { sharing, bandMode, role, region } = useStore();
  const [hover, setHover] = React.useState<Hover>(null);
  const clearance = roleById(role).clearance;
  const wrap = React.useRef<HTMLDivElement>(null);
  const L = resolveLayers(layers);

  const stateOf = (rid: string) => regionById(rid)?.state ?? "northern";
  const share = (sid: string) => sharing[sid] ?? { counts: false, districtNames: false, locations: false, evidence: false, notes: false };

  // State-level score for merged (anonymised) states.
  const stateScore = (sid: string) => {
    const rs = REGIONS.filter((r) => r.state === sid);
    return Math.round(rs.reduce((a, r) => a + REGION_SCORES[r.id], 0) / rs.length);
  };

  function fillFor(rid: string) {
    const override = regionColor?.(rid);
    if (override) return override;
    const sid = stateOf(rid);
    const s = share(sid);
    if (focusState && sid !== focusState) return "#e9ebef";
    if (!s.counts) return NO_DATA.color;
    if (L.performance) return mapBandOf(PERFORMANCE[rid] ?? null, bandMode).color;
    if (!L.peace) return "#dfe3e8";
    const score = s.districtNames ? REGION_SCORES[rid] : stateScore(sid);
    return mapBandOf(score, bandMode).color;
  }

  const pinVisible = (rid: string) => {
    const sid = stateOf(rid);
    return share(sid).locations && (!focusState || sid === focusState);
  };
  /** Region-level marks only need the counts switch — they carry no location detail. */
  const areaVisible = (rid: string) => {
    const sid = stateOf(rid);
    return share(sid).counts && (!focusState || sid === focusState);
  };

  function move(e: React.MouseEvent, title: string, lines: string[]) {
    const r = wrap.current!.getBoundingClientRect();
    setHover({ title, lines, x: e.clientX - r.left, y: e.clientY - r.top });
  }

  const defaultCenter: [number, number] =
    focusState === "south-west" ? [43.8, 2.9] : focusState === "hirshabelle" ? [45.4, 3.8] : MAP_HOME_CENTER;
  const defaultZoom = focusState ? 2.4 : MAP_HOME_ZOOM;
  const center = centerProp ?? defaultCenter;
  const zoom = zoomProp ?? defaultZoom;

  const at = (rid: string, dx = 0, dy = 0): [number, number] => {
    const c = REGION_CENTROID[rid] ?? MAP_HOME_CENTER;
    return [c[0] + dx, c[1] + dy];
  };

  return (
    <div ref={wrap} className="relative w-full overflow-hidden rounded-[11px] bg-[#eef3f7] dark:bg-[#0f1216]" style={{ height }} onMouseLeave={() => setHover(null)}>
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: height * 4.1, center: MAP_HOME_CENTER }} width={800} height={height} style={{ width: "100%", height: "100%" }}>
        <defs>
          <pattern id="spm-risk-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#b3241f" strokeWidth="2.6" strokeOpacity="0.5" />
          </pattern>
          <linearGradient id="spm-satellite-sky" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#2b3a22" />
            <stop offset="45%" stopColor="#4a4529" />
            <stop offset="100%" stopColor="#6d5735" />
          </linearGradient>
          <pattern id="spm-satellite-relief" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2.6" fill="#ffffff" fillOpacity="0.055" />
            <circle cx="11" cy="10" r="3.6" fill="#000000" fillOpacity="0.075" />
            <circle cx="14" cy="2" r="1.6" fill="#ffffff" fillOpacity="0.04" />
          </pattern>
        </defs>

        {L.satellite ? (
          <g>
            <rect x={0} y={0} width={800} height={height} fill="url(#spm-satellite-sky)" />
            <rect x={0} y={0} width={800} height={height} fill="url(#spm-satellite-relief)" />
          </g>
        ) : null}

        <ZoomableGroup center={center} zoom={zoom} minZoom={MAP_MIN_ZOOM} maxZoom={MAP_MAX_ZOOM}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rid = geo.properties.id as string;
                const sid = stateOf(rid);
                const s = share(sid);
                const fill = fillFor(rid);
                const merged = !s.districtNames;
                const selected = region === rid || region === sid;
                const stateName = stateById(sid)?.name ?? sid;
                const border = L.basemap ? (selected ? "#171a20" : L.satellite ? "#f2f4f7" : "#ffffff") : fill;
                const custom = regionTooltip?.(rid);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    fillOpacity={L.satellite ? 0.58 : 1}
                    stroke={merged && !L.basemap ? fill : border}
                    strokeWidth={selected && !merged ? 1.4 : L.basemap ? 0.7 : 0.4}
                    onClick={() => onSelectRegion?.(merged ? sid : rid)}
                    onMouseMove={(e) =>
                      move(
                        e,
                        merged ? stateName : `${geo.properties.name} · ${stateName}`,
                        custom ??
                          [
                            !s.counts ? "No data shared" : merged ? `Score ${stateScore(sid)} (state aggregate)` : `Score ${REGION_SCORES[rid]} · ${REGION_REPORTED[rid]} of ${regionById(rid)?.districts.length} districts reported`,
                            s.counts && L.performance ? `On-time reporting ${PERFORMANCE[rid] ?? 0}%` : "",
                            s.counts && L.peace ? `${PEACE_ECOSYSTEM[rid]?.committees ?? 0} committees · ${PEACE_ECOSYSTEM[rid]?.mediators ?? 0} mediators` : "",
                            s.counts && L.riskOverlay ? `Risk index ${CONFLICT_RISK[rid] ?? 0}` : "",
                            merged ? "District names withheld by state" : "",
                          ].filter(Boolean),
                      )
                    }
                    style={{ default: { outline: "none" }, hover: { outline: "none", opacity: 0.85, cursor: "pointer" }, pressed: { outline: "none" } }}
                  />
                );
              })
            }
          </Geographies>

          {/* Conflict Risk — region overlay above the risk threshold. */}
          {L.riskOverlay ? (
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => areaVisible(geo.properties.id as string) && (CONFLICT_RISK[geo.properties.id as string] ?? 0) >= RISK_OVERLAY_MIN)
                  .map((geo) => (
                    <Geography
                      key={`risk-${geo.rsmKey}`}
                      geography={geo}
                      fill="url(#spm-risk-hatch)"
                      stroke="#b3241f"
                      strokeWidth={0.9}
                      style={{ default: { outline: "none", pointerEvents: "none" }, hover: { outline: "none", pointerEvents: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
              }
            </Geographies>
          ) : null}

          {/* Peace Ecosystem — committee clusters at region level. */}
          {L.peace
            ? REGIONS.filter((r) => areaVisible(r.id) && (PEACE_ECOSYSTEM[r.id]?.committees ?? 0) > 0).map((r) => {
                const p = PEACE_ECOSYSTEM[r.id];
                return (
                  <Marker key={`peace-${r.id}`} coordinates={at(r.id, -0.18, 0.12)} onMouseMove={(e) => move(e as unknown as React.MouseEvent, `${r.name} · peace ecosystem`, [`${p.committees} active committees`, `${p.mediators} accredited mediators`, `${p.agreements} agreements signed`])}>
                    <circle r={(3 + Math.min(p.committees, 12) * 0.45) / zoom} fill="#159a52" fillOpacity={0.55} stroke="#0f6b3f" strokeWidth={1 / zoom} />
                  </Marker>
                );
              })
            : null}

          {/* People — displaced population bubbles at region level. */}
          {L.people
            ? REGIONS.filter((r) => areaVisible(r.id) && (PEOPLE[r.id]?.displaced ?? 0) > 0).map((r) => {
                const p = PEOPLE[r.id];
                return (
                  <Marker key={`people-${r.id}`} coordinates={at(r.id, 0.2, -0.18)} onMouseMove={(e) => move(e as unknown as React.MouseEvent, `${r.name} · people`, [`${p.population.toLocaleString()}k residents`, `${p.displaced.toLocaleString()}k displaced`, `${p.returnees.toLocaleString()}k returnees`])}>
                    <circle r={(3.2 + Math.sqrt(p.displaced) * 0.62) / zoom} fill="#2f77e6" fillOpacity={0.3} stroke="#2f77e6" strokeWidth={1.1 / zoom} />
                  </Marker>
                );
              })
            : null}

          {/* Conflict Risk — individual incidents, only where the state shares locations. */}
          {L.risk
            ? INCIDENTS.filter((i) => pinVisible(i.region)).map((i) => (
                <Marker key={i.id} coordinates={[i.lng, i.lat]} onMouseMove={(e) => move(e as unknown as React.MouseEvent, `${i.id} · ${i.district}`, [i.type, `${i.fatalities} fatalities · ${i.displaced} displaced`, i.status])}>
                  <circle r={4.5 / zoom} fill={i.status === "ongoing" ? "#d94a4a" : i.status === "mediated" ? "#d98a06" : "#159a52"} stroke="#fff" strokeWidth={1.2 / zoom} />
                </Marker>
              ))
            : null}

          {/* Early Warning — restricted. Region-level rings plus the live alert register. */}
          {L.warning && canSee(clearance, "restricted")
            ? REGIONS.filter((r) => areaVisible(r.id) && EARLY_WARNING[r.id]).map((r) => {
                const w = EARLY_WARNING[r.id];
                const live = ALERTS.filter((a) => a.region === r.id && a.status !== "closed").length;
                const col = w.level === "critical" ? "#d94a4a" : w.level === "warning" ? "#d98a06" : "#2f77e6";
                return (
                  <Marker key={`warn-${r.id}`} coordinates={at(r.id)} onMouseMove={(e) => move(e as unknown as React.MouseEvent, `${r.name} · early warning`, [`${w.open} open of which ${live} in the register`, w.level, w.trigger])}>
                    <circle r={11 / zoom} fill="none" stroke={col} strokeWidth={2 / zoom} className="animate-pulse" />
                    <circle r={2.4 / zoom} fill={col} />
                  </Marker>
                );
              })
            : null}

          {/* Projects — one mark per region with an intervention footprint. */}
          {L.projects
            ? REGIONS.map((r) => ({ r, list: PROJECTS.filter((p) => p.region === r.id || p.districts.some((d) => r.districts.includes(d))) }))
                .filter((x) => x.list.length > 0 && areaVisible(x.r.id))
                .map(({ r, list }) => (
                  <Marker key={`prj-${r.id}`} coordinates={at(r.id, 0.26, 0.24)} onMouseMove={(e) => move(e as unknown as React.MouseEvent, `${r.name} · projects`, list.map((p) => `${p.id} — ${p.title}`))}>
                    <rect x={-4 / zoom} y={-4 / zoom} width={8 / zoom} height={8 / zoom} rx={1.6 / zoom} fill="#2f77e6" stroke="#fff" strokeWidth={1 / zoom} />
                    {list.length > 1 ? <text y={-6 / zoom} textAnchor="middle" fontSize={7 / zoom} fill="#2f77e6" fontWeight={700}>{list.length}</text> : null}
                  </Marker>
                ))
            : null}

          {/* Base Maps — region names once the view is zoomed enough to read them. */}
          {L.basemap && zoom >= 1.5
            ? REGIONS.filter((r) => share(stateOf(r.id)).districtNames && (!focusState || stateOf(r.id) === focusState)).map((r) => (
                <Marker key={`lbl-${r.id}`} coordinates={at(r.id)}>
                  <text
                    textAnchor="middle"
                    fontSize={8 / zoom}
                    fontWeight={700}
                    fill={L.satellite ? "#ffffff" : "#171a20"}
                    stroke={L.satellite ? "#000000" : "#ffffff"}
                    strokeWidth={2.4 / zoom}
                    paintOrder="stroke"
                    style={{ pointerEvents: "none" }}
                  >
                    {r.name}
                  </text>
                </Marker>
              ))
            : null}
        </ZoomableGroup>
      </ComposableMap>

      {hover ? (
        <div className="pointer-events-none absolute z-10 max-w-[240px] rounded-[10px] border border-[var(--inv-card-border)] bg-white px-3 py-2 text-[12px] shadow-[0_10px_24px_rgba(16,24,40,.14)] dark:bg-[#131418]" style={{ left: Math.min(hover.x + 14, 560), top: hover.y + 12 }}>
          <div className="font-bold text-[var(--inv-value)]">{hover.title}</div>
          {hover.lines.map((l) => <div key={l} className="text-[var(--inv-muted)]">{l}</div>)}
        </div>
      ) : null}
    </div>
  );
}
