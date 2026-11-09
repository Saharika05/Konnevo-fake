import * as React from "react";
import type { Metadata } from "next";
import { TeamsView } from "@/components/teams/teams-view";

export const metadata: Metadata = { title: "My Teams" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <TeamsView />
    </React.Suspense>
  );
}
