import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/syne";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { Providers } from "@/components/providers";
import { AuroraBackground } from "@/components/aurora-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HideOnCore } from "@/components/core/hide-on-core";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description:
    "konnevo puts every tech event around you in one place, shows who is going, and matches you with teammates whose skills fit yours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E3D28",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <AuroraBackground />
          <HideOnCore>
            <SiteHeader />
          </HideOnCore>
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <HideOnCore>
            <SiteFooter />
          </HideOnCore>
        </Providers>
      </body>
    </html>
  );
}
