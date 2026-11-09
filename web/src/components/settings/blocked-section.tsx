"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/api/client";
import { accountService } from "@/lib/services/account";
import { PersonAvatar } from "@/components/person-avatar";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Button } from "@/components/ui/button";

const BLOCKED_KEY = ["blocks", "mine"] as const;

export function BlockedSection() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: BLOCKED_KEY, queryFn: accountService.blocked });
  const unblock = useMutation({
    mutationFn: (id: string) => accountService.unblock(id),
    onSuccess: () => {
      toast.success("Unblocked");
      void queryClient.invalidateQueries({ queryKey: BLOCKED_KEY });
    },
    onError: (error) => {
      toast.error(friendlyMessage(error));
      void queryClient.invalidateQueries({ queryKey: BLOCKED_KEY });
    },
  });

  if (query.isPending) {
    return (
      <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface" aria-busy="true" />
    );
  }
  if (query.isError)
    return <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />;

  const people = query.data.blocked;
  if (people.length === 0) {
    return (
      <EmptyState title="Nobody is blocked">
        People you block cannot see you, and you cannot see them.
      </EmptyState>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {people.map((person) => (
        <li key={person.id} className="flex items-center gap-3 p-4">
          <PersonAvatar name={person.name} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{person.name}</p>
            {person.college && <p className="text-xs text-muted">{person.college}</p>}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={unblock.isPending}
            onClick={() => unblock.mutate(person.id)}
          >
            Unblock
          </Button>
        </li>
      ))}
    </ul>
  );
}
