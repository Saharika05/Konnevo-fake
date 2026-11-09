"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { X } from "lucide-react";
import { useCoreAnalytics } from "@/lib/core/hooks";
import { ANALYTICS_WEEKS, EVENT_TYPES, type Analytics } from "@/lib/core/schemas";
import { monthLabel, weekLabel } from "@/lib/core/chart-math";
import {
  BubbleChart,
  CHART_COLORS,
  ColumnChart,
  DonutChart,
  FunnelChart,
  Heatmap,
  HBarChart,
  KpiTile,
  LineAreaChart,
  TYPE_COLOR,
  Visual,
} from "@/components/core/charts";
import { Card, coreInput, Label, PageHeader, QueryState } from "@/components/core/ui";
import { cn } from "@/lib/utils";

const PARSERS = {
  weeks: parseAsInteger.withDefault(8),
  college: parseAsString.withDefault(""),
  type: parseAsStringLiteral(EVENT_TYPES),
};

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const REPORT_COLORS: Record<string, string> = {
  open: CHART_COLORS.brick,
  reviewing: CHART_COLORS.amber,
  resolved: CHART_COLORS.mossDark,
  dismissed: CHART_COLORS.neutral,
};

export type Slicers = { weeks: number; college: string; type: string | null };
export type SlicerChange = (next: Partial<Slicers>) => void;

/** The screen: reads the slicers from the address bar, asks the API, draws the dashboard. */
export function AnalyticsView() {
  const router = useRouter();
  const [filters, setFilters] = useQueryStates(PARSERS, { history: "replace" });
  const query = useCoreAnalytics({
    weeks: filters.weeks,
    college: filters.college || undefined,
    type: filters.type ?? undefined,
  });
  const data = query.data;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="How students and events are doing across every college. Click a bar, ring or row to filter the whole page."
      />
      {query.isPending ? (
        <div role="status" aria-busy="true" aria-label="Loading analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-[150px] animate-pulse rounded-2xl bg-core-line/50" />
            ))}
          </div>
          <div className="h-[300px] animate-pulse rounded-2xl bg-core-line/50" />
        </div>
      ) : query.isError || !data ? (
        <Card>
          <QueryState {...query} isEmpty={false} emptyTitle="" refetch={() => query.refetch()}>
            {null}
          </QueryState>
        </Card>
      ) : (
        <AnalyticsDashboard
          data={data}
          busy={query.isFetching}
          onChange={(next) => void setFilters(next as Parameters<typeof setFilters>[0])}
          onOpenEvent={(id) => router.push(`/core/events/${id}`)}
        />
      )}
    </>
  );
}

