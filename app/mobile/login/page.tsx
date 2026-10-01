"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { wait } from "@/lib/async";
import { cn } from "@/lib/utils";
import { officerByPhone } from "@/components/mobile/officers";
import { useSession, useT, type Msg } from "@/components/mobile/state";
import { Card, CircleButton, Cta, Icon, InputRow, LangSwitch, ListenButton, Logo, Note, Screen, SHADOW, ThemeButton } from "@/components/mobile/ui";

/** Screen 1 — phone number and PIN. The district comes from the account. */
export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const [phone, setPhone] = React.useState("+252 61 555 0142");
  const [pin, setPin] = React.useState("");
  const [pinFocus, setPinFocus] = React.useState(false);
  const [error, setError] = React.useState<Msg | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const officer = officerByPhone(phone);
    if (!officer) return setError({ so: "Lambarkan lama diiwaangelin.", en: "This phone number is not registered." });
    if (pin.length !== 4) return setError({ so: "Geli afarta lambar ee PIN-ka.", en: "Enter your 4-digit PIN." });
    setError(null);
    setBusy(true);
    await wait();
    signIn(officer.id);
    toast.success(`${t("Ku soo dhowow", "Welcome")}, ${officer.name.split(" ")[0]}`);
    router.replace("/mobile/home");
  }

  return (
    <Screen
      top={
        <header className="flex items-center gap-2 px-[18px] pt-4">
          <CircleButton icon="alt-arrow-left-linear" label={t("Dhammaan qaybaha", "All portals")} href="/" size={40} />
          <span className="flex-1" />
          <LangSwitch />
          <ThemeButton />
          <ListenButton clip="sign-in" text="Geli lambarka taleefankaaga iyo afarta lambar ee sirta ah, kadib riix Gal." />
        </header>
      }
      className="pb-7"
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-[18px]">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className={cn("grid size-20 place-items-center rounded-full bg-[var(--m-card)] text-[var(--m-ink)]", SHADOW)}>
            <Logo size={40} />
          </span>
          <p className="mt-1.5 text-[28px] font-extrabold tracking-[-0.015em]">Raad-Raac</p>
          <p className="text-[14.5px] leading-[1.35] font-semibold">
            {t("Wasaaradda Arrimaha Gudaha, Federaalka iyo Dib-u-heshiisiinta", "Ministry of Interior, Federal Affairs & Reconciliation")}
          </p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--m-soft)] px-3 py-[7px] text-[13px] font-bold text-[var(--m-ink)]">
            <Icon name="wi-fi-router-minimalistic-linear" size={16} />
            {t("Shaqeeyaa iyada oo aan internet lahayn", "Works without internet")}
          </span>
        </div>

        <Card className="gap-3 p-[18px]">
          <p className="text-[15px] font-extrabold">{t("Lambarka taleefanka", "Phone number")}</p>
          <InputRow icon="phone-linear" label={t("Lambarka taleefanka", "Phone number")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="mt-1 flex items-center justify-between">
            <p id="m-pin-label" className="text-[15px] font-extrabold">
              {t("Lambarka sirta (PIN)", "PIN")}
            </p>
            {/* Honesty: this prototype does not check the PIN. */}
            <span title={t("PIN-ka lama hubiyo", "The PIN is not checked")} className="rounded-full bg-[var(--m-field)] px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em] text-[var(--m-muted)] uppercase">
              Demo
            </span>
          </div>
          <div className="relative grid grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((i) => {
              const active = pinFocus && i === Math.min(pin.length, 3);
              return (
                <span key={i} className={cn("grid h-[60px] place-items-center rounded-[14px]", active ? "bg-[var(--m-card)] shadow-[inset_0_0_0_2px_var(--m-active)]" : "bg-[var(--m-field)]")}>
                  {pin.length > i ? <span className="size-3 rounded-full bg-[var(--m-text)]" /> : null}
                </span>
              );
            })}
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={4}
              value={pin}
              aria-labelledby="m-pin-label"
              onFocus={() => setPinFocus(true)}
              onBlur={() => setPinFocus(false)}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="absolute inset-0 size-full cursor-text opacity-0"
            />
          </div>
        </Card>

        {error ? <Note tone="red" icon="danger-circle-linear" so={error.so} en={error.en} /> : null}

        <Cta type="submit" icon="login-3-linear" busy={busy} className="mt-auto">
          {t("Gal", "Sign in")}
        </Cta>
        <button
          type="button"
          onClick={() => toast.info(t("La xiriir maamulaha degmadaada.", "Contact your district administrator."))}
          className="text-center text-[14.5px] font-extrabold text-[var(--m-ink)]"
        >
          {t("Ma ilowday PIN-ka?", "Forgot PIN?")}
        </button>
      </form>
    </Screen>
  );
}
