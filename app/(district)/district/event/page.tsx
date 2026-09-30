"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import type { Incident } from "@/data/alerts";
import type { Notification } from "@/data/notifications";
import { wait } from "@/lib/async";
import { logAct } from "@/lib/audit";
import { db } from "@/lib/db";
import { ENTITY } from "@/lib/entities";
import { nextId } from "@/lib/ids";
import { cn } from "@/lib/utils";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { BigButton } from "@/components/phone/BigButton";
import { Counter, Screen } from "@/components/phone/StepNav";

const TYPES = [
  ["solar:leaf-linear", "Grazing land", "Dhul daaqsimeed"],
  ["solar:waterdrops-linear", "Water point", "Biyo"],
  ["solar:home-2-linear", "Land / housing", "Dhul / guri"],
  ["solar:danger-triangle-linear", "Clash", "Dagaal"],
  ["solar:user-cross-linear", "Eviction", "Barakac"],
  ["solar:question-circle-linear", "Other", "Kale"],
] as const;

/** Urgent event report — writes a real incident the early-warning desk can see. */
export default function EventReport() {
  const router = useRouter();
  const [type, setType] = React.useState<string | null>(null);
  const [hurt, setHurt] = React.useState(0);
  const [fled, setFled] = React.useState(0);
  const [sending, setSending] = React.useState(false);

  async function send() {
    if (!type) return;
    setSending(true);
    await wait();

    const id = nextId("INC", 2026, 4);
    db.add<Incident>(ENTITY.incidents, {
      id,
      date: new Date().toISOString().slice(0, 10),
      district: BERDAALE_REPORT.district,
      region: BERDAALE_REPORT.region,
      type,
      fatalities: hurt,
      displaced: fled,
      status: "ongoing",
      lng: 43.53,
      lat: 3.21,
    });

    logAct({
      actor: BERDAALE_REPORT.focalPoint.name,
      role: "district-admin",
      action: "incident.report",
      target: id,
      note: `${type} in ${BERDAALE_REPORT.district} — ${hurt} hurt, ${fled} households displaced.`,
    });

    db.add<Notification>(ENTITY.notifications, {
      id: nextId("N", 2026, 3),
      title: `Event reported — ${BERDAALE_REPORT.district}`,
      body: `${type} · ${hurt} hurt · ${fled} households displaced.`,
      at: new Date().toISOString(),
      icon: "solar:danger-triangle-linear",
      tone: "red",
      href: "/conflict-navigator",
      unread: true,
    });

    setSending(false);
    toast.success("Sent to the early-warning desk", { description: `Reference ${id}` });
    router.push("/district");
  }

  return (
    <Screen title="Soo sheeg dhacdo · Report an event">
      <AudioHelp
        clip="event"
        text="Dooro nooca dhacdada. Warbixintani waxay si toos ah u gaadhaysaa xafiiska digniinta hore."
      />

      <div className="grid grid-cols-2 gap-2">
        {TYPES.map(([ic, en, so]) => (
          <button
            key={en}
            type="button"
            onClick={() => setType(en)}
            className={cn(
              "flex h-20 flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] text-[12px] font-bold",
              type === en
                ? "border-[var(--inv-red)] bg-[#fdecec] text-[var(--inv-red)] dark:bg-[rgba(217,74,74,.14)]"
                : "border-[var(--inv-card-border)]",
            )}
          >
            <iconify-icon icon={ic} className="text-[26px]" />
            {so}
          </button>
        ))}
      </div>

      <Counter label="Dhaawac · Hurt or killed" icon="solar:heart-broken-linear" value={hurt} onChange={setHurt} />
      <Counter label="Qoysas barakacay · Households fled" icon="solar:home-2-linear" value={fled} onChange={setFled} />

      <p className="text-[11.5px] text-[var(--inv-muted)]">Ha qorin magac qof · Do not write anyone&apos;s name.</p>

      <div className="pb-4">
        <BigButton icon="solar:plain-linear" tone="red" disabled={!type || sending} onClick={send}>
          {sending ? "Sending…" : "Dir hadda · Send now"}
        </BigButton>
      </div>
    </Screen>
  );
}
