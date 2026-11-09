"use client";

import * as React from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api/client";
import { MockProvider } from "@/components/mock-provider";

/** A 401 anywhere except the session check itself means the login has expired. */
function handleUnauthorised(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname;
    const onPublicAuthPage = path.startsWith("/login") || path.startsWith("/auth/");
    if (!onPublicAuthPage) {
      window.location.assign(`/login?next=${encodeURIComponent(path + window.location.search)}`);
    }
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.queryKey[0] !== "auth") handleUnauthorised(error);
          },
        }),
        mutationCache: new MutationCache({ onError: handleUnauthorised }),
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } },
      }),
  );

  return (
    <MockProvider>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </MockProvider>
  );
}
