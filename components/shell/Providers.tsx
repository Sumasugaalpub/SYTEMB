"use client";

import * as React from "react";
import { NextIntlClientProvider } from "next-intl";

import { useEnabledLanguages } from "@/lib/settings";
import { DEFAULT_LANG, isLang, useStore, type Lang } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./theme-provider";
import { DbProvider } from "@/components/system/DbProvider";
import en from "@/messages/en.json";

const MESSAGES: Record<string, typeof en> = { en };

function IntlProvider({ children }: { children: React.ReactNode }) {
  const stored = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const enabled = useEnabledLanguages();

  // A language an administrator has switched off is not a language a user can
  // be left sitting in.
  const allowed = enabled.some((l) => l.id === stored);
  React.useEffect(() => {
    if (!allowed) setLang(enabled[0]?.id ?? DEFAULT_LANG);
  }, [allowed, enabled, setLang]);

  const lang: Lang = isLang(stored) && allowed ? stored : (enabled[0]?.id ?? DEFAULT_LANG);
  const rtl = enabled.find((l) => l.id === lang)?.rtl ?? false;

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang, rtl]);

  // Never hand next-intl an undefined bundle — a locale we do not ship falls back to English.
  return (
    <NextIntlClientProvider locale={lang} messages={MESSAGES[lang] ?? MESSAGES.en} timeZone="Africa/Mogadishu">
      {children}
    </NextIntlClientProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Rehydrate persisted filters / role / language / sharing after mount (avoids SSR mismatch).
  React.useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <IntlProvider>
        <TooltipProvider>
          <DbProvider>{children}</DbProvider>
        </TooltipProvider>
      </IntlProvider>
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}
