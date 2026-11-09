import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { EventItem, EventType } from "@/lib/api/types";
import { formatDateRange } from "@/lib/format";
import { TiltCard } from "@/components/tilt-card";
import { Badge } from "@/components/ui/badge";
import { RegisterLink } from "@/components/register-link";

const BANNER: Record<EventType, string> = {
  hackathon: "from-sage/60 to-moss/40",
  meetup: "from-sage-200 to-sage/50",
  conference: "from-moss/40 to-sage/30",
  workshop: "from-sage/40 to-sage-200",
};

/** A poster, or a coloured banner when the event has none. */
export function EventBanner({ event, className }: { event: EventItem; className?: string }) {
  if (event.posterUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={event.posterUrl} alt="" className={`w-full object-cover ${className ?? ""}`} />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex items-end bg-gradient-to-br p-4 ${BANNER[event.type]} ${className ?? ""}`}
    >
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-foreground">{event.type}</span>
    </div>
  );
}

/**
 * One event in the list. The title is the link to the event page and stretches over the whole card;
 * the Register button sits on top of it and opens the event's own registration page.
 */
export function EventCard({ event }: { event: EventItem }) {
  return (
    <TiltCard className="flex h-full flex-col p-0">
      <EventBanner event={event} className="h-24" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="info" className="capitalize">
            {event.type}
          </Badge>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            {formatDateRange(event.startDate, event.endDate)}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <Link
            href={`/events/${event.id}`}
            className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary-text"
          >
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted">Posted by {event.clubName}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {event.place} · <span className="capitalize">{event.mode}</span>
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Users className="h-4 w-4" aria-hidden="true" />
            {event.interestedCount} interested
          </p>
          <RegisterLink event={event} />
        </div>
      </div>
    </TiltCard>
  );
}
