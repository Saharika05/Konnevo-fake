"use client";

import { ExternalLink } from "lucide-react";
import type { EventItem } from "@/lib/api/types";
import { eventsService } from "@/lib/services/events";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * "Register" on an event card: opens the event's own registration page in a new tab.
 * Club admins never see it, and it is not shown once the event is over.
 */
export function RegisterLink({ event, className }: { event: EventItem; className?: string }) {
  const { role } = useSession();
  if (event.expired || role === "club_admin") return null;
  return (
    <a
      href={event.registrationUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // Fire and forget: a failed count must never stop the student reaching the registration page.
        if (role === "student") void eventsService.registerClick(event.id).catch(() => {});
      }}
      className={cn(
        "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-subtle",
        className,
      )}
    >
      Register <ExternalLink className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">for {event.title} (opens in a new tab)</span>
    </a>
  );
}
