import * as React from "react";
import type { Metadata } from "next";
import { CreatePasswordView } from "@/components/create-password-view";
import { RequireRole } from "@/components/route-guard";

export const metadata: Metadata = { title: "Create password" };

export default function Page() {
  return (
    <RequireRole role="any" requireOnboarded={false}>
      <React.Suspense fallback={null}>
        <CreatePasswordView />
      </React.Suspense>
    </RequireRole>
  );
}
