"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { useSession } from "@/lib/session";
import { useTeams } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileAvatar } from "@/components/profile-avatar";

type NavItem = { label: string; href: string; match: string[] };

const STUDENT_NAV: NavItem[] = [
  { label: "Events", href: "/events", match: ["/events"] },
  { label: "My Work", href: "/my-work", match: ["/my-work"] },
  { label: "My Teams", href: "/my-teams", match: ["/my-teams"] },
  { label: "Profile", href: "/profile", match: ["/profile", "/settings"] },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Events", href: "/events", match: ["/events"] },
  { label: "Add event", href: "/admin/events/new", match: ["/admin/events/new"] },
  { label: "Admin", href: "/admin", match: ["/admin"] },
];

/** The nav item with the longest matching prefix is the active one. */
function findActive(items: NavItem[], pathname: string): string | null {
  let best: string | null = null;
  let bestLength = 0;
  for (const item of items) {
    for (const prefix of item.match) {
      const matches = pathname === prefix || pathname.startsWith(`${prefix}/`);
      if (matches && prefix.length > bestLength) {
        best = item.href;
        bestLength = prefix.length;
      }
    }
  }
  return best;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isLoading, logout } = useSession();

  const isAdmin = role === "club_admin";
  const items = isAdmin ? ADMIN_NAV : STUDENT_NAV;
  const activeHref = findActive(items, pathname);
  // A dot on My Teams while invites are waiting.
  const invites = useTeams().data?.invites.length ?? 0;

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="theme-dark bar-dark sticky top-0 z-40 border-b border-border backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="relative block h-8 w-36 overflow-hidden rounded-sm">
            <Image
              src="/konnevo-logo.png"
              alt={APP_NAME}
              fill
              sizes="144px"
              priority
              className="object-cover"
              style={{ objectPosition: "center 40%" }}
            />
          </span>
        </Link>

        <nav aria-label="Main" className="hidden h-full items-stretch gap-7 md:flex">
          {items.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center text-sm font-medium text-muted transition-colors hover:text-foreground",
                  active &&
                    "font-bold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary",
                )}
              >
                {item.label}
                {item.href === "/my-teams" && invites > 0 && (
                  <span className="ml-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {invites}
                    <span className="sr-only"> invites waiting</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-24" aria-hidden="true" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-subtle">
                <ProfileAvatar name={user.name} photoUrl={user.photoUrl} className="h-8 w-8" />
                <span className="hidden text-sm font-bold sm:inline">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
                <span className="sr-only">Open account menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === "core" && (
                  <DropdownMenuItem asChild>
                    <Link href="/core">
                      <User className="h-4 w-4" aria-hidden="true" /> Core admin
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <User className="h-4 w-4" aria-hidden="true" /> Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="h-4 w-4" aria-hidden="true" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4" aria-hidden="true" /> Settings
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login?as=student" className="text-sm font-bold text-primary-text hover:underline">
                Log in
              </Link>
              <Button asChild>
                <Link href="/login?as=student">Join</Link>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="cursor-pointer rounded-lg p-2 hover:bg-subtle md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {items.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(item.href === activeHref && "font-bold text-primary-text")}
                  >
                    {item.label}
                    {item.href === "/my-teams" && invites > 0 && ` (${invites} invites)`}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
