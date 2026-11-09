import * as React from "react";
import { ReportsView } from "@/components/core/reports-view";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ReportsView />
    </React.Suspense>
  );
}
