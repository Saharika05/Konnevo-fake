import Link from "next/link";
import type { PersonCard } from "@/lib/api/types";
import { ProfileAvatar } from "@/components/profile-avatar";

/** A person in "Who is interested". Opens their profile for this event. */
export function PersonRow({
  eventId,
  person,
  note,
}: {
  eventId: string;
  person: PersonCard;
  /** For example the "why you match" line. */
  note?: string;
}) {
  return (
    <Link
      href={`/events/${eventId}/people/${person.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 p-3 transition-colors hover:bg-subtle"
    >
      <ProfileAvatar name={person.name} photoUrl={person.photoUrl} className="h-11 w-11 text-base" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{person.name}</p>
        {person.college && <p className="truncate text-xs text-muted">{person.college}</p>}
        {note ? (
          <p className="mt-1 text-xs font-semibold text-primary-text">{note}</p>
        ) : (
          person.topSkills.length > 0 && (
            <p className="mt-1 truncate text-xs text-muted">{person.topSkills.join(" · ")}</p>
          )
        )}
      </div>
    </Link>
  );
}
