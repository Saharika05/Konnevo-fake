"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TeamInvite } from "@/lib/api/types";
import { friendlyMessage } from "@/lib/api/client";
import { formatDateRange } from "@/lib/format";
import { teamsService } from "@/lib/services/teams";
import { TEAMS_KEY, useTeams } from "@/lib/teams";
import { PersonAvatar } from "@/components/person-avatar";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { ListSkeleton } from "@/components/teams/list-skeleton";
import { Button } from "@/components/ui/button";

function InviteCard({ invite, onAccepted }: { invite: TeamInvite; onAccepted: () => void }) {
  const queryClient = useQueryClient();
  const respond = useMutation({
    mutationFn: (accept: boolean) => teamsService.respond(invite.id, accept),
    onSuccess: (_data, accept) => {
      toast.success(accept ? `You joined ${invite.teamName}` : "Invite declined");
      void queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      if (accept) onAccepted();
    },
    onError: (error) => {
      toast.error(friendlyMessage(error));
      // The invite may be gone already, so look again.
      void queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
  });

  return (
    <li className="rounded-2xl border border-border bg-surface/80 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <PersonAvatar name={invite.invitedBy.name} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            <span className="font-bold text-foreground">{invite.invitedBy.name}</span> invited you to join
          </p>
          <h3 className="text-xl font-extrabold tracking-tight">{invite.teamName}</h3>
          <Link
            href={`/events/${invite.event.id}`}
            className="text-sm font-semibold text-primary-text hover:underline"
          >
            {invite.event.title}
          </Link>
          <p className="text-sm text-muted">
            {formatDateRange(invite.event.startDate, invite.event.endDate)} · as {invite.role}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={respond.isPending} onClick={() => respond.mutate(false)}>
          Decline
        </Button>
        <Button variant="success" disabled={respond.isPending} onClick={() => respond.mutate(true)}>
          {respond.isPending ? "Working..." : "Accept"}
        </Button>
      </div>
    </li>
  );
}

export function InvitesTab({ onAccepted }: { onAccepted: () => void }) {
  const query = useTeams();
  if (query.isPending) return <ListSkeleton />;
  if (query.isError)
    return <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />;
  const invites = query.data.invites;
  if (invites.length === 0) {
    return (
      <EmptyState title="No invites right now">
        When someone you matched with invites you to a team, it shows up here.
      </EmptyState>
    );
  }
  return (
    <ul className="space-y-4">
      {invites.map((invite) => (
        <InviteCard key={invite.id} invite={invite} onAccepted={onAccepted} />
      ))}
    </ul>
  );
}
