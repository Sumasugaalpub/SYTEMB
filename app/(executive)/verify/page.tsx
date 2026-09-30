"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ALERTS, INCIDENTS, type Alert, type Incident } from "@/data/alerts";
import { EVIDENCE, type Evidence } from "@/data/evidence";
import { INDICATORS, type Indicator } from "@/data/indicators";
import { PROJECTS, type Project } from "@/data/projects";
import { SUBMISSIONS, type Submission } from "@/data/submissions";
import { roleById } from "@/data/users";
import { logAct } from "@/lib/audit";
import { downloadBlob, downloadPDF } from "@/lib/download";
import { ENTITY } from "@/lib/entities";
import { qrMatrix } from "@/lib/qr";
import { useStore } from "@/lib/store";
import { useRecords } from "@/lib/use-record";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoBadge } from "@/components/system/DemoBadge";
import { PageHeader, PmsCard, printPage } from "@/components/pms/ui";

type Mode = "scan" | "generate";

/** Anything the system will vouch for, and where the record lives. */
type Verifiable = {
  id: string;
  kind: string;
  name: string;
  href: string;
  detail: string;
  issued: string;
};

/**
 * Certificates issued on paper before the platform opened. They carry no row of
 * their own, so they are held here and verified like everything else.
 */
const CERTIFICATES: Verifiable[] = [
  {
    id: "BRD-2026-0043",
    kind: "Certificate",
    name: "Berdaale district reconciliation certificate",
    href: "/evidence?district=Berdale",
    detail: "Berdaale district",
    issued: "2026-04-30",
  },
];

export default function VerifyPage() {
  return (
    <React.Suspense fallback={null}>
      <QrVerification />
    </React.Suspense>
  );
}

