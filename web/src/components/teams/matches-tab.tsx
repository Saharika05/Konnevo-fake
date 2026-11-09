"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type { MatchItem } from "@/lib/api/types";
import { friendlyMessage } from "@/lib/api/client";
import { teamsService } from "@/lib/services/teams";
import { MATCHES_KEY } from "@/lib/teams";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PersonAvatar } from "@/components/person-avatar";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { ListSkeleton } from "@/components/teams/list-skeleton";
import { TeamFormDialog } from "@/components/teams/team-form";
import { Button } from "@/components/ui/button";

export function MatchesTab() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: MATCHES_KEY, queryFn: teamsService.matches });
  const [removing, setRemoving] = React.useState<MatchItem | null>(null);
  const [teamFor, setTeamFor] = React.useState<MatchItem | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => teamsService.removeMatch(id),
    onSuccess: () => {
      toast.success("Match removed");
      void queryClient.invalidateQueries({ queryKey: MATCHES_KEY });
      setRemoving(null);
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });

  if (query.isPending) return <ListSkeleton />;
  if (query.isError)
    return <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />;

  const matches = query.data.matches;
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        action={
          <Button asChild>
            <Link href="/events">Find people at an event</Link>
          </Button>
        }
      >
        Open an event, look at the people going, and slide to match. Mutual matches land here.
      </EmptyState>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {matches.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface/80 p-4 sm:p-5"
          >
            <PersonAvatar name={item.person.name} className="h-11 w-11 text-base" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/events/${item.event.id}/people/${item.person.id}`}
                className="text-base font-bold hover:text-primary-text hover:underline"
              >
                {item.person.name}
              </Link>
              <p className="text-sm text-muted">
                Matched at{" "}
                <Link
                  href={`/events/${item.event.id}`}
                  className="font-semibold text-primary-text hover:underline"
                >
                  {item.event.title}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.linkedin && (
                <Button asChild size="sm" variant="outline">
                  <a href={item.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              )}
              {item.github && (
                <Button asChild size="sm" variant="outline">
                  <a href={item.github} target="_blank" rel="noopener noreferrer">
                    GitHub <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={() => setTeamFor(item)}>
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> Create team
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                onClick={() => setRemoving(item)}
                aria-label={`Remove match with ${item.person.name}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this match?"
        description={`${removing?.person.name ?? "This person"} will be removed from your matches.`}
        confirmLabel="Remove"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
      <TeamFormDialog
        open={teamFor !== null}
        onOpenChange={(open) => !open && setTeamFor(null)}
        prefill={teamFor ? { eventId: teamFor.event.id, personId: teamFor.person.id } : undefined}
      />
    </>
  );
}
