import * as React from "react";
import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <LoginView />
    </React.Suspense>
  );
}
