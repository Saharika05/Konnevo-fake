"use client";

import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/api/client";
import { useCoreClubs, useCoreColleges, useCoreEvents, useExportEvents } from "@/lib/core/hooks";
import { EVENT_MODES, EVENT_TYPES, type EventFilters } from "@/lib/core/schemas";
import { eventsCsvFileName } from "@/lib/core/logic";
import {
  Card,
  CoreButton,
  coreInput,
  formatDate,
  Label,
  PageHeader,
  Pagination,
  QueryState,
  TableWrap,
  td,
  th,
} from "@/components/core/ui";

const PARSERS = {
  q: parseAsString.withDefault(""),
  college: parseAsString.withDefault(""),
  club: parseAsString.withDefault(""),
  type: parseAsStringLiteral(EVENT_TYPES),
  mode: parseAsStringLiteral(EVENT_MODES),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

function dateText(start: string, end?: string | null) {
  return end && end !== start ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);
}

/** The Export CSV button. It exports the list as currently filtered, using the file name konnevo_events_YYYY-MM-DD.csv. */
export function ExportCsvButton({ filters }: { filters: EventFilters }) {
  const exporter = useExportEvents();
  async function run() {
    try {
      const { blob } = await exporter.mutateAsync(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = eventsCsvFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (error) {
      toast.error(friendlyMessage(error));
    }
  }
  return (
    <CoreButton variant="outline" onClick={run} disabled={exporter.isPending}>
      <Download className="h-4 w-4" aria-hidden="true" />
      {exporter.isPending ? "Exporting…" : "Export CSV"}
    </CoreButton>
  );
}

export function EventsView() {
  const [params, setParams] = useQueryStates(PARSERS, { clearOnDefault: true });
  const filters: EventFilters = {
    q: params.q || undefined,
    college: params.college || undefined,
    club: params.club || undefined,
    type: params.type ?? undefined,
    mode: params.mode ?? undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    page: params.page,
  };
  const { page: _page, ...exportFilters } = filters;
  void _page;

  const query = useCoreEvents(filters);
  const colleges = useCoreColleges(1, 200);
  const clubs = useCoreClubs(1, 200);

  // The search box types freely and updates the URL after a short pause.
  const [text, setText] = React.useState(params.q);
  React.useEffect(() => setText(params.q), [params.q]);
  React.useEffect(() => {
    if (text === params.q) return;
    const timer = setTimeout(() => setParams({ q: text, page: 1 }), 350);
    return () => clearTimeout(timer);
  }, [text, params.q, setParams]);

  const filtered = !!(
    params.q ||
    params.college ||
    params.club ||
    params.type ||
    params.mode ||
    params.from ||
    params.to
  );
  const change = (patch: Partial<Record<keyof typeof PARSERS, unknown>>) =>
    setParams({ ...patch, page: 1 } as Parameters<typeof setParams>[0]);

  return (
    <>
      <PageHeader
        title="Events across all colleges"
        subtitle="Counts for every event on konnevo, past and upcoming"
        actions={<ExportCsvButton filters={exportFilters} />}
      />

      <Card className="mb-4 p-4">
        <form
          role="search"
          aria-label="Filter events"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="ev-q">Search by title</Label>
            <input
              id="ev-q"
              type="search"
              className={coreInput}
              placeholder="Search events"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ev-college">College</Label>
            <select
              id="ev-college"
              className={coreInput}
              value={params.college}
              onChange={(event) => change({ college: event.target.value })}
            >
              <option value="">All</option>
              {colleges.data?.items.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ev-club">Club</Label>
            <select
              id="ev-club"
              className={coreInput}
              value={params.club}
              onChange={(event) => change({ club: event.target.value })}
            >
              <option value="">All</option>
              {clubs.data?.items.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ev-type">Type</Label>
            <select
              id="ev-type"
              className={coreInput}
              value={params.type ?? ""}
              onChange={(event) => change({ type: event.target.value || null })}
            >
              <option value="">All</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ev-mode">Mode</Label>
            <select
              id="ev-mode"
              className={coreInput}
              value={params.mode ?? ""}
              onChange={(event) => change({ mode: event.target.value || null })}
            >
              <option value="">All</option>
              {EVENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ev-from">From date</Label>
            <input
              id="ev-from"
              type="date"
              className={coreInput}
              value={params.from}
              max={params.to || undefined}
              onChange={(event) => change({ from: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ev-to">To date</Label>
            <input
              id="ev-to"
              type="date"
              className={coreInput}
              value={params.to}
              min={params.from || undefined}
              onChange={(event) => change({ to: event.target.value })}
            />
          </div>
          {filtered && (
            <div className="flex items-end">
              <CoreButton
                variant="link"
                onClick={() => {
                  setText("");
                  setParams(null);
                }}
              >
                Clear filters
              </CoreButton>
            </div>
          )}
        </form>
      </Card>

      <Card className="p-2">
        <QueryState
          {...query}
          refetch={() => query.refetch()}
          isEmpty={query.data?.items.length === 0}
          emptyTitle={filtered ? "No events match these filters" : "No events yet"}
          emptyText={
            filtered ? "Try removing a filter." : "Events appear here as soon as clubs publish them."
          }
          rows={8}
          label="Loading events"
        >
          {query.data && (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Title</th>
                  <th className={th}>Club</th>
                  <th className={th}>College</th>
                  <th className={th}>Type</th>
                  <th className={th}>Mode</th>
                  <th className={th}>Date</th>
                  <th className={th}>Interested</th>
                  <th className={th}>Register clicks</th>
                  <th className={th}>Teams</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((event) => (
                  <tr key={event.id} className="hover:bg-core-bg">
                    <td className={td}>
                      <Link
                        href={`/core/events/${event.id}`}
                        className="font-bold text-primary-text hover:underline"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className={td}>{event.club}</td>
                    <td className={td}>{event.college}</td>
                    <td className={td + " capitalize"}>{event.type}</td>
                    <td className={td + " capitalize"}>{event.mode}</td>
                    <td className={td + " whitespace-nowrap"}>{dateText(event.startDate, event.endDate)}</td>
                    <td className={td + " tabular-nums"}>{event.interested}</td>
                    <td className={td + " tabular-nums"}>{event.registerClicks}</td>
                    <td className={td + " tabular-nums"}>{event.teams}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </QueryState>
      </Card>

      {query.data && (
        <Pagination
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPage={(page) => setParams({ page })}
          noun="events"
        />
      )}
    </>
  );
}
