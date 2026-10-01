"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TIMELINE } from "@/data/timeline";
import { wait } from "@/lib/async";
import { checkFile } from "@/lib/capture";
import { cn } from "@/lib/utils";
import { queueEvent, submitEvent } from "@/components/mobile/actions";
import { useOfficer } from "@/components/mobile/officers";
import { toPhoto } from "@/components/mobile/photos";
import { EVENT_TYPES, MAX_PHOTOS, TEXT_MAX, TRI, emptyEvent, useOnline, useT, type EventInput, type Photo } from "@/components/mobile/state";
import {
  BackButton, Card, Chip, CounterSquare, Cta, Icon, InputRow, ListenButton, Note, PhotoThumb, Question, Screen, SectionHead, Segmented, SHADOW, TextArea, TopBar,
} from "@/components/mobile/ui";

const TODAY = TIMELINE.today.slice(0, 10);

/**
 * Report an event — urgent, goes to the early-warning desk. The mockup plan
 * leaves its fields open, so the ones here are proposed and marked as such.
 */
export default function EventPage() {
  const t = useT();
  const router = useRouter();
  const officer = useOfficer();
  const online = useOnline();
  const [ev, setEv] = React.useState<EventInput>(() => emptyEvent(TODAY));
  const [busy, setBusy] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const up = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setEv((e) => ({ ...e, [key]: value }));
  const tri = TRI.map((o) => ({ value: o.value, label: t(o.so, o.en) }));

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - ev.photos.length);
    e.target.value = "";
    const added: Photo[] = [];
    for (const file of files) {
      if (checkFile(file, "image")) {
        toast.error(t("Dooro sawir ka yar 8 MB.", "Choose a photo under 8 MB."));
        continue;
      }
      try {
        added.push(await toPhoto(file, ev.photos.length + added.length + 1));
      } catch {
        toast.error(t("Sawirkan lama furi karo.", "Could not open that photo."));
      }
    }
    if (added.length) setEv((cur) => ({ ...cur, photos: [...cur.photos, ...added] }));
  }

  async function send() {
    setTried(true);
    if (!ev.type || !ev.description.trim()) return toast.error(t("Dooro nooca oo qor waxa dhacay.", "Choose the type and write what happened."));
    if (!online) {
      const item = queueEvent(ev, officer);
      toast.success(t("Waa la kaydiyay. Waxay dirmi doontaa marka internet jiro.", "Saved. It will send when you have signal."));
      return router.push(`/mobile/receipt?outbox=${item.id}`);
    }
    setBusy(true);
    await wait();
    const res = submitEvent(ev, officer);
    setBusy(false);
    if (!res.ok) return toast.error(t(res.error.so, res.error.en));
    toast.success(`${t("Dhacdada waa la diray", "Event sent")} · ${res.ref}`);
    router.push(`/mobile/receipt?event=${encodeURIComponent(res.ref)}`);
  }

  return (
    <Screen
      nav="home"
      top={
        <TopBar
          title={t("Soo sheeg dhacdo", "Report an event")}
          left={<BackButton href="/mobile/home" />}
          right={<ListenButton clip="event" text="Dooro nooca dhacdada, goobta iyo waqtiga, dadka ay saameysay, kadib qor waxa dhacay. Ha qorin magac qof." />}
        />
      }
    >
      <Note tone="red" icon="danger-triangle-linear" so="Dhacdo degdeg ah — waxay toos u gaadhaysaa xafiiska digniinta hore." en="Urgent — goes straight to the early-warning desk." />
      <Chip tone="amber" icon="info-circle-linear">
        {t("Goobahan waa la xaqiijin doonaa", "Fields to be confirmed")}
      </Chip>

      <SectionHead title={t("Nooca dhacdada", "Event type")} />
      <div role="radiogroup" aria-label={t("Nooca dhacdada", "Event type")} className="-mt-1 grid grid-cols-3 gap-2.5">
        {EVENT_TYPES.map((type) => {
          const on = ev.type === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => up("type", type.value)}
              className={cn(
                "flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-[16px] px-1",
                on
                  ? "bg-[var(--m-red-bg)] text-[var(--m-red)] shadow-[0_1px_2px_rgba(16,24,40,.04),0_6px_18px_rgba(16,24,40,.05),inset_0_0_0_2px_var(--m-red)]"
                  : cn("bg-[var(--m-card)] text-[var(--m-text)]", tried && !ev.type ? "shadow-[inset_0_0_0_2px_#d94a4a]" : SHADOW),
              )}
            >
              <Icon name={type.icon} size={26} className={on ? undefined : "text-[var(--m-ink)]"} />
              <span className="text-[14.5px] font-extrabold">{t(type.so, type.en)}</span>
            </button>
          );
        })}
      </div>

      <SectionHead title={t("Goobta iyo waqtiga", "Place and time")} />
      <Card className="-mt-1 gap-2.5 p-3.5">
        <div className="flex h-[52px] items-center gap-2.5 rounded-[12px] bg-[var(--m-soft)] px-3.5 text-[var(--m-ink)]">
          <Icon name="lock-keyhole-minimalistic-linear" size={20} />
          <span className="flex-1 text-[16px] font-bold text-[var(--m-text)]">
            {officer.district}, {officer.regionName}
          </span>
        </div>
        <InputRow icon="map-point-linear" label={t("Tuulada ama xaafadda", "Village or area")} placeholder={t("Tuulada ama xaafadda", "Village or area")} value={ev.village} onChange={(e) => up("village", e.target.value)} />
        <InputRow icon="calendar-linear" label={t("Taariikhda", "Date")} type="date" max={TODAY} value={ev.date} onChange={(e) => up("date", e.target.value || TODAY)} />
      </Card>

      <SectionHead title={t("Dadka ay saameysay", "People affected")} />
      <div className="-mt-1 grid grid-cols-2 gap-3">
        <CounterSquare so="Dhaawac" en="Hurt" value={ev.hurt} onChange={(n) => up("hurt", n)} />
        <CounterSquare so="Qoysas barakacay" en="Families displaced" value={ev.displaced} onChange={(n) => up("displaced", n)} />
      </div>

      <Question so="Maxaa dhacay?" en="What happened?" required />
      <TextArea label={t("Maxaa dhacay", "What happened")} value={ev.description} max={TEXT_MAX} rows={3} invalid={tried && !ev.description.trim()} onChange={(v) => up("description", v)} />

      <Card className="gap-3">
        <Question so="Dhexdhexaadin ma dhacday?" en="Did mediation take place?" />
        <Segmented label={t("Dhexdhexaadin", "Mediation")} options={tri} value={ev.mediation} onChange={(v) => up("mediation", v)} />
        <div className="h-1" />
        <Question so="Heshiis ma la gaaray?" en="Was an agreement reached?" />
        <Segmented label={t("Heshiis", "Agreement")} options={tri} value={ev.agreement} onChange={(v) => up("agreement", v)} />
      </Card>

      <SectionHead title={t("Sawir", "Photo")} />
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      <div className="-mt-1 flex flex-wrap gap-3">
        {ev.photos.length < MAX_PHOTOS ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={t("Sawir ku dar", "Add photo")}
            className="flex size-[84px] flex-col items-center justify-center gap-1 rounded-[16px] border-2 border-dashed border-[var(--m-radio)] text-[12.5px] font-bold text-[var(--m-ink)]"
          >
            <Icon name="gallery-add-linear" size={26} />
            {t("Ku dar", "Add")}
          </button>
        ) : null}
        {ev.photos.map((p) => (
          <span key={p.id} className="relative">
            <PhotoThumb src={p.src} size={84} alt={p.name} />
            <button
              type="button"
              aria-label={`${t("Ka saar", "Remove")} ${p.name}`}
              onClick={() => up("photos", ev.photos.filter((x) => x.id !== p.id))}
              className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-[var(--m-card)] text-[var(--m-red)] shadow"
            >
              <Icon name="trash-bin-trash-linear" size={15} />
            </button>
          </span>
        ))}
      </div>

      <Cta icon="plain-linear" onClick={send} busy={busy} className="mt-2">
        {online ? t("Dir hadda", "Send now") : t("Kaydi — dir marka internet yimaado", "Save — send when online")}
      </Cta>
    </Screen>
  );
}
