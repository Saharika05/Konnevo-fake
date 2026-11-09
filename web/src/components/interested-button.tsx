"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Heart } from "lucide-react";
import { toast } from "sonner";
import type { EventItem } from "@/lib/api/types";
import { friendlyMessage } from "@/lib/api/client";
import { eventsService } from "@/lib/services/events";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

type Cached = { event: EventItem };

/**
 * "I'm interested". The button changes at once and goes back with a message if the
 * server says no. Visitors are asked to log in. Club admins do not see it.
 */
export function InterestedButton({ event, detailKey }: { event: EventItem; detailKey: readonly unknown[] }) {
  const queryClient = useQueryClient();
  const { role, isLoading } = useSession();

  const mutation = useMutation({
    mutationFn: (next: boolean) => eventsService.setInterested(event.id, next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Cached>(detailKey);
      queryClient.setQueryData<Cached>(detailKey, (old) =>
        old
          ? {
              event: {
                ...old.event,
                interested: next,
                interestedCount: Math.max(0, old.event.interestedCount + (next ? 1 : -1)),
              },
            }
          : old,
      );
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
      toast.error(friendlyMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (event.expired || isLoading || role === "club_admin") return null;

  if (role === "visitor") {
    return (
      <Button asChild size="lg">
        <Link href={`/login?as=student&next=${encodeURIComponent(`/events/${event.id}`)}`}>
          Log in to say you are interested
        </Link>
      </Button>
    );
  }

  const interested = !!event.interested;
  return (
    <Button
      size="lg"
      variant={interested ? "outline" : "primary"}
      aria-pressed={interested}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(!interested)}
    >
      {interested ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" /> You are interested
        </>
      ) : (
        <>
          <Heart className="h-4 w-4" aria-hidden="true" /> I am interested
        </>
      )}
    </Button>
  );
}
