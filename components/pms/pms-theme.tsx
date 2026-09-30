"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PmsThemeMode = "dark" | "light";

/**
 * Bridge to the app-wide next-themes provider so the ported PROHAPA dashboard
 * reads the same light/dark state as the rest of the Peace Museum shell.
 */
export function usePmsTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  // `resolvedTheme` is undefined until next-themes has read the document, which
  // is the same signal a mounted flag would give — without an extra render.
  const mode: PmsThemeMode = resolvedTheme === "dark" ? "dark" : "light";
  const setMode = React.useCallback((next: PmsThemeMode) => setTheme(next), [setTheme]);
  const toggle = React.useCallback(
    () => setTheme(mode === "dark" ? "light" : "dark"),
    [mode, setTheme],
  );

  return { mode, setMode, toggle };
}

/** Sun = "go light", Moon = "go dark" — matches common dashboard toggles. */
export function PmsThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = usePmsTheme();
  const isDark = mode === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggle}
      className={cn(
        "size-11 rounded-[10px] border-[color:var(--pms-icon-button-border)] bg-[var(--pms-icon-button-bg)] text-[var(--pms-icon-button-fg)] shadow-none transition-colors hover:bg-[var(--pms-sidebar-icon-hover-bg)] focus-visible:ring-2 focus-visible:ring-[var(--pms-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pms-canvas)]",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-[22px] stroke-[1.5]" aria-hidden />
      ) : (
        <Moon className="size-[22px] stroke-[1.5]" aria-hidden />
      )}
    </Button>
  );
}
