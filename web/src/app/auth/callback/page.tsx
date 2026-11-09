import * as React from "react";
import type { Metadata } from "next";
import { AuthCallback } from "@/components/auth-callback";

export const metadata: Metadata = { title: "Logging in" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <AuthCallback />
    </React.Suspense>
  );
}
