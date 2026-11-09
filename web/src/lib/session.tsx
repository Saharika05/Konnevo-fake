"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import type { SessionUser } from "@/lib/api/types";

export const ME_KEY = ["auth", "me"] as const;

export type ViewerRole = "visitor" | SessionUser["role"];

/**
 * Who is using the app. The answer always comes from GET /api/auth/me.
 * A visitor (not logged in) is `user === null`.
 */
export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ME_KEY,
    queryFn: authService.me,
    staleTime: 60_000,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });

  const user = query.data ?? null;
  const role: ViewerRole = user ? user.role : "visitor";

  return {
    user,
    role,
    isLoading: query.isPending,
    isAdmin: role === "club_admin",
    isStudent: role === "student",
    isCore: role === "core",
    logout: () => logoutMutation.mutateAsync(),
    /** Re-read the session, for example right after a login. */
    refresh: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
    setUser: (next: SessionUser | null) => queryClient.setQueryData(ME_KEY, next),
  };
}

/** Where a person lands after logging in. */
export function homeFor(user: SessionUser): string {
  if (user.role === "core") return "/core";
  if (user.role === "club_admin") return "/admin";
  return user.onboardingComplete ? "/events" : "/onboarding/1";
}

/** Only allow redirects to pages inside this site. */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/** Where to send someone right after login: new students go to onboarding, otherwise `next` or home. */
export function landingFor(user: SessionUser, next: string | null): string {
  if (user.role === "student" && !user.onboardingComplete) return "/onboarding/1";
  return next ?? homeFor(user);
}
