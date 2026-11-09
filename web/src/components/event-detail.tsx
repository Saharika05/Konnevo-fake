"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, friendlyMessage } from "@/lib/api/client";
import { formatDateRange, startsIn } from "@/lib/format";
import { eventsService } from "@/lib/services/events";
import { useSession } from "@/lib/session";
import { useTeams } from "@/lib/teams";
import { EventBanner } from "@/components/event-card";
import { EventPeople } from "@/components/event-people";
import { InterestedButton } from "@/components/interested-button";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EventDetail({ id }: { id: string }) {
  const { role, user } = useSession();
  // The role is part of the key so a login refreshes the "interested" flag.
  const detailKey = ["events", "detail", id, role] as const;
  const query = useQuery({ queryKey: detailKey, queryFn: () => eventsService.get(id) });
  const myTeam = useTeams().data?.teams.find((team) => team.event.id === id);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link. Copy it from the address bar.");
    }
  }

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded-lg bg-surface" />
        <div className="mt-3 h-24 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        {notFound ? (
          <EmptyState
            title="We could not find that event"
            action={
              <Button asChild>
                <Link href="/events">See upcoming events</Link>
              </Button>
            }
          >
            It may have been removed, or the link is wrong.
          </EmptyState>
        ) : (
          <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />
        )}
      </div>
    );
  }

  const event = query.data.event;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Upcoming events
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface/80">
        <EventBanner event={event} className="h-40 sm:h-52" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="capitalize">
              {event.type}
            </Badge>
            <Badge className="capitalize">{event.mode}</Badge>
            <Badge variant={event.expired ? "danger" : "success"}>
              {startsIn(event.startDate, event.endDate)}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h1>
          <p className="mt-1 text-sm text-muted">Posted by {event.clubName}</p>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-text" aria-hidden="true" />
              <dt className="sr-only">Date</dt>
              <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-text" aria-hidden="true" />
              <dt className="sr-only">Place</dt>
              <dd>{event.place}</dd>
            </div>
          </dl>

          <p className="mt-6 whitespace-pre-line text-muted">{event.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InterestedButton event={event} detailKey={detailKey} />
            {!event.expired && role !== "club_admin" && (
              <Button asChild size="lg" variant="outline">
                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                  Register <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            )}
            {role === "club_admin" && user?.clubName === event.clubName && (
              <Button asChild size="lg" variant="outline">
                <Link href={`/admin/events/${event.id}/edit`}>Edit event</Link>
              </Button>
            )}
            <Button size="lg" variant="ghost" onClick={share}>
              <Share2 className="h-4 w-4" aria-hidden="true" /> Share
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted" aria-live="polite">
            {event.interestedCount} {event.interestedCount === 1 ? "person is" : "people are"} interested
          </p>
        </div>
      </div>

      {myTeam && (
        <Link
          href="/my-teams"
          className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-success/40 bg-success-soft px-5 py-4 text-sm text-success-text hover:bg-success-soft/80"
        >
          <span>
            You are in <strong>{myTeam.name}</strong> for this event.
          </span>
          <span className="font-bold">Open My Teams →</span>
        </Link>
      )}

      <div className="mt-10">
        <EventPeople eventId={event.id} />
      </div>
    </div>
  );
}
