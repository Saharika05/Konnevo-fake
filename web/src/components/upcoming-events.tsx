"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { eventsService } from "@/lib/services/events";
import { EventCard } from "@/components/event-card";
import { Reveal } from "@/components/reveal";

/** The "Happening soon" strip on the Home page. Shows the next 3 upcoming events. */
export function UpcomingEvents() {
  const events = useQuery({ queryKey: ["events", "upcoming"], queryFn: eventsService.home });

  if (events.isPending) {
    return (
      <div className="grid gap-5 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    );
  }

  if (events.isError) {
    return <p className="text-sm text-danger-text">Could not load events. Please refresh the page.</p>;
  }

  const next = events.data.events.filter((event) => !event.expired).slice(0, 3);

  if (next.length === 0) {
    return <p className="text-sm text-muted">No upcoming events yet. Check back soon.</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {next.map((event, index) => (
        <Reveal key={event.id} delay={index * 120}>
          <EventCard event={event} />
        </Reveal>
      ))}
      <div className="md:col-span-3">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-text hover:underline"
        >
          See all events <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
