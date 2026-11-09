import { cookies } from "next/headers";
import { API_URL, USE_MOCKS } from "@/lib/env";

/**
 * The role of the person asking for a /core page, read on the SERVER from GET /api/auth/me
 * with their own session cookie. "unknown" only happens in mock mode, where the fake login lives
 * in the browser and the server cannot see it (the in-page check still applies there).
 */
export async function getServerRole(): Promise<"core" | "student" | "club_admin" | "visitor" | "unknown"> {
  if (USE_MOCKS) return "unknown";
  try {
    const cookieHeader = (await cookies()).toString();
    if (!cookieHeader) return "visitor";
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: cookieHeader, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return "visitor";
    const data = (await response.json()) as { user?: { role?: string } };
    const role = data.user?.role;
    return role === "core" || role === "student" || role === "club_admin" ? role : "visitor";
  } catch {
    // If the API cannot be reached we cannot prove the person is core, so we do not show the section.
    return "visitor";
  }
}
