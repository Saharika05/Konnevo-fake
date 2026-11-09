import type { Metadata } from "next";
import { PersonDeck } from "@/components/match/person-deck";
import { RequireRole } from "@/components/route-guard";

export const metadata: Metadata = { title: "Meet a teammate" };

export default async function Page({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  return (
    <RequireRole role="student">
      <PersonDeck eventId={id} userId={userId} />
    </RequireRole>
  );
}
