"use client";

import * as React from "react";
import { USE_MOCKS } from "@/lib/env";

/**
 * Starts the fake API (MSW) before anything is shown, but only when
 * NEXT_PUBLIC_API_URL is empty. With a real API URL this renders children at once.
 */
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(!USE_MOCKS);

  React.useEffect(() => {
    if (!USE_MOCKS) return;
    let cancelled = false;
    import("@/lib/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass", quiet: true }))
      .catch((error) => console.error("Could not start the mock API. Did pnpm install finish?", error))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
