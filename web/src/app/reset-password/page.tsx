import * as React from "react";
import type { Metadata } from "next";
import { ResetPasswordView } from "@/components/reset-password-view";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordView />
    </React.Suspense>
  );
}
