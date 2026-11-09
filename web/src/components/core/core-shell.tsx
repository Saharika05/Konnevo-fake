"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { useSession } from "@/lib/session";
import { activeCoreHref, CORE_NAV } from "@/lib/core/logic";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/aurora-background";
import { CoreGuard } from "@/components/core/core-guard";

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const active = activeCoreHref(pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link href="/core" onClick={onNavigate} className="flex items-center gap-2 text-xl font-bold">
          <span className="relative block h-8 w-36 overflow-hidden rounded-sm">
            <Image
              src="/konnevo-logo.png"
              alt={APP_NAME}
              fill
              sizes="144px"
              className="object-cover"
              style={{ objectPosition: "center 40%" }}
            />
          </span>
        </Link>
        <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-primary-text uppercase">Core admin</p>
      </div>

      <nav aria-label="Core admin" className="flex-1 px-3">
        <ul className="space-y-0.5">
          {CORE_NAV.map((item) => {
            const isActive = item.href === active;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "block rounded-lg border-l-[3px] px-3 py-2 text-sm",
                    isActive
                      ? "border-primary bg-core-primary-soft font-bold text-primary-text"
                      : "border-transparent text-core-muted hover:bg-core-bg hover:text-core-text",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-core-line px-5 py-4 text-[13px]">
        <div className="mb-3 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-core-primary text-sm font-bold text-primary-foreground"
          >
            {(user?.name ?? "K").charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-bold">{user?.name ?? "Core team"}</span>
            <span className="block truncate text-[11px] text-core-muted">{user?.email}</span>
          </span>
        </div>
        {/* Open decision (default): the core admin also gets a student view. */}
        <Link href="/events" className="block text-primary-text hover:underline">
          Switch to student view
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="mt-2 flex cursor-pointer items-center gap-1.5 text-core-muted hover:text-core-text"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Log out
        </button>
      </div>
    </div>
  );
}

export function CoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CoreGuard>
      <Frame>{children}</Frame>
    </CoreGuard>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the phone menu when the page changes.
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="core-root min-h-screen md:flex">
      <AuroraBackground />
      {/* Laptop: fixed left sidebar */}
      <aside className="theme-dark bar-dark hidden w-60 shrink-0 border-r border-core-line md:sticky md:top-0 md:block md:h-screen">
        <SideNav />
      </aside>

      {/* Phone: top bar with a menu button */}
      <header className="theme-dark bar-dark sticky top-0 z-40 flex h-14 items-center justify-between border-b border-core-line px-4 md:hidden">
        <div>
          <span className="text-gradient text-lg font-bold">{APP_NAME}</span>
          <span className="ml-2 font-mono text-[11px] tracking-[0.2em] text-primary-text uppercase">
            Core admin
          </span>
        </div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="core-mobile-menu"
          onClick={() => setOpen((value) => !value)}
          className="cursor-pointer rounded p-2 hover:bg-core-bg"
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </header>
      {open && (
        <div
          id="core-mobile-menu"
          className="theme-dark bar-dark fixed inset-x-0 top-14 bottom-0 z-30 overflow-y-auto md:hidden"
        >
          <SideNav onNavigate={() => setOpen(false)} />
        </div>
      )}

      <main id="core-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
