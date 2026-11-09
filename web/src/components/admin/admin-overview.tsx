"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AdminReport, EventItem } from "@/lib/api/types";
import { friendlyMessage } from "@/lib/api/client";
import { ADMIN_OVERVIEW_KEY } from "@/lib/admin";
import { formatDateRange } from "@/lib/format";
import { adminService } from "@/lib/services/admin";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <div className="h-full rounded-2xl border border-border bg-surface/80 p-5 transition-colors hover:border-primary/50">
      <p className="font-display text-4xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

function ReportRow({ report }: { report: AdminReport }) {
  const queryClient = useQueryClient();
  const resolve = useMutation({
    mutationFn: () => adminService.resolveReport(report.id),
    onSuccess: () => {
      toast.success("Report resolved");
      void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_KEY });
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-sm font-bold">{report.subject}</p>
        <p className="text-sm text-muted">{report.reason}</p>
      </div>
      {report.status === "resolved" ? (
        <Badge variant="success">Resolved</Badge>
      ) : (
        <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate()}>
          {resolve.isPending ? "Working..." : "Resolve"}
        </Button>
      )}
    </li>
  );
}

export function AdminOverview() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ADMIN_OVERVIEW_KEY, queryFn: adminService.overview });
  const [deleting, setDeleting] = React.useState<EventItem | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => adminService.deleteEvent(id),
    onSuccess: () => {
      toast.success("Event deleted");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_KEY });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />
      </div>
    );
  }

  const { clubName, stats, events, reports } = query.data;
  const openReports = reports.filter((item) => item.status === "open").length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{clubName}</h1>
          <p className="mt-1 text-muted">Your events and your reports.</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">Add event</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Events posted" value={stats.events} />
        <Stat label="Upcoming" value={stats.upcoming} />
        <Stat label="People interested" value={stats.interested} />
      </div>

      <h2 className="mt-12 text-2xl font-extrabold tracking-tight">Your events</h2>
      <div className="mt-4">
        {events.length === 0 ? (
          <EmptyState
            title="No events yet"
            action={
              <Button asChild>
                <Link href="/admin/events/new">Add your first event</Link>
              </Button>
            }
          >
            Publish an event and students can start marking themselves interested.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface/80">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/events/${event.id}`}
                    className="font-bold hover:text-primary-text hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatDateRange(event.startDate, event.endDate || undefined)} · {event.interestedCount}{" "}
                    interested
                    {event.expired && " · ended"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleting(event)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mt-12 text-2xl font-extrabold tracking-tight">
        Reports {openReports > 0 && <Badge variant="warning">{openReports} open</Badge>}
      </h2>
      <div className="mt-4">
        {reports.length === 0 ? (
          <EmptyState title="No reports">Nothing has been reported. Good news.</EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface/80">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this event?"
        description={`"${deleting?.title ?? "This event"}" will disappear from the site. Students who marked interest lose it too.`}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
