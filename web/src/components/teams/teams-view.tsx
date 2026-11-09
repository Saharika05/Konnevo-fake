"use client";

import * as React from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { friendlyMessage } from "@/lib/api/client";
import { useTeams } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { InvitesTab } from "@/components/teams/invites-tab";
import { ListSkeleton } from "@/components/teams/list-skeleton";
import { MatchesTab } from "@/components/teams/matches-tab";
import { TeamCard } from "@/components/teams/team-card";
import { TeamFormDialog } from "@/components/teams/team-form";
import { Button } from "@/components/ui/button";

const TABS = ["teams", "matches", "invites"] as const;
const LABELS = { teams: "Teams", matches: "Matches", invites: "Invites" } as const;

function TeamsTab({ onCreate }: { onCreate: () => void }) {
  const query = useTeams();
  if (query.isPending) return <ListSkeleton />;
  if (query.isError)
    return <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />;
  const { teams } = query.data;
  if (teams.length === 0) {
    return (
      <EmptyState title="No teams yet" action={<Button onClick={onCreate}>Create a team</Button>}>
        Match with people at an event, then team up. You can also accept an invite.
      </EmptyState>
    );
  }
  return (
    <ul className="space-y-4">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </ul>
  );
}

export function TeamsView() {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("teams"));
  const [creating, setCreating] = React.useState(false);
  const teams = useTeams();
  const inviteCount = teams.data?.invites.length ?? 0;

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    void setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My Teams</h1>
          <p className="mt-1 text-muted">Your teams, your matches and the invites waiting for you.</p>
        </div>
        <Button onClick={() => setCreating(true)}>Create a team</Button>
      </div>

      <div
        role="tablist"
        aria-label="My Teams sections"
        className="mt-6 inline-flex max-w-full overflow-x-auto rounded-xl bg-subtle p-1"
      >
        {TABS.map((item, index) => (
          <button
            key={item}
            id={`tab-${item}`}
            role="tab"
            type="button"
            aria-selected={tab === item}
            aria-controls={`panel-${item}`}
            tabIndex={tab === item ? 0 : -1}
            onClick={() => void setTab(item)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm sm:px-5 font-semibold transition-colors",
              tab === item ? "bg-surface text-foreground shadow" : "text-muted hover:text-foreground",
            )}
          >
            {LABELS[item]}
            {item === "invites" && inviteCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                {inviteCount}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-8">
        {tab === "teams" && <TeamsTab onCreate={() => setCreating(true)} />}
        {tab === "matches" && <MatchesTab />}
        {tab === "invites" && <InvitesTab onAccepted={() => void setTab("teams")} />}
      </div>

      <TeamFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
