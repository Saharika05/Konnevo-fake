"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMotionValue, useReducedMotion } from "motion/react";
import { MATCHES_KEY } from "@/lib/teams";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Match, SwipeDirection } from "@/lib/api/types";
import { ApiError, friendlyMessage } from "@/lib/api/client";
import { PRIVACY_KEY } from "@/lib/onboarding";
import { eventsService } from "@/lib/services/events";
import { profileService } from "@/lib/services/profile";
import { swipesService } from "@/lib/services/swipes";
import { AuroraBackground } from "@/components/aurora-background";
import { HeroCard } from "@/components/match/hero-card";
import { MatchPopup } from "@/components/match/match-popup";
import { SlideToMatch } from "@/components/match/slide-to-match";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function BackLink({ eventId }: { eventId: string }) {
  return (
    <Link
      href={`/events/${eventId}`}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the event
    </Link>
  );
}

function Frame({ eventId, children }: { eventId: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink eventId={eventId} />
      <div className="mt-5">{children}</div>
    </div>
  );
}

function DeckInner({ eventId, userId }: { eventId: string; userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();

  // -1 is a full slide to skip, 1 a full slide to match. The slider and the 3D card both read it.
  const progress = useMotionValue(0);
  const [exit, setExit] = React.useState<"idle" | SwipeDirection>("idle");
  const [match, setMatch] = React.useState<Match | null>(null);
  const [finished, setFinished] = React.useState(false);

  const person = useQuery({
    queryKey: ["events", "person", eventId, userId],
    queryFn: () => eventsService.person(eventId, userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const privacy = useQuery({
    queryKey: PRIVACY_KEY,
    queryFn: profileService.privacy,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const matchingOff = privacy.data?.privacy.showMeToOthers === false;

  const turnOn = useMutation({
    mutationFn: () => profileService.updatePrivacy({ showMeToOthers: true }),
    onSuccess: (data) => {
      queryClient.setQueryData(PRIVACY_KEY, data);
      toast.success("You are visible for matching again");
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });

  const swipe = useMutation({
    mutationFn: (direction: SwipeDirection) => swipesService.swipe({ eventId, targetId: userId, direction }),
  });

  const data = person.data && !person.data.lowCandidates ? person.data : null;
  const nextUserId = data?.nextUserId ?? null;

  // Warm up the next person, so the card appears at once instead of after a loading box.
  React.useEffect(() => {
    if (!nextUserId) return;
    void queryClient.prefetchQuery({
      queryKey: ["events", "person", eventId, nextUserId],
      queryFn: () => eventsService.person(eventId, nextUserId),
      staleTime: 60_000,
    });
  }, [nextUserId, eventId, queryClient]);

  function goNext() {
    if (nextUserId) router.replace(`/events/${eventId}/people/${nextUserId}`);
    else setFinished(true);
  }

  async function commit(direction: SwipeDirection) {
    if (!data || exit !== "idle" || swipe.isPending) return;
    setExit(direction);
    const pause = new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 320));
    try {
      const [result] = await Promise.all([swipe.mutateAsync(direction), pause]);
      void queryClient.invalidateQueries({ queryKey: ["events", "person", eventId] });
      if (result.matched && result.match) {
        // So the new match shows on My Teams straight away.
        void queryClient.invalidateQueries({ queryKey: MATCHES_KEY });
        setMatch(result.match);
      } else goNext();
    } catch (error) {
      // Put the card back and say why. A 401 is handled for the whole app.
      setExit("idle");
      progress.set(0);
      if (!(error instanceof ApiError && error.status === 401)) toast.error(friendlyMessage(error));
    }
  }

  if (person.isPending) {
    return (
      <Frame eventId={eventId}>
        <div
          className="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"
          aria-busy="true"
        />
      </Frame>
    );
  }

  if (person.isError) {
    const notFound = person.error instanceof ApiError && person.error.status === 404;
    return (
      <Frame eventId={eventId}>
        {notFound ? (
          <EmptyState
            title="We could not find that person"
            action={
              <Button asChild>
                <Link href={`/events/${eventId}`}>Back to the event</Link>
              </Button>
            }
          >
            They may have left the event.
          </EmptyState>
        ) : (
          <ErrorState message={friendlyMessage(person.error)} onRetry={() => person.refetch()} />
        )}
      </Frame>
    );
  }

  if (person.data.lowCandidates) {
    return (
      <Frame eventId={eventId}>
        <EmptyState
          title="Not enough people yet"
          action={
            <Button asChild>
              <Link href={`/events/${eventId}`}>Back to the event</Link>
            </Button>
          }
        >
          Swiping opens once a few more people mark this event as interesting. Check back soon.
        </EmptyState>
      </Frame>
    );
  }

  if (finished) {
    return (
      <Frame eventId={eventId}>
        <EmptyState
          title="You have seen everyone"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={`/events/${eventId}`}>Back to the event</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-teams?tab=matches">See my matches</Link>
              </Button>
            </div>
          }
        >
          New people appear as more students mark this event. Come back later.
        </EmptyState>
      </Frame>
    );
  }

  const current = person.data;

  return (
    <Frame eventId={eventId}>
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-sm font-bold tracking-wide text-muted" aria-live="polite">
          Person <span className="text-2xl text-foreground">{current.position}</span> of {current.total}
        </p>
        <div
          role="progressbar"
          aria-label="Position in the list"
          aria-valuemin={1}
          aria-valuemax={current.total}
          aria-valuenow={current.position}
          className="mb-2 h-1.5 w-32 overflow-hidden rounded-full bg-subtle sm:w-48"
        >
          <span
            className="block h-full rounded-full bar-fill"
            style={{ width: `${(current.position / current.total) * 100}%` }}
          />
        </div>
      </div>

      {matchingOff && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-warning-soft px-4 py-3 text-sm text-warning-text"
        >
          <span>You are hidden from matching, so swiping is paused.</span>
          <Button size="sm" onClick={() => turnOn.mutate()} disabled={turnOn.isPending}>
            {turnOn.isPending ? "Turning on..." : "Turn on matching"}
          </Button>
        </div>
      )}

      <div className="mt-5">
        <HeroCard person={current.person} whyMatch={current.whyMatch} progress={progress} exit={exit} />
      </div>

      {current.swiped && (
        <p className="mt-4 text-center text-xs text-muted">
          You already chose{" "}
          <strong className="text-foreground">{current.swiped === "right" ? "Match" : "Skip"}</strong> for
          this person. You can change your mind.
        </p>
      )}

      <section aria-labelledby="projects-heading" className="mt-10">
        <h2 id="projects-heading" className="font-display text-2xl font-extrabold tracking-tight">
          Projects
        </h2>
        {current.person.projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{current.person.name} has not added a project yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {current.person.projects.map((project) => (
              <li key={project.id} className="rounded-2xl border border-border bg-surface/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold">{project.title}</h3>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-text hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">{project.title} (opens in a new tab)</span>
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{project.description}</p>
                {project.techTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.techTags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The control stays in reach while you read */}
      <div className="sticky bottom-4 z-20 mt-10 rounded-3xl border border-border bg-background/80 p-4 shadow-dock backdrop-blur-xl">
        <SlideToMatch
          progress={progress}
          name={current.person.name}
          resetKey={userId}
          disabled={exit !== "idle" || matchingOff || !!match}
          onCommit={commit}
        />
      </div>

      {match && (
        <MatchPopup
          match={match}
          onKeepSwiping={() => {
            setMatch(null);
            goNext();
          }}
          onSeeMatches={() => router.push("/my-teams?tab=matches")}
        />
      )}
    </Frame>
  );
}

/** One person at a time. Each person gets a fresh deck, so the card enters with its own animation. */
export function PersonDeck({ eventId, userId }: { eventId: string; userId: string }) {
  return (
    <div className="theme-dark">
      <AuroraBackground variant="dark" />
      <DeckInner key={userId} eventId={eventId} userId={userId} />
    </div>
  );
}
