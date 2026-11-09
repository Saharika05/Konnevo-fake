"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { Search } from "lucide-react";
import { friendlyMessage } from "@/lib/api/client";
import { eventsService } from "@/lib/services/events";
import { EventCard } from "@/components/event-card";
import { Chip } from "@/components/onboarding/parts";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const TYPES = ["hackathon", "meetup", "conference", "workshop"];

/**
 * The Events page. Search, type, mode and dates live in the web address (nuqs),
 * so a filtered list can be shared as a link.
 */
export function EventsView() {
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
    type: parseAsArrayOf(parseAsString).withDefault([]),
    mode: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  // The search box types freely and updates the address 300 ms after the last key.
  // When the address changes some other way (Back button, "Clear filters"), the box follows it.
  const [search, setSearch] = React.useState(filters.q);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function onSearchChange(value: string) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void setFilters({ q: value || null }), 300);
  }

  React.useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  React.useEffect(() => () => clearTimeout(searchTimer.current), []);

  const events = useInfiniteQuery({
    queryKey: ["events", "list", filters.q, filters.type, filters.mode, filters.from, filters.to],
    queryFn: ({ pageParam }) =>
      eventsService.list(
        {
          q: filters.q,
          type: filters.type,
          mode: filters.mode,
          dateFrom: filters.from,
          dateTo: filters.to,
        },
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const list = events.data?.pages.flatMap((page) => page.events) ?? [];
  const hasFilters = !!(filters.q || filters.type.length || filters.mode || filters.from || filters.to);

  function toggleType(type: string) {
    const next = filters.type.includes(type)
      ? filters.type.filter((item) => item !== type)
      : [...filters.type, type];
    void setFilters({ type: next.length ? next : null });
  }

  function clearAll() {
    clearTimeout(searchTimer.current);
    setSearch("");
    void setFilters({ q: null, type: null, mode: null, from: null, to: null });
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Upcoming events</h1>
      <p className="mt-1 text-muted">Hackathons, meetups, conferences and workshops from clubs near you.</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-surface/70 p-4 sm:p-5">
        <div className="relative">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted"
            aria-hidden="true"
          />
          <Input
            id="event-search"
            type="search"
            className="pl-9"
            placeholder="Search by name, club or topic"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div role="group" aria-label="Event type" className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <Chip key={type} selected={filters.type.includes(type)} onClick={() => toggleType(type)}>
              <span className="capitalize">{type}</span>
            </Chip>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="event-mode" className="mb-1 block text-xs font-semibold text-muted">
              Mode
            </label>
            <Select
              id="event-mode"
              value={filters.mode}
              onChange={(event) => void setFilters({ mode: event.target.value || null })}
            >
              <option value="">Online and offline</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </Select>
          </div>
          <div>
            <label htmlFor="event-from" className="mb-1 block text-xs font-semibold text-muted">
              From
            </label>
            <Input
              id="event-from"
              type="date"
              value={filters.from}
              onChange={(event) => void setFilters({ from: event.target.value || null })}
            />
          </div>
          <div>
            <label htmlFor="event-to" className="mb-1 block text-xs font-semibold text-muted">
              To
            </label>
            <Input
              id="event-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => void setFilters({ to: event.target.value || null })}
            />
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-sm font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-8" aria-live="polite">
        {events.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-60 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : events.isError ? (
          <ErrorState message={friendlyMessage(events.error)} onRetry={() => events.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No events match your filters" : "No upcoming events yet"}
            action={hasFilters ? <Button onClick={clearAll}>Clear filters</Button> : undefined}
          >
            {hasFilters
              ? "Try fewer filters or a different search."
              : "Clubs post new events all the time. Check back soon."}
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {events.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => events.fetchNextPage()}
                  disabled={events.isFetchingNextPage}
                >
                  {events.isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
