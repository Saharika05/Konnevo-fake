import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerRole } from "@/lib/core/server-role";
import { CoreShell } from "@/components/core/core-shell";

// NEW (v3.1): the Core admin section. Not indexed, and never linked from any other role's screens.
export const metadata: Metadata = {
  title: { default: "Core admin", template: "%s · Core admin" },
  robots: { index: false, follow: false },
};

export default async function CoreLayout({ children }: { children: React.ReactNode }) {
  // Server-side check. Anyone who is not core gets the normal 404, not "forbidden".
  const role = await getServerRole();
  if (role !== "core" && role !== "unknown") notFound();

  // The in-page check (CoreGuard inside CoreShell) runs too, and is the one used in mock mode.
  return <CoreShell>{children}</CoreShell>;
}
