"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { useSession } from "@/lib/session";
import { isCoreRole } from "@/lib/core/logic";

/**
 * Second check, in the page. Anyone who is not core (students, club admins and people who are
 * not logged in) sees the normal 404 page. The server layout does the first check; the API does the real one.
 */
export function CoreGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="core-root min-h-screen p-6" role="status" aria-busy="true" aria-label="Loading">
        <div className="h-8 w-48 animate-pulse rounded bg-core-line/60" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-core-line/40" />
      </div>
    );
  }
  if (!isCoreRole(user?.role)) notFound();
  return <>{children}</>;
}
