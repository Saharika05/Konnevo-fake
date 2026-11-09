import type { Metadata } from "next";
import { EventFormPage } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Add an event" };

export default function Page() {
  return <EventFormPage />;
}
