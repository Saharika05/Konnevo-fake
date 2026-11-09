import * as React from "react";
import type { Metadata } from "next";
import { MyWorkView } from "@/components/my-work-view";

export const metadata: Metadata = { title: "My Work" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <MyWorkView />
    </React.Suspense>
  );
}
