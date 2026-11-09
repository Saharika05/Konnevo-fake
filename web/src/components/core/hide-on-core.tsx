"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";

/**
 * The student site header, footer and animated background are not shown inside the Core admin
 * (it has its own sidebar). They are hidden only for a core user, so everyone else who lands on
 * /core sees the normal 404 page with the normal site around it.
 */
export function HideOnCore({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role } = useSession();
  if (pathname.startsWith("/core") && role === "core") return null;
  return <>{children}</>;
}