/** Scan a code to check the record it names is real, or generate one to print. */
function QrVerification() {
  const params = useSearchParams();
  const role = useStore((s) => s.role);

  // Every collection a code can point at — stored rows merged over the seed.
  const evidence = useRecords<Evidence>(ENTITY.evidence, EVIDENCE);
  const projects = useRecords<Project>(ENTITY.projects, PROJECTS);
  const submissions = useRecords<Submission>(ENTITY.submissions, SUBMISSIONS);
  const alerts = useRecords<Alert>(ENTITY.alerts, ALERTS);
  const incidents = useRecords<Incident>(ENTITY.incidents, INCIDENTS);
  const indicators = useRecords<Indicator>(ENTITY.indicators, INDICATORS);

  const registry: Verifiable[] = React.useMemo(
    () => [
      ...evidence.map((e) => ({
        id: e.id,
        kind: "Evidence",
        name: e.title,
        href: `/evidence/${e.id}`,
        detail: `${e.district} \u00b7 ${e.submittedBy}`,
        issued: e.date,
      })),
      ...projects.map((p) => ({
        id: p.id,
        kind: "Project",
        name: p.title,
        href: `/interventions/${p.id}`,
        detail: `${p.lead} \u00b7 ${(p.districts ?? []).join(", ") || "\u2014"}`,
        issued: p.start,
      })),
      ...submissions.map((s) => ({
        id: s.id,
        kind: "District return",
        name: `${s.district} return \u00b7 ${s.period}`,
        href: `/state/submissions/${s.id}`,
        detail: `${s.focalPoint} \u00b7 ${s.status}`,
        issued: (s.submittedAt ?? "").slice(0, 10),
      })),
      ...alerts.map((a) => ({
        id: a.id,
        kind: "Early-warning alert",
        name: a.title,
        href: `/early-warning?alert=${a.id}`,
        detail: `${a.district} \u00b7 ${a.level}`,
        issued: a.opened.slice(0, 10),
      })),
      ...incidents.map((i) => ({
        id: i.id,
        kind: "Incident",
        name: `${i.type} \u00b7 ${i.district}`,
        href: "/conflict-navigator",
        detail: `${i.district} \u00b7 ${i.status}`,
        issued: i.date,
      })),
      ...indicators.map((k) => ({
        id: k.id,
        kind: "Indicator",
        name: k.name,
        href: `/indicators/${k.id}`,
        detail: `${k.owner} \u00b7 ${k.frequency}`,
        issued: "",
      })),
      ...CERTIFICATES,
    ],
    [evidence, projects, submissions, alerts, incidents, indicators],
  );

  const lookup = React.useCallback(
    (code: string) => {
      const key = code.trim().toUpperCase();
      return key ? registry.find((r) => r.id.toUpperCase() === key) : undefined;
    },
    [registry],
  );

  const [mode, setMode] = React.useState<Mode>(params.get("mode") === "generate" ? "generate" : "scan");
  const [camera, setCamera] = React.useState(false);
  const [manual, setManual] = React.useState("");
  const [result, setResult] = React.useState<null | { ok: boolean; text: string; record?: Verifiable }>(null);
  const [item, setItem] = React.useState(() => params.get("item") ?? EVIDENCE[0].id);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  /** Releases the camera. Safe to call from an event or on unmount. */
  const stop = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  }, []);

  // Leaving the page releases the camera.
  React.useEffect(() => () => stop(), [stop]);

  /**
   * Reads a QR image the user uploads. `BarcodeDetector` ships in Chromium; in
   * anything else the file is rejected with a clear message rather than a
   * silent failure.
   */
  async function readQrImage(file: File) {
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect(src: ImageBitmap): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) {
      toast.error("This browser cannot read QR images. Enter the code instead.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const found = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
      bitmap.close();
      const code = found[0]?.rawValue?.trim();
      if (!code) {
        toast.error("No QR code found in that image.");
        return;
      }
      setManual(code);
      check(code);
    } catch {
      toast.error("That image could not be read.");
    }
  }

  async function useCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      toast.error("Camera not available. Enter the code instead.");
    }
  }

  const check = React.useCallback(
    (code: string) => {
      const record = lookup(code);
      setResult(
        record
          ? {
              ok: true,
              text: `Genuine \u2014 ${record.name}`,
              record,
            }
          : { ok: false, text: "Not recognised. This code was not issued by this system." },
      );
      logAct({
        actor: roleById(role).name,
        role,
        action: "qr.verify",
        target: code.trim() || "(empty)",
        note: record ? `Genuine \u00b7 ${record.kind} \u00b7 ${record.name}` : "Not recognised",
      });
    },
    [lookup, role],
  );

  const target = registry.find((r) => r.id === item) ?? registry[0];
  const encoded = target?.id ?? "";

  function downloadQr() {
    const svg = document.getElementById("qr-svg");
    if (!svg) return;
    downloadBlob(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }), `${encoded}-qr.svg`);
    logAct({ actor: roleById(role).name, role, action: "qr.generate", target: encoded, note: "QR downloaded" });
    toast.success("QR code downloaded");
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      <PageHeader
        onPrint={printPage}
        title="QR verification"
        meta="Check that a paper certificate is genuine, or make a code to print onto one."
      />

      <PmsCard
        title={mode === "scan" ? "Scan a certificate" : "Generate a code"}
        action={<DemoBadge label="Verification" />}
        className="w-full max-w-xl"
        bodyClassName="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-1 rounded-[var(--pms-radius-control)] bg-[var(--pms-segmented-track)] p-1">
          {(["scan", "generate"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (m !== "scan") stop();
                setMode(m);
                setResult(null);
              }}
              className={`h-9 rounded-[var(--pms-radius-control)] text-sm font-medium capitalize transition-colors ${
                mode === m ? "bg-[var(--pms-segmented-thumb)] text-[var(--pms-text-strong)] shadow-sm" : "text-[var(--pms-muted-text)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "scan" ? (
          <div className="flex flex-col gap-3">
            <div className="grid h-56 place-items-center overflow-hidden rounded-[12px] bg-black/80">
              {camera ? (
                <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
              ) : (
                <span className="text-[13px] text-white/70">Camera off</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-[var(--pms-radius-control)]" onClick={camera ? stop : useCamera}>
                {camera ? "Stop camera" : "Use camera"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-[var(--pms-radius-control)]"
                onClick={() => fileRef.current?.click()}
              >
                Upload a QR image
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void readQrImage(file);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Enter the code manually"
                className="h-10 rounded-[var(--pms-radius-control)]"
              />
              <Button className="h-10 rounded-[var(--pms-radius-control)]" onClick={() => check(manual)}>Check</Button>
            </div>
            <p className="text-[11.5px] text-[var(--pms-muted-text)]">
              Any reference this system issued verifies here: evidence, projects, district returns, alerts,
              incidents, indicators and printed certificates — {registry.length} records in all.
            </p>
            {result ? (
              <div
                className="rounded-[10px] px-3 py-2.5 text-[13px] font-medium"
                style={{
                  backgroundColor: result.ok ? "var(--pms-icon-success-bg)" : "var(--pms-icon-danger-bg)",
                  color: result.ok ? "var(--pms-icon-success-fg)" : "var(--pms-icon-danger-fg)",
                }}
              >
                <p>{result.text}</p>
                {result.record ? (
                  <p className="mt-1 text-[12px] font-normal">
                    {result.record.kind} <span className="font-mono">{result.record.id}</span> · {result.record.detail}
                    {result.record.issued ? ` \u00b7 ${result.record.issued}` : ""}
                    {" \u00b7 "}
                    <Link href={result.record.href} className="font-semibold underline underline-offset-2">
                      Open the record
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--pms-text-strong)]">Item</span>
              <select
                value={target?.id ?? ""}
                onChange={(e) => setItem(e.target.value)}
                className="h-10 rounded-[10px] border border-[color:var(--pms-hairline-border)] bg-transparent px-3 text-[13px]"
              >
                {registry.map((r) => (
                  <option key={`${r.kind}-${r.id}`} value={r.id}>
                    {r.id} — {r.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid place-items-center rounded-[12px] bg-white p-4">
              <QrSvg value={encoded} />
            </div>
            <p className="text-center font-mono text-[12px] text-[var(--pms-muted-text)]">
              encodes {encoded}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-[var(--pms-radius-control)]" onClick={downloadQr}>
                Download QR
              </Button>
              <Button
                className="flex-1 rounded-[var(--pms-radius-control)]"
                onClick={() =>
                  downloadPDF(
                    "Certificate of verification",
                    [
                      `Reference: ${target?.id ?? ""}`,
                      `Record: ${target?.kind ?? ""}`,
                      `Title: ${target?.name ?? ""}`,
                      `Detail: ${target?.detail ?? ""}`,
                      `Date: ${target?.issued || "\u2014"}`,
                      "Issued by: MOIFAR",
                      "",
                      "Scan the code in the Raad-Raac system to confirm this certificate.",
                    ],
                    `${target?.id ?? "certificate"}-certificate.pdf`,
                  )
                }
              >
                Print certificate
              </Button>
            </div>
          </div>
        )}
      </PmsCard>
    </div>
  );
}

/** The real thing: a QR symbol that encodes the reference, drawn as SVG. */
function QrSvg({ value }: { value: string }) {
  const matrix = React.useMemo(() => qrMatrix(value || "-"), [value]);
  const n = matrix.length;
  const quiet = 4;
  const span = n + quiet * 2;

  return (
    <svg
      id="qr-svg"
      xmlns="http://www.w3.org/2000/svg"
      width={196}
      height={196}
      viewBox={`0 0 ${span} ${span}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={span} height={span} fill="#fff" />
      {matrix.flatMap((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x + quiet} y={y + quiet} width={1} height={1} fill="#111827" /> : null,
        ),
      )}
    </svg>
  );
}
