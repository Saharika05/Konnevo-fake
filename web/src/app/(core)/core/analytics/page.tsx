import * as React from "react";
import { AnalyticsView } from "@/components/core/analytics-view";

export const metadata = { title: "Analytics" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <AnalyticsView />
    </React.Suspense>
  );
}
