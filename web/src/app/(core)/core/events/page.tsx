import * as React from "react";
import { EventsView } from "@/components/core/events-view";

export const metadata = { title: "Events" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <EventsView />
    </React.Suspense>
  );
}
