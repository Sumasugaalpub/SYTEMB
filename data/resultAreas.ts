export type ResultArea = {
  id: string;
  code: string;
  name: string;
  nameSo: string;
  lead: string;
  icon: string;
  score: number;
  trend: number;
  reported: number;
  summary: string;
};

/** The nine national Result Areas (CL- = cluster). Scores are 0–100 against 2026-Q1 targets. */
export const RESULT_AREAS: ResultArea[] = [
  { id: "cl-01", code: "CL-01", name: "National Cohesion & Reconciliation", nameSo: "Isku-duubnida Qaranka iyo Dib-u-heshiisiinta", lead: "MOIFAR", icon: "solar:hand-shake-linear", score: 64, trend: 3, reported: 61, summary: "Peace committees active in 58 districts; Berdale mediation closed with a signed agreement." },
  { id: "cl-02", code: "CL-02", name: "Conflict Prevention & Resolution", nameSo: "Ka-hortagga iyo Xallinta Khilaafaadka", lead: "MOIFAR", icon: "solar:danger-triangle-linear", score: 58, trend: -4, reported: 58, summary: "Grazing and water-point disputes rising in Bay and Hiiraan after the Gu' rains failed." },
  { id: "cl-03", code: "CL-03", name: "Governance & Institutional Trust", nameSo: "Maamul-wanaagga iyo Kalsoonida Hay'adaha", lead: "MOIFAR", icon: "solar:buildings-2-linear", score: 62, trend: 2, reported: 44, summary: "Federal–state dialogue forums held on schedule; constitutional review chapters 4 and 5 still open." },
  { id: "cl-04", code: "CL-04", name: "Stabilization & Recovery", nameSo: "Xasilinta iyo Soo-kabashada", lead: "OPM", icon: "solar:restart-linear", score: 51, trend: -1, reported: 52, summary: "Projects running in 12 recovered districts; Afgoye corridor returns stalled on land tenure." },
  { id: "cl-05", code: "CL-05", name: "Stability & Rule of Law", nameSo: "Xasilloonida iyo Sharciga", lead: "MOJCA", icon: "solar:scale-linear", score: 47, trend: -4, reported: 49, summary: "Mobile court sittings below target in Bakool and Gedo; case backlog rising." },
  { id: "cl-06", code: "CL-06", name: "Social Services & Livelihoods", nameSo: "Adeegyada Bulshada iyo Nolol-maalmeedka", lead: "MOPIED", icon: "solar:wallet-money-linear", score: 57, trend: 3, reported: 55, summary: "128,000 cash-for-work days created; basic services reach 41% of IDP sites." },
  { id: "cl-07", code: "CL-07", name: "Gender & Inclusion", nameSo: "Jinsiga iyo Ka-qaybgalka", lead: "MOWHRD", icon: "solar:user-heart-linear", score: 66, trend: 6, reported: 38, summary: "Women hold 31% of peace-committee seats, up from 24% at baseline." },
  { id: "cl-08", code: "CL-08", name: "Civil Society Engagement", nameSo: "Ka-qaybgalka Bulshada Rayidka", lead: "MOIFAR", icon: "solar:users-group-two-rounded-linear", score: 68, trend: 4, reported: 47, summary: "118 civil-society organisations registered; 74 CSO-led dialogue sessions held." },
  { id: "cl-09", code: "CL-09", name: "Institutional Capacity", nameSo: "Awoodda Hay'adaha", lead: "MOIFAR", icon: "solar:square-academic-cap-linear", score: 38, trend: -2, reported: 18, summary: "Single indicator: 38% of institutions reported to the platform on time this quarter." },
];

export const resultAreaById = (id: string) => RESULT_AREAS.find((r) => r.id === id);
