import { handlers } from "@/lib/mocks/handlers";
import { duplicateGroups } from "@/lib/core/logic";
import { monthLabel, delta, donutArcs, funnelSteps, niceMax, pct, ticks } from "@/lib/core/chart-math";
import {
  analyticsSchema,
  auditPageSchema,
  clubsPageSchema,
  collegesPageSchema,
  coreEventDetailSchema,
  coreEventsPageSchema,
  overviewSchema,
  reportDetailSchema,
  reportsPageSchema,
} from "@/lib/core/schemas";

// Checks the fake /api/superadmin: who may call it, and that every answer has the shape the screens expect.
const store: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => (store[k] = v),
  },
};
const realST = globalThis.setTimeout;
(globalThis as any).setTimeout = (fn: any, ms: any, ...a: any[]) => realST(fn, Math.min(ms ?? 0, 1), ...a);

let fails = 0;
async function call(method: string, path: string, body?: any) {
  const url = "http://x" + path;
  for (const h of handlers as any[]) {
    if (h.method !== method) continue;
    const m = h.re.exec(url);
    if (!m) continue;
    const init: any = { method };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers = { "content-type": "application/json" };
    }
    const res: Response = await h.resolver({ request: new Request(url, init), params: m.groups ?? {} });
    const text = res.status === 204 ? "" : await res.text();
    const contentType = res.headers.get("content-type") ?? "";
    return {
      status: res.status,
      text,
      json: contentType.includes("json") && text ? JSON.parse(text) : null,
      res,
    };
  }
  throw new Error("NO HANDLER " + method + " " + path);
}
function check(name: string, cond: boolean, extra?: any) {
  if (!cond) {
    fails++;
    console.log("FAIL", name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : "");
  } else console.log("ok  ", name);
}
const login = (email: string, intent: string) =>
  call("POST", "/api/auth/login", { email, password: "password123", intent });

