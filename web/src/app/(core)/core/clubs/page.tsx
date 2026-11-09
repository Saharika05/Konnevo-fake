import * as React from "react";
import { ClubsView } from "@/components/core/clubs-view";

export const metadata = { title: "Clubs and admins" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ClubsView />
    </React.Suspense>
  );
}
