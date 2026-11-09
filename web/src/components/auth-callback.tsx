"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import { ME_KEY, landingFor, safeNext } from "@/lib/session";

/** Where Google and GitHub send the person back to. Reads the new session, then routes. */
export function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;

    const as = params.get("as") === "admin" ? "admin" : "student";
    const next = safeNext(params.get("next"));
    const urlError = params.get("error");

    async function finish() {
      if (urlError) {
        router.replace(`/login?as=${as}&error=${encodeURIComponent(urlError)}`);
        return;
      }
      try {
        const user = await authService.me();
        if (!user) {
          router.replace(`/login?as=${as}&error=login_failed`);
          return;
        }
        queryClient.setQueryData(ME_KEY, user);
        if (user.role === "student" && !user.hasPassword) {
          router.replace(`/create-password${next ? `?next=${encodeURIComponent(next)}` : ""}`);
        } else {
          router.replace(landingFor(user, next));
        }
      } catch {
        router.replace(`/login?as=${as}&error=login_failed`);
      }
    }
    void finish();
  }, [params, router, queryClient]);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-24 text-center sm:px-6" aria-busy="true">
      <p className="text-sm text-muted">Logging you in...</p>
    </div>
  );
}