(async () => {
  // Access: nobody, a student and a club admin are all turned away; only core gets in.
  check("visitor gets 401", (await call("GET", "/api/superadmin/overview")).status === 401);
  await login("student@konnevo.test", "student");
  check("student gets 403", (await call("GET", "/api/superadmin/overview")).status === 403);
  check("student cannot read audit", (await call("GET", "/api/superadmin/audit")).status === 403);
  await call("POST", "/api/auth/logout");
  await login("admin@techclub.test", "admin");
  check("club admin gets 403", (await call("GET", "/api/superadmin/clubs")).status === 403);
  await call("POST", "/api/auth/logout");

  // The core user signs in with the normal student form (no special core login).
  const lg = await login("core@konnevo.test", "student");
  check("core signs in with the normal form", lg.status === 200 && lg.json.user.role === "core", lg.json);
  check("/api/auth/me says core", (await call("GET", "/api/auth/me")).json.user.role === "core");

  const ov = await call("GET", "/api/superadmin/overview");
  check("overview shape", ov.status === 200 && overviewSchema.safeParse(ov.json).success, ov.json);
  check("overview has 5 recent audit entries", ov.json.recentAudit.length === 5);

  const ev = await call("GET", "/api/superadmin/events?page=1");
  check(
    "events shape + pagination",
    coreEventsPageSchema.safeParse(ev.json).success && ev.json.total === 41 && ev.json.items.length === 10,
  );
  const ev5 = await call("GET", "/api/superadmin/events?page=5");
  check("last events page has 1 row", ev5.json.items.length === 1);
  const filt = await call("GET", "/api/superadmin/events?type=hackathon&mode=offline&q=hackfest");
  check(
    "events filters work",
    filt.json.items.every(
      (e: any) => e.type === "hackathon" && e.mode === "offline" && /hackfest/i.test(e.title),
    ),
    filt.json.total,
  );
  const none = await call("GET", "/api/superadmin/events?q=zzzz");
  check("events empty result", none.json.total === 0 && none.json.items.length === 0);

  const csv = await call("GET", "/api/superadmin/events/export?type=hackathon");
  const lines = csv.text.trim().split("\n");
  const hackathons = await call("GET", "/api/superadmin/events?type=hackathon&pageSize=200");
  check(
    "csv export = the filtered list",
    csv.status === 200 &&
      lines[0].startsWith("Title,Club,College") &&
      lines.length - 1 === hackathons.json.total,
    { lines: lines.length, total: hackathons.json.total },
  );
  check(
    "csv has no personal columns",
    !/email|name|phone/i.test(lines[0].replace(/Title|Club|College/g, "")),
  );
  check(
    "csv file name header",
    /konnevo_events_\d{4}-\d{2}-\d{2}\.csv/.test(csv.res.headers.get("content-disposition") ?? ""),
  );

  const detail = await call("GET", "/api/superadmin/events/ev-1");
  check(
    "event detail + funnel",
    detail.status === 200 && coreEventDetailSchema.safeParse(detail.json).success,
    detail.json,
  );
  check("event detail 404", (await call("GET", "/api/superadmin/events/nope")).status === 404);

  const rep = await call("GET", "/api/superadmin/reports?status=open");
  check(
    "reports filter by status",
    reportsPageSchema.safeParse(rep.json).success && rep.json.items.every((r: any) => r.status === "open"),
  );
  const all = await call("GET", "/api/superadmin/reports");
  check(
    "deleted user shows as null reporter",
    all.json.items.some((r: any) => r.reporter === null),
  );
  const patched = await call("PATCH", "/api/superadmin/reports/rep-1", { status: "resolved", note: "Fixed" });
  check(
    "report status update + history",
    patched.status === 200 &&
      reportDetailSchema.safeParse(patched.json).success &&
      patched.json.history.at(-1).status === "resolved",
  );
  check(
    "report bad status 422",
    (await call("PATCH", "/api/superadmin/reports/rep-1", { status: "suspended" })).status === 422,
  );

  // Clubs and admins
  const clubs = await call("GET", "/api/superadmin/clubs?pageSize=200");
  check("clubs shape", clubsPageSchema.safeParse(clubs.json).success);
  const withAdmin = clubs.json.items.find((c: any) => c.admin);
  const free = clubs.json.items.find((c: any) => !c.admin);
  const dup = await call("POST", "/api/superadmin/admins", { clubId: withAdmin.id, email: "second@x.edu" });
  check(
    "second admin for same club -> 409 club_has_admin",
    dup.status === 409 && dup.json.error.code === "club_has_admin",
    dup.json,
  );
  const sameEmail = await call("POST", "/api/superadmin/admins", {
    clubId: free.id,
    email: withAdmin.admin.email,
  });
  check(
    "email already admin elsewhere -> 409",
    sameEmail.status === 409 && sameEmail.json.error.code === "email_already_admin",
    sameEmail.json,
  );
  const badEmail = await call("POST", "/api/superadmin/admins", { clubId: free.id, email: "not-an-email" });
  check(
    "bad email -> 422 with field",
    badEmail.status === 422 && !!badEmail.json.error.fields.email,
    badEmail.json,
  );
  const added = await call("POST", "/api/superadmin/admins", { clubId: free.id, email: "New.Admin@x.edu" });
  check("add admin 201", added.status === 201 && !!added.json.id, added);

  const eventsBefore = withAdmin.eventsCount;
  const removed = await call("DELETE", `/api/superadmin/admins/${withAdmin.admin.id}`);
  const clubsAfter = await call("GET", "/api/superadmin/clubs?pageSize=200");
  const same = clubsAfter.json.items.find((c: any) => c.id === withAdmin.id);
  check(
    "remove admin 204, club and events stay",
    removed.status === 204 && !!same && same.admin === null && same.eventsCount === eventsBefore,
    same,
  );
  check("remove unknown admin 404", (await call("DELETE", "/api/superadmin/admins/nope")).status === 404);

  // Colleges
  const cols = await call("GET", "/api/superadmin/colleges?pageSize=200");
  check("colleges shape", collegesPageSchema.safeParse(cols.json).success);
  const groups = duplicateGroups(cols.json.items);
  const pes = cols.json.items.find((c: any) => c.name === "PES");
  const pesUni = cols.json.items.find((c: any) => c.name.startsWith("PES University"));
  check(
    "PES and PES University flagged as one group",
    groups.get(pes.id) === groups.get(pesUni.id) && groups.has(pes.id),
  );
  const tech = cols.json.items.find((c: any) => c.name === "Tech University");
  check("unrelated college not flagged", !groups.has(tech.id));
  const merged = await call("POST", "/api/superadmin/colleges/merge", {
    keepId: pesUni.id,
    mergeIds: [pes.id],
  });
  check(
    "merge moves students",
    merged.status === 200 && merged.json.studentsMoved === pes.students,
    merged.json,
  );
  const afterCols = await call("GET", "/api/superadmin/colleges?pageSize=200");
  const keep = afterCols.json.items.find((c: any) => c.id === pesUni.id);
  check(
    "merged college is gone, kept one has the students",
    !afterCols.json.items.some((c: any) => c.id === pes.id) &&
      keep.students === pesUni.students + pes.students,
  );
  check(
    "merge with nothing to merge -> 422",
    (await call("POST", "/api/superadmin/colleges/merge", { keepId: pesUni.id, mergeIds: [] })).status ===
      422,
  );

  // Audit
  const audit = await call("GET", "/api/superadmin/audit");
  check(
    "audit shape + newest first",
    auditPageSchema.safeParse(audit.json).success && audit.json.items[0].at >= audit.json.items[1].at,
  );
  const kinds = new Set(audit.json.items.map((a: any) => a.action));
  check(
    "writes were logged",
    ["admin_added", "admin_removed", "colleges_merged", "report_status_updated", "events_exported"].every(
      (k) => kinds.has(k),
    ),
    [...kinds],
  );
  const byAction = await call("GET", "/api/superadmin/audit?action=colleges_merged");
  check(
    "audit filter by action",
    byAction.json.items.length > 0 && byAction.json.items.every((a: any) => a.action === "colleges_merged"),
  );
  check(
    "audit is read-only (no write handlers)",
    !(handlers as any[]).some((h) => /superadmin\/audit/.test(h.path) && h.method !== "GET"),
  );

  // Analytics (dashboards)
  const an0 = await call("GET", "/api/superadmin/analytics");
  check("analytics shape", analyticsSchema.safeParse(an0.json).success, an0.json && analyticsSchema.safeParse(an0.json));
  const A = an0.json;
  check("analytics default 8 weeks, 5 KPIs", A.filters.weeks === 8 && A.trend.length === 8 && A.kpis.length === 5);
  const ovr = (await call("GET", "/api/superadmin/overview")).json;
  check(
    "funnel matches the overview totals",
    A.funnel[0].value === ovr.totals.interestedClicks &&
      A.funnel[1].value === ovr.totals.registerClicks &&
      A.funnel[2].value === ovr.totals.teamsFormed &&
      A.funnel.length === 3 &&
      ovr.totals.proofsUploaded === undefined &&
      ovr.totals.proofsConfirmed === undefined,
  );
  check("funnel only goes down", A.funnel.every((s: any, i: number) => i === 0 || s.value <= A.funnel[i - 1].value));
  check("students KPI equals overview users", A.kpis[0].value === ovr.totals.users);
  check(
    "events by type adds up to all events",
    A.byType.reduce((n: number, t: any) => n + t.events, 0) === A.events.length &&
      A.events.length === 41,
  );
  check(
    "byMode adds up to events",
    A.byMode.reduce((n: number, m: any) => n + m.events, 0) === A.events.length,
  );
  check(
    "monthly adds up to events",
    A.monthly.reduce((n: number, m: any) => n + m.events, 0) === A.events.length,
  );
  const an12 = (await call("GET", "/api/superadmin/analytics?weeks=12")).json;
  check("weeks=12 gives 12 rows", an12.trend.length === 12 && an12.filters.weeks === 12);
  check(
    "12-week signups include the 8-week signups",
    an12.trend.reduce((n: number, r: any) => n + r.signups, 0) >= A.trend.reduce((n: number, r: any) => n + r.signups, 0),
  );
  const anBad = (await call("GET", "/api/superadmin/analytics?weeks=7")).json;
  check("unknown weeks falls back to 8", anBad.filters.weeks === 8);
  const anType = (await call("GET", "/api/superadmin/analytics?type=hackathon")).json;
  check(
    "type filter keeps only that type",
    anType.events.length > 0 && anType.events.every((e: any) => e.type === "hackathon") &&
      anType.byType.filter((t: any) => t.type !== "hackathon").every((t: any) => t.events === 0),
  );
  const firstCollege = A.byCollege[0];
  const anCol = (await call("GET", "/api/superadmin/analytics?college=" + firstCollege.id)).json;
  check(
    "college filter narrows events and students",
    anCol.events.length === firstCollege.events && anCol.kpis[0].value === firstCollege.students,
    { got: anCol.events.length, want: firstCollege.events },
  );
  check("college charts still list every college", anCol.byCollege.length === A.byCollege.length);
  const anNone = await call("GET", "/api/superadmin/analytics?college=" + firstCollege.id + "&type=nope");
  check("filters that match nothing give an empty, valid answer",
    analyticsSchema.safeParse(anNone.json).success && anNone.json.events.length === 0 && anNone.json.funnel[0].value === 0);
  check(
    "heatmap is rows x cols",
    A.heatmap.cells.length === A.heatmap.rows.length && A.heatmap.cells.every((r: number[]) => r.length === A.heatmap.cols.length),
  );
  check(
    "analytics is core only",
    (await login("student@konnevo.test", "student")).status === 200 &&
      (await call("GET", "/api/superadmin/analytics")).status === 403,
  );
  await login("core@konnevo.test", "core");

  check("monthly months are YYYY-MM", A.monthly.every((m: any) => /^\d{4}-\d{2}$/.test(m.month)));
  check("monthLabel", monthLabel("2026-10") === "Oct 26" && monthLabel("2027-02") === "Feb 27");
  await login("student@konnevo.test", "student");
  check("register-click is 204 for a student", (await call("POST", "/api/events/ux-open-house/register-click")).status === 204);
  await login("core@konnevo.test", "core");

  // Chart maths
  check("niceMax", niceMax(0) === 1 && niceMax(87) === 100 && niceMax(1340) === 1500 && niceMax(4.2) === 5);
  check("ticks start at 0 and end at niceMax", ticks(87)[0] === 0 && ticks(87).slice(-1)[0] === 100 && ticks(87).length === 5);
  check("pct", pct(1, 4) === 25 && pct(1, 0) === 0 && pct(2, 3) === 66.7);
  check(
    "delta",
    delta(110, 100, "count").text === "10%" &&
      delta(90, 100, "count").direction === "down" &&
      delta(5, 0, "count").text === "new" &&
      delta(12.5, 10, "percent").text === "2.5 pts" &&
      delta(10, 10, "percent").direction === "flat",
  );
  const arcs = donutArcs([
    { key: "a", label: "A", value: 1 },
    { key: "b", label: "B", value: 3 },
    { key: "c", label: "C", value: 0 },
  ]);
  check("donut drops zeros and closes the circle", arcs.length === 2 && Math.abs(arcs[1].end - Math.PI * 2) < 1e-9);
  const steps = funnelSteps([
    { key: "a", label: "A", value: 200 },
    { key: "b", label: "B", value: 50 },
  ]);
  check("funnel steps", steps[0].ofPrevious === null && steps[1].ofFirst === 25 && steps[1].ofPrevious === 25);

  console.log(fails === 0 ? "ALL PASSED" : `${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
})();
