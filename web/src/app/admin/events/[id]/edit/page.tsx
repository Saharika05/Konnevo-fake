import type { Metadata } from "next";
import { EventFormPage } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Edit event" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventFormPage eventId={id} />;
}
