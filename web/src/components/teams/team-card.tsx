"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, Pencil } from "lucide-react";
import type { Team } from "@/lib/api/types";
import { formatDateRange } from "@/lib/format";
import { PersonAvatar } from "@/components/person-avatar";
import { TeamFormDialog } from "@/components/teams/team-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** One team: who is in it and its status. */
export function TeamCard({ team }: { team: Team }) {
  const [editOpen, setEditOpen] = React.useState(false);

  const attended = team.status === "attended";

  return (
    <li className="rounded-2xl border border-border bg-surface/80 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">{team.name}</h3>
          <Link
            href={`/events/${team.event.id}`}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline"
          >
            {team.event.title} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {formatDateRange(team.event.startDate, team.event.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={attended ? "attended" : "info"}>{attended ? "Attended" : "Registered"}</Badge>
          <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
          </Button>
        </div>
      </div>

      <p className="mt-4 text-xs font-bold tracking-widest text-muted uppercase">Team</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {team.members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pr-3 pl-1"
          >
            <PersonAvatar name={member.name} className="h-6 w-6 text-xs" />
            <span className="text-sm font-semibold">{member.name}</span>
            <span className="text-xs text-muted">
              {member.role}
              {!member.accepted && " · waiting"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Your role: {team.myRole}</p>

      <TeamFormDialog open={editOpen} onOpenChange={setEditOpen} team={team} />
    </li>
  );
}
