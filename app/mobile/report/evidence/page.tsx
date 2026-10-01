"use client";

import * as React from "react";
import { toast } from "sonner";

import { checkFile } from "@/lib/capture";
import { cn } from "@/lib/utils";
import { toPhoto } from "@/components/mobile/photos";
import { StepPage } from "@/components/mobile/StepPage";
import { MAX_PHOTOS, useAnswers, useDraft, useT, type Photo } from "@/components/mobile/state";
import { Card, Chip, Icon, IconChip, Note, PhotoThumb, SectionHead, SHADOW } from "@/components/mobile/ui";

/** Screen 7 — step 5: take or choose photos. Location is removed on the phone. */
export default function EvidenceStep() {
  const t = useT();
  const { photos } = useAnswers();
  const patch = useDraft((s) => s.patch);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const galleryRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const full = photos.length >= MAX_PHOTOS;

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) toast.error(t(`Ugu badnaan ${MAX_PHOTOS} sawir`, `At most ${MAX_PHOTOS} photos`));

    setBusy(true);
    const added: Photo[] = [];
    for (const file of files.slice(0, Math.max(0, room))) {
      const bad = checkFile(file, "image");
      if (bad) {
        toast.error(t(bad.startsWith("File") ? "Sawirku wuu ka weyn yahay 8 MB." : "Dooro sawir.", bad));
        continue;
      }
      try {
        added.push(await toPhoto(file, photos.length + added.length + 1));
      } catch {
        toast.error(t("Sawirkan lama furi karo.", "Could not open that photo."));
      }
    }
    setBusy(false);
    if (!added.length) return;
    // Read the draft again: the officer may have removed a photo while these were processing.
    patch("photos", [...(useDraft.getState().answers?.photos ?? []), ...added]);
    toast.success(t("Waa la lifaaqay — goobta waa laga saaray", "Attached — location removed"));
  }

  const remove = (id: string) => patch("photos", photos.filter((p) => p.id !== id));

  return (
    <StepPage index={4} listen="Sawir qaad ama ka dooro taleefanka. Goobta saxda ah waa laga saarayaa sawirka. Ha sawirin wejiyada dadka aan oggolaan.">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFiles} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy || full}
          onClick={() => cameraRef.current?.click()}
          className="flex h-28 flex-col items-center justify-center gap-2.5 rounded-[16px] bg-[var(--m-cta)] text-[15.5px] font-extrabold text-[var(--m-cta-text)] disabled:opacity-45"
        >
          <Icon name="camera-linear" size={30} />
          {t("Sawir qaad", "Take photo")}
        </button>
        <button
          type="button"
          disabled={busy || full}
          onClick={() => galleryRef.current?.click()}
          className={cn("flex h-28 flex-col items-center justify-center gap-2.5 rounded-[16px] bg-[var(--m-card)] text-[15.5px] font-extrabold text-[var(--m-text)] disabled:opacity-45", SHADOW)}
        >
          <Icon name="gallery-add-linear" size={30} className="text-[var(--m-ink)]" />
          {t("Ka dooro taleefanka", "Choose from phone")}
        </button>
      </div>

      <SectionHead title={`${t("Sawirada", "Photos")} · ${photos.length}`} />
      {busy ? <Note icon="refresh-linear" so="Sawirka waa la diyaarinayaa…" en="Preparing the photo…" /> : null}
      {photos.length ? (
        photos.map((p) => (
          <Card key={p.id} className="-mt-1 flex-row items-center gap-3 px-3.5 py-3">
            <PhotoThumb src={p.src} size={72} alt={p.name} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="truncate text-[15px] font-extrabold">{p.file}</span>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="blue" icon="gallery-linear">
                  {p.kb} KB
                </Chip>
                <Chip tone="green" icon="map-point-remove-linear">
                  {t("Goob la'aan", "No location")}
                </Chip>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(p.id)}
              aria-label={`${t("Ka saar", "Remove")} ${p.name}`}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--m-red-bg)] text-[var(--m-red)]"
            >
              <Icon name="trash-bin-trash-linear" size={19} />
            </button>
          </Card>
        ))
      ) : (
        <Card className="-mt-1 flex-row items-center gap-3">
          <IconChip icon="gallery-linear" />
          <p className="text-[15px] font-extrabold">{t("Wali sawir lama lifaaqin", "No photos yet")}</p>
        </Card>
      )}
    </StepPage>
  );
}
