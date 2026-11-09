"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { homeFor, useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

type Props = {
  /** Who may see this page. "any" means any logged-in person. */
  role: "student" | "club_admin" | "any";
  /** Students who have not finished onboarding are sent there first. */
  requireOnboarded?: boolean;
  children: React.ReactNode;
};

/**
 * Route guard. The role comes from GET /api/auth/me. This only decides what to
 * show; the server is the real check and answers 401 or 403 on its own.
 */
export function RequireRole({ role, requireOnboarded = true, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  const allowed = !!user && (role === "any" || user.role === role);
  const needsOnboarding = allowed && requireOnboarded && user.role === "student" && !user.onboardingComplete;

  React.useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const as = role === "club_admin" ? "admin" : "student";
      const here = pathname + window.location.search;
      router.replace(`/login?as=${as}&next=${encodeURIComponent(here)}`);
    } else if (needsOnboarding) {
      router.replace("/onboarding/1");
    }
  }, [isLoading, user, role, pathname, needsOnboarding, router]);

  if (isLoading || !user || needsOnboarding) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">You do not have access to this page</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          This page is for {role === "club_admin" ? "club admins" : "students"}. You are logged in as{" "}
          {user.role === "club_admin" ? "a club admin" : "a student"}.
        </p>
        <Button asChild className="mt-6">
          <Link href={homeFor(user)}>Go to my home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
