import { EventDetailView } from "@/components/core/event-detail-view";

export const metadata = { title: "Event" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetailView id={id} />;
}
