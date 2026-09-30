import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/shell/Providers";

// Body — Inter (highly readable UI workhorse)
const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
// Display / headings — Plus Jakarta Sans
const jakarta = Plus_Jakarta_Sans({ variable: "--font-display", subsets: ["latin"], display: "swap" });
// Mono — IBM Plex Mono (tables, numbers, codes)
const plexMono = IBM_Plex_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Somalia Peace Museum", template: "%s · Somalia Peace Museum" },
  description: "National Peace & Reconciliation Monitoring — Raad-Raac mockup",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable} ${plexMono.variable} h-auto overflow-hidden text-base antialiased [zoom:.9]`}>
      <head>
        {/* Solar icon set — same web component the Inventory System uses. */}
        <script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js" async />
      </head>
      <body className="m-0 block h-auto min-h-0 overflow-hidden bg-[var(--inv-app)] font-display text-[var(--inv-value)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
