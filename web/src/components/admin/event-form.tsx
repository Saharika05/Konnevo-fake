"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EventItem } from "@/lib/api/types";
import { ApiError, friendlyMessage } from "@/lib/api/client";
import { ADMIN_OVERVIEW_KEY } from "@/lib/admin";
import { eventSchema, type EventFormValues } from "@/lib/schemas/event";
import { validateImage } from "@/lib/schemas/files";
import { adminService } from "@/lib/services/admin";
import { eventsService } from "@/lib/services/events";
import { useSession } from "@/lib/session";
import { FormField } from "@/components/form-field";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** The add event page, and (with an id) the edit event page. */
export function EventFormPage({ eventId }: { eventId?: string }) {
  const query = useQuery({
    queryKey: ["admin", "event", eventId],
    queryFn: () => eventsService.get(eventId as string),
    enabled: !!eventId,
  });

  let content: React.ReactNode;
  if (!eventId) {
    content = <EventForm />;
  } else if (query.isPending) {
    content = (
      <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" aria-busy="true" />
    );
  } else if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    content = notFound ? (
      <EmptyState
        title="We could not find that event"
        action={
          <Button asChild>
            <Link href="/admin">Back to the overview</Link>
          </Button>
        }
      >
        It may have been deleted.
      </EmptyState>
    ) : (
      <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />
    );
  } else {
    content = <EventForm event={query.data.event} />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm font-semibold text-muted hover:text-foreground">
        ← Back to the overview
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {eventId ? "Edit event" : "Add an event"}
      </h1>
      <p className="mt-1 text-muted">
        {eventId ? "Changes show on the event page straight away." : "It goes live as soon as you publish."}
      </p>
      <div className="mt-8">{content}</div>
    </div>
  );
}

function EventForm({ event }: { event?: EventItem }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [poster, setPoster] = React.useState<File | null>(null);
  const [posterError, setPosterError] = React.useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      type: event?.type ?? ("" as EventFormValues["type"]),
      mode: event?.mode ?? ("" as EventFormValues["mode"]),
      startDate: event?.startDate ?? "",
      endDate: event?.endDate ?? "",
      place: event?.place ?? "",
      registrationUrl: event?.registrationUrl ?? "",
      description: event?.description ?? "",
    },
  });
  const { errors } = form.formState;
  const descriptionLength = form.watch("description").length;

  const mutation = useMutation({
    mutationFn: (values: EventFormValues) => {
      const input = {
        title: values.title,
        type: values.type,
        mode: values.mode,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        place: values.place,
        registrationUrl: values.registrationUrl,
        description: values.description,
        poster: poster ?? undefined,
      };
      return event ? adminService.updateEvent(event.id, input) : adminService.createEvent(input);
    },
    onSuccess: ({ event: saved }) => {
      toast.success(event ? "Event updated" : "Event published");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_KEY });
      router.push(event ? "/admin" : `/events/${saved.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        // The API's field names are snake_case, the form's are camelCase.
        const names: Record<string, keyof EventFormValues> = {
          title: "title",
          type: "type",
          mode: "mode",
          start_date: "startDate",
          end_date: "endDate",
          place: "place",
          registration_url: "registrationUrl",
          description: "description",
        };
        for (const [key, message] of Object.entries(error.fields)) {
          if (key === "poster") setPosterError(message);
          else if (names[key]) form.setError(names[key], { type: "server", message });
        }
      } else {
        toast.error(friendlyMessage(error));
      }
    },
  });

  function onPoster(changeEvent: React.ChangeEvent<HTMLInputElement>) {
    const chosen = changeEvent.target.files?.[0] ?? null;
    changeEvent.target.value = "";
    if (!chosen) return;
    const problem = validateImage(chosen);
    setPosterError(problem);
    setPoster(problem ? null : chosen);
  }

  const describe = (name: keyof EventFormValues) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `event-${String(name)}-error` : undefined,
  });

  return (
    <form
      noValidate
      className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-7"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <FormField id="event-title" label="Title" error={errors.title?.message}>
        <Input id="event-title" autoComplete="off" {...describe("title")} {...form.register("title")} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="event-type" label="Type" error={errors.type?.message}>
          <Select id="event-type" {...describe("type")} {...form.register("type")}>
            <option value="">Choose a type</option>
            <option value="hackathon">Hackathon</option>
            <option value="meetup">Meetup</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
          </Select>
        </FormField>
        <FormField id="event-mode" label="Mode" error={errors.mode?.message}>
          <Select id="event-mode" {...describe("mode")} {...form.register("mode")}>
            <option value="">Online or offline</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="event-startDate" label="Start date" error={errors.startDate?.message}>
          <Input
            id="event-startDate"
            type="date"
            {...describe("startDate")}
            {...form.register("startDate")}
          />
        </FormField>
        <FormField
          id="event-endDate"
          label="End date (optional)"
          error={errors.endDate?.message}
          hint="Leave empty for a one-day event."
        >
          <Input id="event-endDate" type="date" {...describe("endDate")} {...form.register("endDate")} />
        </FormField>
      </div>

      <FormField
        id="event-place"
        label="Place"
        error={errors.place?.message}
        hint="A venue, or the link for an online event."
      >
        <Input id="event-place" autoComplete="off" {...describe("place")} {...form.register("place")} />
      </FormField>

      <FormField id="event-registrationUrl" label="Registration link" error={errors.registrationUrl?.message}>
        <Input
          id="event-registrationUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          {...describe("registrationUrl")}
          {...form.register("registrationUrl")}
        />
      </FormField>

      <FormField
        id="event-description"
        label={`Description (${descriptionLength}/2000)`}
        error={errors.description?.message}
      >
        <Textarea
          id="event-description"
          rows={6}
          {...describe("description")}
          {...form.register("description")}
        />
      </FormField>

      <div>
        <label htmlFor="event-poster" className="mb-1.5 block text-sm font-semibold">
          Poster (optional)
        </label>
        <input
          id="event-poster"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPoster}
          className="block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
          aria-describedby={posterError ? "event-poster-error" : undefined}
        />
        <p className="mt-1 text-xs text-muted">
          {poster
            ? `Chosen: ${poster.name}`
            : event?.posterUrl
              ? "A poster is already set. Choose a file to replace it."
              : "JPG, PNG or WebP, up to 5 MB."}
        </p>
        {posterError && (
          <p id="event-poster-error" role="alert" className="mt-1 text-xs text-danger-text">
            {posterError}
          </p>
        )}
      </div>

      <p className="text-sm text-muted">
        Posted as{" "}
        <strong className="text-foreground">{event?.clubName ?? user?.clubName ?? "your club"}</strong>
      </p>

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline" disabled={mutation.isPending}>
          <Link href="/admin">Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : event ? "Save changes" : "Publish event"}
        </Button>
      </div>
    </form>
  );
}
