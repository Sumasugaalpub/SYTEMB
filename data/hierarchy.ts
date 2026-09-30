import { RESULT_AREAS } from "./resultAreas";
import { indicatorsOf } from "./indicators";

export type Node = { id: string; level: "CL" | "OBJ" | "FUN" | "ACT" | "KPI"; name: string; children: Node[] };

const OBJECTIVES = ["Strengthen institutions", "Expand community reach"];
const FUNCTIONS = ["Policy & coordination", "Delivery & monitoring"];

const seq = (n: number) => String(n).padStart(2, "0");

/**
 * CL → OBJ → FUN → ACT → KPI. Two objectives per result area, two functions each,
 * KPIs spread across activities. Identifiers follow the workbook form
 * `OBJ-<AREACODE>-01` / `FUN-<AREACODE>-01` / `ACT-<AREACODE>-01`, where the
 * sequence is 2-digit and unique inside the result area. Indicator leaves keep
 * their own indicator codes.
 */
export const HIERARCHY: Node[] = RESULT_AREAS.map((ra) => {
  const kpis = indicatorsOf(ra.id);
  return {
    id: ra.code,
    level: "CL",
    name: ra.name,
    children: OBJECTIVES.map((obj, o) => ({
      id: `OBJ-${ra.code}-${seq(o + 1)}`,
      level: "OBJ" as const,
      name: `${obj} — ${ra.name.split(" ")[0]}`,
      children: FUNCTIONS.map((fun, f) => {
        const slice = kpis.filter((_, i) => i % 4 === o * 2 + f);
        const n = o * FUNCTIONS.length + f + 1;
        return {
          id: `FUN-${ra.code}-${seq(n)}`,
          level: "FUN" as const,
          name: fun,
          children: [
            {
              id: `ACT-${ra.code}-${seq(n)}`,
              level: "ACT" as const,
              name: f === 0 ? "Convene, legislate and resource" : "Implement, verify and report",
              children: slice.map((k) => ({ id: k.id, level: "KPI" as const, name: k.name, children: [] })),
            },
          ],
        };
      }),
    })),
  };
});
