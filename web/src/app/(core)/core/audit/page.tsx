import * as React from "react";
import { AuditView } from "@/components/core/audit-view";

export const metadata = { title: "Audit log" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <AuditView />
    </React.Suspense>
  );
}
