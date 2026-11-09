import * as React from "react";
import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <SettingsView />
    </React.Suspense>
  );
}
