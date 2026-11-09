"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Team } from "@/lib/api/types";
import { ApiError, friendlyMessage } from "@/lib/api/client";
import { teamSchema, type TeamFormValues } from "@/lib/schemas/team";
import { teamsService } from "@/lib/services/teams";
import { MATCHES_KEY, TEAMS_KEY } from "@/lib/teams";
import { FormField } from "@/components/form-field";
import { PersonAvatar } from "@/components/person-avatar";
import { ErrorState } from "@/components/state-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** With a team the form only renames it and changes my role. */
  team?: Team;
  /** Start with this event and person ticked, for the "Create team" button on a match. */
  prefill?: { eventId: string; personId?: string };
};

/** Create a team from my matches, or edit one. A dialog, so it works from any tab. */
export function TeamFormDialog({ open, onOpenChange, team, prefill }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? "Edit team" : "Create a team"}</DialogTitle>
          <DialogDescription>
            {team
              ? "Change the team name or your role."
              : "Pick an event, then invite people you matched with. They need to accept."}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form always starts fresh. */}
        {open && <TeamForm team={team} prefill={prefill} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TeamForm({
  team,
  prefill,
  onDone,
}: {
  team?: Team;
  prefill?: Props["prefill"];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const matches = useQuery({ queryKey: MATCHES_KEY, queryFn: teamsService.matches, enabled: !team });

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team?.name ?? "",
      eventId: team?.event.id ?? prefill?.eventId ?? "",
      myRole: team?.myRole ?? "",
      memberIds: prefill?.personId ? [prefill.personId] : [],
    },
  });
  const { errors } = form.formState;
  const eventId = form.watch("eventId");
  const memberIds = form.watch("memberIds");

  const list = React.useMemo(() => matches.data?.matches ?? [], [matches.data]);
  const events = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of list) seen.set(item.event.id, item.event.title);
    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [list]);
  const people = list.filter((item) => item.event.id === eventId);

  // Pick the only event automatically, so there is one less thing to do.
  React.useEffect(() => {
    if (!team && !eventId && events.length === 1) form.setValue("eventId", events[0].id);
  }, [team, eventId, events, form]);

  const mutation = useMutation({
    mutationFn: (values: TeamFormValues) =>
      team
        ? teamsService.update(team.id, { name: values.name, myRole: values.myRole })
        : teamsService.create(values),
    onSuccess: () => {
      toast.success(team ? "Team updated" : "Team created. Invites are on their way.");
      void queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      onDone();
    },
    onError: (error) => {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        // The API's field names are snake_case, the form's are camelCase.
        const names: Record<string, keyof TeamFormValues> = {
          name: "name",
          event_id: "eventId",
          my_role: "myRole",
          member_ids: "memberIds",
        };
        for (const [key, message] of Object.entries(error.fields)) {
          form.setError(names[key] ?? "name", { type: "server", message });
        }
      } else {
        toast.error(friendlyMessage(error));
      }
    },
  });

  function toggle(personId: string) {
    const next = memberIds.includes(personId)
      ? memberIds.filter((id) => id !== personId)
      : [...memberIds, personId];
    form.setValue("memberIds", next, { shouldDirty: true });
  }

  if (!team && matches.isPending) {
    return <div className="h-40 animate-pulse rounded-xl bg-subtle" aria-busy="true" />;
  }
  if (!team && matches.isError) {
    return <ErrorState message={friendlyMessage(matches.error)} onRetry={() => matches.refetch()} />;
  }
  if (!team && events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <p className="font-bold">No matches yet</p>
        <p className="mt-1 text-sm text-muted">
          Teams are built from people you matched with. Open an event, slide to match, then come back.
        </p>
        <Button asChild className="mt-4">
          <Link href="/events">Find an event</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormField id="team-name" label="Team name" error={errors.name?.message}>
        <Input
          id="team-name"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "team-name-error" : undefined}
          {...form.register("name")}
        />
      </FormField>

      {!team && (
        <FormField id="team-event" label="Event" error={errors.eventId?.message}>
          <Select
            id="team-event"
            aria-invalid={errors.eventId ? true : undefined}
            aria-describedby={errors.eventId ? "team-event-error" : undefined}
            {...form.register("eventId", { onChange: () => form.setValue("memberIds", []) })}
          >
            <option value="">Choose an event</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <FormField
        id="team-role"
        label="My role"
        error={errors.myRole?.message}
        hint="For example: Frontend, Design, Backend"
      >
        <Input
          id="team-role"
          autoComplete="off"
          aria-invalid={errors.myRole ? true : undefined}
          aria-describedby={errors.myRole ? "team-role-error" : undefined}
          {...form.register("myRole")}
        />
      </FormField>

      {!team && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Invite from your matches</legend>
          {!eventId ? (
            <p className="text-sm text-muted">Choose an event to see your matches for it.</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-1.5">
              {people.map((item) => {
                const checked = memberIds.includes(item.person.id);
                const id = `member-${item.person.id}`;
                return (
                  <li key={item.id}>
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-subtle"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={checked}
                        onChange={() => toggle(item.person.id)}
                      />
                      <PersonAvatar name={item.person.name} />
                      <span className="text-sm font-semibold">{item.person.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.memberIds?.message && (
            <p role="alert" className="mt-1 text-xs text-danger-text">
              {errors.memberIds.message}
            </p>
          )}
        </fieldset>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : team ? "Save" : "Create team"}
        </Button>
      </DialogFooter>
    </form>
  );
}
