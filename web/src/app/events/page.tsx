import * as React from "react";
import type { Metadata } from "next";
import { EventsView } from "@/components/events-view";

export const metadata: Metadata = { title: "Upcoming events" };

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <EventsView />
    </React.Suspense>
  );
}
