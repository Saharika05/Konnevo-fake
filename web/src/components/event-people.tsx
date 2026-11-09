"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { eventsService } from "@/lib/services/events";
import { friendlyMessage } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { PersonRow } from "@/components/person-row";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Button } from "@/components/ui/button";

function Skeletons({ count }: { count: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-xl border border-border bg-surface" />
      ))}
    </div>
  );
}

/** "Suggested teammates": a few people picked for you, each with a "why you match" line. */
function SuggestedTeammates({ eventId }: { eventId: string }) {
  const suggested = useQuery({
    queryKey: ["events", "suggested", eventId],
    queryFn: () => eventsService.suggested(eventId),
  });

  return (
    <section aria-labelledby="suggested-heading">
      <h2 id="suggested-heading" className="text-xl font-extrabold tracking-tight">
        Suggested teammates
      </h2>
      <div className="mt-4">
        {suggested.isPending ? (
          <Skeletons count={3} />
        ) : suggested.isError ? (
          <ErrorState message={friendlyMessage(suggested.error)} onRetry={() => suggested.refetch()} />
        ) : suggested.data.lowCandidates ? (
          <EmptyState title="Not enough people yet">
            Suggestions appear once a few more people mark this event as interesting.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.data.people.map((person) => (
              <PersonRow key={person.id} eventId={eventId} person={person} note={person.whyMatch} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** "Who is interested": 20 per page with a Load more button. */
function InterestedPeople({ eventId }: { eventId: string }) {
  const people = useInfiniteQuery({
    queryKey: ["events", "people", eventId],
    queryFn: ({ pageParam }) => eventsService.people(eventId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const total = people.data?.pages[0]?.total ?? 0;
  const list = people.data?.pages.flatMap((page) => page.people) ?? [];

  return (
    <section aria-labelledby="people-heading">
      <h2 id="people-heading" className="text-xl font-extrabold tracking-tight">
        Who is interested {total > 0 && <span className="text-muted">({total})</span>}
      </h2>
      <div className="mt-4">
        {people.isPending ? (
          <Skeletons count={6} />
        ) : people.isError ? (
          <ErrorState message={friendlyMessage(people.error)} onRetry={() => people.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title="Nobody yet">Be the first to say you are interested.</EmptyState>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((person) => (
                <PersonRow key={person.id} eventId={eventId} person={person} />
              ))}
            </div>
            {people.hasNextPage && (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => people.fetchNextPage()}
                  disabled={people.isFetchingNextPage}
                >
                  {people.isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** The people part of the event page. Students see it; visitors are asked to log in. */
export function EventPeople({ eventId }: { eventId: string }) {
  const { role, isLoading } = useSession();

  if (isLoading) return <Skeletons count={3} />;

  if (role === "visitor") {
    return (
      <div className="rounded-2xl border border-border bg-surface/80 p-6 text-center">
        <p className="text-lg font-bold">See who is going</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Log in as a student to see who is interested and get teammate suggestions.
        </p>
        <Button asChild className="mt-5">
          <Link href={`/login?as=student&next=${encodeURIComponent(`/events/${eventId}`)}`}>Log in</Link>
        </Button>
      </div>
    );
  }

  if (role === "club_admin") return null;

  return (
    <div className="space-y-10">
      <SuggestedTeammates eventId={eventId} />
      <InterestedPeople eventId={eventId} />
    </div>
  );
}
