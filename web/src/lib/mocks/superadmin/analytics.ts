import {
  clubById,
  clubs,
  colleges,
  events,
  reports,
  type MockEvent,
} from "@/lib/mocks/superadmin/data";

/**
 * NEW: the numbers behind /api/superadmin/analytics (MSW only).
 * The real backend computes the same shapes with SQL (group by week, type, college).
 * Everything is repeatable: no Math.random, so screens look the same on every run.
 */

const WEEKS = 24; // 12 shown at most, plus 12 to compare against
const DAY = 86_400_000;

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Monday of the week that contains `date`, as YYYY-MM-DD (UTC). */
export function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - back * DAY).toISOString().slice(0, 10);
}

/** Spread `total` over WEEKS weeks (newer weeks a little busier) so the weekly numbers add up exactly. */
export function weekly(total: number, salt: number): number[] {
  const weights = Array.from(
    { length: WEEKS },
    (_, k) => (0.55 + (0.9 * k) / (WEEKS - 1)) * (0.75 + 0.5 * seeded(k, salt)),
  );
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const whole = raw.map(Math.floor);
  let left = total - whole.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    whole[i] += 1;
    left -= 1;
  }
  return whole;
}

const sumOf = (list: number[]) => list.reduce((a, b) => a + b, 0);
const last = (list: number[], n: number) => list.slice(list.length - n);
const before = (list: number[], n: number) => list.slice(list.length - 2 * n, list.length - n);
const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

export function studentsIn(collegeId: string | null): number {
  return colleges.filter((c) => !collegeId || c.id === collegeId).reduce((n, c) => n + c.students, 0);
}

export function buildAnalytics(url: URL) {
  const weeksParam = Number(url.searchParams.get("weeks") ?? 8);
  const weeks = [4, 8, 12].includes(weeksParam) ? weeksParam : 8;
  const college = url.searchParams.get("college") || null;
  const type = url.searchParams.get("type") || null;

  const scoped: MockEvent[] = events.filter(
    (e) => (!college || clubById(e.clubId)?.collegeId === college) && (!type || e.type === type),
  );
  const total = (key: keyof MockEvent) => scoped.reduce((n, e) => n + Number(e[key]), 0);

  // Students belong to a college, not to an event type, so the type slicer leaves them alone.
  const students = studentsIn(college);
  const series = {
    signups: weekly(students, 11),
    interested: weekly(total("interested"), 12),
    registerClicks: weekly(total("registerClicks"), 13),
    matches: weekly(total("matches"), 14),
    teams: weekly(total("teams"), 15),
  };

  const thisWeek = mondayOf(new Date());
  const weekStarts = Array.from({ length: weeks }, (_, i) =>
    new Date(new Date(`${thisWeek}T00:00:00Z`).getTime() - (weeks - 1 - i) * 7 * DAY).toISOString().slice(0, 10),
  );
  const trend = weekStarts.map((weekStart, i) => {
    const at = WEEKS - weeks + i;
    return {
      weekStart,
      signups: series.signups[at],
      interested: series.interested[at],
      registerClicks: series.registerClicks[at],
      matches: series.matches[at],
    };
  });

  const now = (k: keyof typeof series) => sumOf(last(series[k], weeks));
  const prev = (k: keyof typeof series) => sumOf(before(series[k], weeks));
  const kpis = [
    {
      key: "students",
      label: "Students",
      unit: "count" as const,
      value: students,
      previous: students - now("signups"),
      spark: last(series.signups, weeks),
    },
    {
      key: "signups",
      label: "New students",
      unit: "count" as const,
      value: now("signups"),
      previous: prev("signups"),
      spark: last(series.signups, weeks),
    },
    {
      key: "interested",
      label: "Interested clicks",
      unit: "count" as const,
      value: now("interested"),
      previous: prev("interested"),
      spark: last(series.interested, weeks),
    },
    {
      key: "registerRate",
      label: "Register-click rate",
      unit: "percent" as const,
      value: rate(now("registerClicks"), now("interested")),
      previous: rate(prev("registerClicks"), prev("interested")),
      spark: last(series.registerClicks, weeks).map((v, i) => rate(v, last(series.interested, weeks)[i])),
    },
    {
      key: "matchRate",
      label: "Match rate",
      unit: "percent" as const,
      value: rate(now("matches"), now("interested")),
      previous: rate(prev("matches"), prev("interested")),
      spark: last(series.matches, weeks).map((v, i) => rate(v, last(series.interested, weeks)[i])),
    },
  ];

  const TYPES = ["hackathon", "meetup", "conference", "workshop"] as const;
  const byType = TYPES.map((t) => {
    const list = scoped.filter((e) => e.type === t);
    return {
      type: t,
      events: list.length,
      interested: list.reduce((n, e) => n + e.interested, 0),
      registerClicks: list.reduce((n, e) => n + e.registerClicks, 0),
    };
  });
  const byMode = (["offline", "online"] as const).map((mode) => {
    const list = scoped.filter((e) => e.mode === mode);
    return { mode, events: list.length, interested: list.reduce((n, e) => n + e.interested, 0) };
  });

  // The college slicer narrows every chart except the college charts themselves, which show all colleges
  // so a bar can be clicked to pick one. They still respect the type slicer.
  const typeOnly = events.filter((e) => !type || e.type === type);
  const collegeRows = colleges
    .map((c) => {
      const list = typeOnly.filter((e) => clubById(e.clubId)?.collegeId === c.id);
      return {
        id: c.id,
        name: c.name,
        students: c.students,
        events: list.length,
        interested: list.reduce((n, e) => n + e.interested, 0),
      };
    })
    .sort((a, b) => b.interested - a.interested);

  const heatColleges = collegeRows.filter((c) => c.events > 0).slice(0, 6);
  const heatmap = {
    rows: heatColleges.map((c) => ({ id: c.id, name: c.name })),
    cols: [...TYPES] as string[],
    cells: heatColleges.map((c) =>
      TYPES.map((t) =>
        events
          .filter((e) => e.type === t && clubById(e.clubId)?.collegeId === c.id)
          .reduce((n, e) => n + e.interested, 0),
      ),
    ),
  };

  const months = new Map<string, number>();
  for (const e of [...scoped].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    const key = e.startDate.slice(0, 7);
    months.set(key, (months.get(key) ?? 0) + 1);
  }
  const monthly = [...months].map(([key, count]) => ({
    month: key,
    events: count,
  }));

  const statuses = ["open", "reviewing", "resolved", "dismissed"];
  const reportsByStatus = statuses.map((status) => ({
    status,
    count: reports.filter((r) => r.status === status).length,
  }));
  const clubsInScope = clubs.filter((c) => !college || c.collegeId === college);

  return {
    filters: { weeks, college, type },
    kpis,
    trend,
    funnel: [
      { key: "interested", label: "Interested", value: total("interested") },
      { key: "register", label: "Register-link clicks", value: total("registerClicks") },
      { key: "teams", label: "Teams formed", value: total("teams") },
    ],
    byType,
    byMode,
    byCollege: collegeRows,
    heatmap,
    events: scoped.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      interested: e.interested,
      registerClicks: e.registerClicks,
      teams: e.teams,
    })),
    monthly,
    reportsByStatus,
    clubCoverage: {
      withAdmin: clubsInScope.filter((c) => c.admin).length,
      withoutAdmin: clubsInScope.filter((c) => !c.admin).length,
    },
  };
}
