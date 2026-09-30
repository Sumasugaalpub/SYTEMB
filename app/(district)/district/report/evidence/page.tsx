"use client";

import * as React from "react";
import { toast } from "sonner";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import { EVIDENCE_TYPES } from "@/data/evidenceTypes";
import type { Evidence } from "@/data/evidence";
import { checkFile, compressImage, getFuzzedLocation } from "@/lib/capture";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { nextId } from "@/lib/ids";
import { cn } from "@/lib/utils";
import { useDraft } from "@/components/phone/draft";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { Screen, StepNav } from "@/components/phone/StepNav";
import { DemoBadge } from "@/components/system/DemoBadge";

type Shot = { id: string; src: string; at: string };

/** Screen 7 — step 5. Real camera, real file read, location blurred before storing. */
export default function EvidenceStep() {
  const { evidence, set } = useDraft();
  const [shots, setShots] = React.useState<Shot[]>([]);
  const [busy, setBusy] = React.useState(false);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    set("evidence", evidence.includes(id) ? evidence.filter((x) => x !== id) : [...evidence, id]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "audio") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const bad = checkFile(file, kind);
    if (bad) return toast.error(bad);

    setBusy(true);
    try {
      const src = kind === "image" ? await compressImage(file) : "";
      const loc = await getFuzzedLocation();
      const id = nextId("EV", 2026, 4);

      db.add<Evidence>(ENTITY.evidence, {
        id,
        type: kind === "image" ? "photo" : "audio",
        title: kind === "image" ? "Field photograph" : "Field recording",
        district: BERDAALE_REPORT.district,
        region: BERDAALE_REPORT.region,
        date: new Date().toISOString().slice(0, 10),
        submittedBy: BERDAALE_REPORT.focalPoint.name,
        visibility: "authorized",
        resultArea: "cl-01",
        linked: [],
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        description: loc
          ? `Captured near ${loc.lat}, ${loc.lng} — location rounded before storage.`
          : "Captured in the field.",
      });

      if (src) setShots((s) => [{ id, src, at: new Date().toISOString() }, ...s]);
      set("evidence", [...evidence, id]);
      toast.success(loc ? "Attached — exact location removed" : "Attached");
    } catch {
      toast.error("Could not attach that file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Screen title="Caddayn · Evidence">
        <AudioHelp clip="evidence" text="Sawir qaad ama cod duub. Ha sawirin wejiyada dadka aan oggolaan." />

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e, "image")} />
        <input ref={audioRef} type="file" accept="audio/*" hidden onChange={(e) => onFile(e, "audio")} />

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="flex h-20 flex-col items-center justify-center gap-1 rounded-[14px] bg-[var(--inv-brand)] text-[13px] font-bold text-[var(--inv-brand-on)] disabled:opacity-50"
          >
            <iconify-icon icon="solar:camera-linear" className="text-[28px]" />
            Sawir
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => audioRef.current?.click()}
            className="flex h-20 flex-col items-center justify-center gap-1 rounded-[14px] bg-[var(--inv-brand)] text-[13px] font-bold text-[var(--inv-brand-on)] disabled:opacity-50"
          >
            <iconify-icon icon="solar:microphone-3-linear" className="text-[28px]" />
            Cod
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="flex h-20 flex-col items-center justify-center gap-1 rounded-[14px] bg-[var(--inv-brand)] text-[13px] font-bold text-[var(--inv-brand-on)] disabled:opacity-50"
          >
            <iconify-icon icon="solar:document-linear" className="text-[28px]" />
            Warqad
          </button>
        </div>

        {shots.length ? (
          <div className="grid grid-cols-3 gap-2">
            {shots.map((s) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={s.id} src={s.src} alt="Captured evidence" className="h-24 w-full rounded-[12px] object-cover" />
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[var(--inv-muted)] uppercase">{evidence.length} attached</span>
          <DemoBadge label="File storage" />
        </div>

        {BERDAALE_REPORT.evidence.map((e) => {
          const t = EVIDENCE_TYPES.find((x) => x.label === e.type) ?? EVIDENCE_TYPES[0];
          const on = evidence.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => toggle(e.id)}
              className={cn(
                "flex items-center gap-3 rounded-[12px] border-[1.5px] px-3 py-2.5 text-left",
                on ? "border-[var(--inv-brand)] bg-[var(--inv-brand-soft)]" : "border-[var(--inv-card-border)] opacity-60",
              )}
            >
              <iconify-icon icon={t.icon} className="text-[24px] text-[var(--inv-brand-ink)]" />
              <span className="flex-1 text-[13px] font-semibold">{e.title}</span>
              <iconify-icon
                icon={on ? "solar:check-circle-bold" : "solar:add-circle-linear"}
                className="text-[22px] text-[var(--inv-brand-ink)]"
              />
            </button>
          );
        })}
      </Screen>
      <StepNav />
    </>
  );
}
