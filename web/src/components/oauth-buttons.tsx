"use client";

import * as React from "react";
import { authService } from "@/lib/services/auth";
import { showServerError } from "@/lib/form-errors";
import type { LoginAs, OAuthProvider } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

/** Google and GitHub buttons. The API answers with the provider page to go to. */
export function OAuthButtons({ intent, next }: { intent: LoginAs; next: string | null }) {
  const [pending, setPending] = React.useState<OAuthProvider | null>(null);

  async function start(provider: OAuthProvider) {
    setPending(provider);
    try {
      const params = new URLSearchParams({ as: intent });
      if (next) params.set("next", next);
      const callbackUrl = `${window.location.origin}/auth/callback?${params.toString()}`;
      const { url } = await authService.oauth(provider, intent, callbackUrl);
      window.location.assign(url);
    } catch (error) {
      setPending(null);
      showServerError(error);
    }
  }

  return (
    <div className="grid gap-3">
      <Button variant="outline" size="lg" disabled={pending !== null} onClick={() => start("google")}>
        <span aria-hidden="true" className="text-base font-black text-primary-text">
          G
        </span>
        {pending === "google" ? "Opening Google..." : "Continue with Google"}
      </Button>
      <Button variant="outline" size="lg" disabled={pending !== null} onClick={() => start("github")}>
        <GitHubMark />
        {pending === "github" ? "Opening GitHub..." : "Continue with GitHub"}
      </Button>
    </div>
  );
}
