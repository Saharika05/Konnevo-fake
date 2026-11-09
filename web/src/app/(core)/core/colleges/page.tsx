import * as React from "react";
import { CollegesView } from "@/components/core/colleges-view";

export const metadata = { title: "Colleges" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <CollegesView />
    </React.Suspense>
  );
}
