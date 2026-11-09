"use client";

import Link from "next/link";
import { useCoreOverview } from "@/lib/core/hooks";
import { AUDIT_ACTION_LABEL } from "@/lib/core/schemas";
import {
  BarRow,
  Card,
  formatDate,
  PageHeader,
  QueryState,
  StatCard,
  TableSkeleton,
  td,
  th,
  TableWrap,
} from "@/components/core/ui";

export function OverviewView() {
  const query = useCoreOverview();
  const data = query.data;

  return (
    <>
      <PageHeader
        title="Core overview"
        subtitle="All colleges and all clubs"
        actions={
          <Link
            href="/core/analytics"
            className="inline-flex h-10 items-center rounded-lg border border-core-line bg-core-card px-4 text-[13px] font-bold text-primary-text hover:bg-core-primary-soft"
          >
            Open analytics &gt;
          </Link>
        }
      />

      {query.isPending ? (
        <div role="status" aria-busy="true" aria-label="Loading overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-core-line/50" />
            ))}
          </div>
          <TableSkeleton rows={4} />
        </div>
      ) : query.isError || !data ? (
        <Card>
          <QueryState {...query} isEmpty={false} emptyTitle="" refetch={() => query.refetch()}>
            {null}
          </QueryState>
        </Card>
      ) : (
        <div className="space-y-5">
          <section
            aria-label="Platform numbers"
            className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"
          >
            <StatCard value={data.totals.users} label="Total users" />
            <StatCard value={data.totals.newUsersThisWeek} label="New users this week" />
            <StatCard value={data.totals.profilesCompleted} label="Profiles completed" />
            <StatCard value={data.totals.colleges} label="Colleges" />
            <StatCard value={data.totals.clubs} label="Clubs" />
            <StatCard value={data.totals.liveEvents} label="Live (upcoming) events" />
            <StatCard value={data.totals.interestedClicks} label="Interested clicks" />
            <StatCard value={data.totals.registerClicks} label="Register-link clicks" />
            <StatCard value={data.totals.teamsFormed} label="Teams formed" />
            <StatCard value={data.totals.matches} label="Matches" />
            <StatCard value={data.totals.openReports} label="Open reports" />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 text-[15px] font-bold">Top events by interest</h2>
              {data.topEvents.length === 0 ? (
                <p className="text-[13px] text-core-muted">No interest recorded yet.</p>
              ) : (
                <div>
                  {data.topEvents.map((event) => (
                    <BarRow
                      key={event.id}
                      label={
                        <Link href={`/core/events/${event.id}`} className="hover:underline">
                          {event.title}
                        </Link>
                      }
                      value={event.interested}
                      max={data.topEvents[0].interested}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-[15px] font-bold">Needs attention</h2>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span>
                  {data.totals.openReports} open {data.totals.openReports === 1 ? "report" : "reports"}
                </span>
                <Link
                  href="/core/reports?status=open"
                  className="font-bold text-primary-text hover:underline"
                >
                  Review reports &gt;
                </Link>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold">Recent activity</h2>
              <Link href="/core/audit" className="text-[13px] font-bold text-primary-text hover:underline">
                Audit log &gt;
              </Link>
            </div>
            {data.recentAudit.length === 0 ? (
              <p className="py-4 text-[13px] text-core-muted">Nothing has been logged yet.</p>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th className={th}>Time</th>
                    <th className={th}>Actor</th>
                    <th className={th}>Action</th>
                    <th className={th}>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAudit.map((entry) => (
                    <tr key={entry.id}>
                      <td className={td}>{formatDate(entry.at, true)}</td>
                      <td className={td}>{entry.actor}</td>
                      <td className={td}>{AUDIT_ACTION_LABEL[entry.action]}</td>
                      <td className={td}>{entry.target}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
