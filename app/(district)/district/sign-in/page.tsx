"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { BERDAALE_REPORT } from "@/data/berdaaleReport";
import { BigButton } from "@/components/phone/BigButton";
import { AudioHelp } from "@/components/phone/AudioHelp";
import { Logo } from "@/components/shell/Logo";
import { DemoBadge } from "@/components/system/DemoBadge";

/** Screen 1 — phone number + 4-digit PIN. */
export default function SignIn() {
  const t = useTranslations("district");
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  return (
    <div className="flex flex-col gap-5 px-5 pt-8">
      <div className="mx-auto grid size-16 place-items-center rounded-[18px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_svg]:size-9"><Logo /></div>
      <h1 className="text-center text-[22px] font-extrabold text-[var(--inv-value)]">{t("signIn")}</h1>
      <div className="flex justify-center"><DemoBadge label="Sign-in" /></div>
      <p className="-mt-1 text-center text-[12px] leading-[1.45] text-[var(--inv-muted)]">No PIN is checked in this prototype. Any four digits open the district app as Bashiir Muuse.</p>
      <AudioHelp clip="sign-in" text="Geli lambarka taleefankaaga iyo afarta lambar ee sirta ah." />
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-bold">Taleefan · Phone</span><input defaultValue={BERDAALE_REPORT.focalPoint.phone} inputMode="tel" className="h-14 rounded-[14px] border-[1.5px] border-[var(--inv-card-border)] px-4 text-[18px] font-bold tracking-wide" /></label>
      <div>
        <div className="mb-1.5 text-[13px] font-bold">PIN</div>
        <div className="mb-3 flex justify-center gap-3">{[0, 1, 2, 3].map((i) => <span key={i} className={`size-4 rounded-full ${pin.length > i ? "bg-[var(--inv-brand)]" : "bg-[var(--inv-line)]"}`} />)}</div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) => (
            <button key={k || "x"} type="button" disabled={!k} className="h-14 rounded-[14px] bg-[#f4f5f7] text-[22px] font-bold disabled:opacity-0 dark:bg-[#1c1d22]" onClick={() => setPin((p) => (k === "⌫" ? p.slice(0, -1) : p.length < 4 ? p + k : p))}>{k}</button>
          ))}
        </div>
      </div>
      <BigButton icon="solar:login-3-linear" disabled={pin.length < 4} onClick={() => router.push("/district")}>{t("signIn")}</BigButton>
    </div>
  );
}