/** Only draws; gets everything from props, so it can be tested and previewed without a server. */
export function AnalyticsDashboard({
  data,
  busy = false,
  onChange,
  onOpenEvent,
}: {
  data: Analytics;
  busy?: boolean;
  onChange: SlicerChange;
  onOpenEvent?: (id: string) => void;
}) {
  const { weeks, college, type } = data.filters;
  const collegeName = data.byCollege.find((c) => c.id === college)?.name;
  const compare = `vs previous ${weeks} weeks`;
  const labels = data.trend.map((row) => weekLabel(row.weekStart));
  const anyFilter = !!college || !!type;
  const noEvents = data.events.length === 0;

  const interestedTotal = data.byType.reduce((n, t) => n + t.interested, 0);

  return (
    <div className={cn("space-y-5", busy && "opacity-80 transition-opacity")} aria-busy={busy}>
      {/* Slicers */}
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div>
          <p id="slicer-weeks" className="mb-1 text-xs font-bold text-core-muted">
            Period
          </p>
          <div role="group" aria-labelledby="slicer-weeks" className="flex overflow-hidden rounded-lg border border-core-line">
            {ANALYTICS_WEEKS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={weeks === n}
                onClick={() => onChange({ weeks: n })}
                className={cn(
                  "h-10 cursor-pointer px-4 text-[13px] font-bold",
                  weeks === n ? "bg-core-primary text-primary-foreground" : "bg-core-card text-core-muted hover:text-core-text",
                )}
              >
                {n} weeks
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-[200px] flex-1 sm:flex-none">
          <Label htmlFor="slicer-college">College</Label>
          <select
            id="slicer-college"
            className={coreInput}
            value={college ?? ""}
            onChange={(e) => onChange({ college: e.target.value })}
          >
            <option value="">All colleges</option>
            {[...data.byCollege]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div className="min-w-[150px]">
          <Label htmlFor="slicer-type">Event type</Label>
          <select
            id="slicer-type"
            className={coreInput}
            value={type ?? ""}
            onChange={(e) => onChange({ type: (e.target.value || null) as Slicers["type"] })}
          >
            <option value="">All types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {cap(t)}
              </option>
            ))}
          </select>
        </div>
        {anyFilter && (
          <button
            type="button"
            onClick={() => onChange({ college: "", type: null })}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-core-line px-3 text-[13px] font-bold text-primary-text hover:bg-core-primary-soft"
          >
            <X className="h-4 w-4" aria-hidden="true" /> Clear filters
          </button>
        )}
        <p className="ml-auto text-xs text-core-muted">
          Showing {collegeName ?? "all colleges"}, {type ? `${type} events` : "all event types"}
        </p>
      </Card>

      {/* Headline numbers */}
      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map(({ key, label, value, previous, unit, spark }) => (
          <KpiTile
            key={key}
            label={label}
            value={value}
            previous={previous}
            unit={unit}
            spark={spark}
            compareLabel={compare}
          />
        ))}
      </section>

      {noEvents ? (
        <Card className="p-8 text-center">
          <p className="font-bold">No events match these filters.</p>
          <p className="mt-1 text-sm text-core-muted">Try another college or event type.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <Visual
              className="xl:col-span-2"
              title="Activity each week"
              caption={`Last ${weeks} weeks. Interested clicks, register-link clicks and matches.`}
            >
              <LineAreaChart
                ariaLabel={`Weekly interested clicks, register-link clicks and matches for the last ${weeks} weeks`}
                labels={labels}
                series={[
                  { key: "interested", name: "Interested", color: CHART_COLORS.olive, values: data.trend.map((r) => r.interested), area: true },
                  { key: "register", name: "Register clicks", color: CHART_COLORS.moss, values: data.trend.map((r) => r.registerClicks) },
                  { key: "matches", name: "Matches", color: CHART_COLORS.amber, values: data.trend.map((r) => r.matches) },
                ]}
              />
            </Visual>
            <Visual title="From interest to teams" caption="All time. Each step against the one before it.">
              <FunnelChart ariaLabel="Funnel from interested to teams formed" stages={data.funnel} />
              <p className="mt-3 text-xs text-core-muted">
                Register-link clicks are the closest signal to registrations: konnevo cannot see who registers on official sites.
              </p>
            </Visual>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Visual title="Interest by event type" caption="Click a type to filter. Interested clicks.">
              <DonutChart
                ariaLabel="Interested clicks by event type"
                slices={data.byType.map((t) => ({ key: t.type, label: cap(t.type), value: t.interested }))}
                colors={TYPE_COLOR}
                centerValue={interestedTotal.toLocaleString("en-IN")}
                centerLabel="interested"
                selected={type}
                onSelect={(key) => onChange({ type: key as Slicers["type"] })}
              />
            </Visual>
            <Visual title="Online or offline" caption="Events in this view.">
              <DonutChart
                ariaLabel="Events by mode"
                slices={data.byMode.map((m) => ({ key: m.mode, label: cap(m.mode), value: m.events }))}
                colors={{ offline: CHART_COLORS.olive, online: CHART_COLORS.moss }}
                centerValue={String(data.events.length)}
                centerLabel="events"
              />
            </Visual>
            <Visual title="Events by month" caption="By start date. Past and upcoming.">
              <ColumnChart ariaLabel="Events starting each month" items={data.monthly.map((m) => ({ label: monthLabel(m.month), value: m.events }))} />
            </Visual>
          </div>
        </>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Visual title="Interest by college" caption="Interested clicks. Click a college to filter.">
          <HBarChart
            ariaLabel="Interested clicks by college"
            items={data.byCollege.map((c) => ({
              key: c.id,
              label: c.name,
              value: c.interested,
              note: `${c.students.toLocaleString("en-IN")} students, ${c.events} events`,
            }))}
            selected={college || null}
            onSelect={(key) => onChange({ college: key ?? "" })}
          />
        </Visual>
        <Visual title="Where interest comes from" caption="Top colleges by event type. Darker is more interested clicks.">
          {data.heatmap.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-core-muted">Nothing to show yet.</p>
          ) : (
            <Heatmap
              ariaLabel="Interested clicks by college and event type"
              rows={data.heatmap.rows}
              cols={data.heatmap.cols}
              cells={data.heatmap.cells}
              selectedRow={college || null}
              onSelectRow={(id) => onChange({ college: id ?? "" })}
            />
          )}
        </Visual>
      </div>

      {!noEvents && (
        <div className="grid items-start gap-5 xl:grid-cols-3">
          <Visual
            className="xl:col-span-2"
            title="Which events convert"
            caption="Each bubble is an event. Further up means more register-link clicks. Click a bubble to open it."
          >
            <BubbleChart
              ariaLabel="Interested clicks against register-link clicks for each event"
              xLabel="Interested clicks"
              yLabel="Register-link clicks"
              points={data.events.map((e) => ({ id: e.id, title: e.title, type: e.type, x: e.interested, y: e.registerClicks, size: e.teams }))}
              onOpen={onOpenEvent}
            />
          </Visual>
          <div className="space-y-5">
            <Visual title="Reports" caption="All reports, by status.">
              <DonutChart
                ariaLabel="Reports by status"
                slices={data.reportsByStatus.map((r) => ({ key: r.status, label: cap(r.status), value: r.count }))}
                colors={REPORT_COLORS}
                centerValue={String(data.reportsByStatus.reduce((n, r) => n + r.count, 0))}
                centerLabel="reports"
              />
            </Visual>
            <Visual title="Club admin coverage" caption={collegeName ? `Clubs at ${collegeName}.` : "All clubs."}>
              <DonutChart
                ariaLabel="Clubs with and without an admin"
                slices={[
                  { key: "with", label: "Has an admin", value: data.clubCoverage.withAdmin },
                  { key: "without", label: "No admin yet", value: data.clubCoverage.withoutAdmin },
                ]}
                colors={{ with: CHART_COLORS.mossDark, without: CHART_COLORS.amber }}
                centerValue={String(data.clubCoverage.withAdmin + data.clubCoverage.withoutAdmin)}
                centerLabel="clubs"
              />
            </Visual>
          </div>
        </div>
      )}

      <p className="text-xs text-core-muted">
        Counts only: no names, emails or certificates appear on this page. Rates compare the last {weeks} weeks with the {weeks} weeks before.
        Reports and club coverage are not affected by the event type filter.
      </p>
    </div>
  );
}
