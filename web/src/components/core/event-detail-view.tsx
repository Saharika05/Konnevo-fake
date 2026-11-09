"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { useCoreEvent } from "@/lib/core/hooks";
import { BarRow, Card, formatDate, PageHeader, QueryState } from "@/components/core/ui";

function safeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : null;
}

export function EventDetailView({ id }: { id: string }) {
  const query = useCoreEvent(id);
  const event = query.data;
  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <>
      <Link
        href="/core/events"
        className="mb-3 inline-block text-xs font-bold text-primary-text hover:underline"
      >
        &lt; All events
      </Link>

      <Card>
        <QueryState
          {...query}
          isError={query.isError && !notFound}
          refetch={() => query.refetch()}
          isEmpty={notFound}
          emptyTitle="We could not find that event"
          emptyText="It may have been removed by its club."
          rows={8}
          label="Loading event"
        >
          {event && (
            <div className="p-5">
              <PageHeader
                title={event.title}
                subtitle={`${event.club} · ${event.college} · ${formatDate(event.startDate)}${
                  event.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""
                } · ${event.mode === "online" ? "Online" : "Offline"} · ${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`}
              />

              <dl className="mb-6 grid gap-3 text-[13px] sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold text-core-muted">
                    {event.mode === "online" ? "Link" : "Place"}
                  </dt>
                  <dd className="mt-0.5 break-words">{event.place}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-core-muted">Registration URL</dt>
                  <dd className="mt-0.5 break-all">
                    {safeUrl(event.registrationUrl) ? (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary-text hover:underline"
                      >
                        {event.registrationUrl}
                      </a>
                    ) : (
                      event.registrationUrl
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-core-muted">Poster</dt>
                  <dd className="mt-0.5">
                    {event.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.posterUrl}
                        alt={`Poster for ${event.title}`}
                        className="max-h-48 rounded-lg border border-core-line"
                      />
                    ) : (
                      <span className="text-core-muted">No poster uploaded</span>
                    )}
                  </dd>
                </div>
              </dl>

              <h2 className="mb-2 text-[15px] font-bold">From interest to teams</h2>
              <div role="list" aria-label="Funnel">
                {(
                  [
                    ["Interested", event.funnel.interested],
                    ["Register-link clicks", event.funnel.registerClicks],
                    ["Teams formed", event.funnel.teams],
                    ["Matches", event.funnel.matches],
                  ] as const
                ).map(([label, value]) => (
                  <div role="listitem" key={label}>
                    <BarRow label={label} value={value} max={event.funnel.interested} />
                  </div>
                ))}
              </div>

              <p className="mt-5 rounded-xl border border-core-line bg-core-primary-soft px-4 py-3 text-[13px]">
                Konnevo cannot see who registers on official sites. Register-link clicks are the closest
                signal.
              </p>
              <p className="mt-3 text-xs text-core-muted">
                Counts only. No names or personal details are shown here.
              </p>
            </div>
          )}
        </QueryState>
      </Card>
    </>
  );
}
