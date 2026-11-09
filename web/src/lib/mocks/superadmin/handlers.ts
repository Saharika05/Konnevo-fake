import { http, HttpResponse } from "msw";
import { APPROVED_ADMINS, mockDb } from "@/lib/mocks/db";
import { addAdminFormSchema, AUDIT_ACTIONS, REPORT_STATUSES, type AuditAction } from "@/lib/core/schemas";
import { buildAnalytics, studentsIn, weekly } from "@/lib/mocks/superadmin/analytics";
import {
  audit,
  clubById,
  clubs,
  collegeById,
  collegeName,
  colleges,
  events,
  nextId,
  reports,
  type MockEvent,
} from "@/lib/mocks/superadmin/data";

/**
 * NEW: the fake /api/superadmin. Same paths and shapes as the real one.
 * The real backend must also check the role on every request (403 for non-core users)
 * and write every change to audit_log. This mock does the same so the screens can be tried.
 */

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(status: number, code: string, message: string, fields: Record<string, string> = {}) {
  return HttpResponse.json({ error: { code, message, fields } }, { status });
}

/** Everything here is for the core team only. */
function core() {
  const user = mockDb.currentUser();
  if (!user) return { error: fail(401, "unauthenticated", "You are not logged in.") } as const;
  if (user.role !== "core") return { error: fail(403, "forbidden", "Not allowed.") } as const;
  return { user } as const;
}

function log(actor: string, action: AuditAction, target: string) {
  audit.unshift({ id: nextId("aud"), at: new Date().toISOString(), actor, action, target });
}

function paginate<T>(list: T[], url: URL, defaultSize = 10) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? defaultSize) || defaultSize),
  );
  return { items: list.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: list.length };
}

function eventRow(event: MockEvent) {
  return {
    id: event.id,
    title: event.title,
    club: clubById(event.clubId)?.name ?? "",
    college: collegeName(event.clubId),
    type: event.type,
    mode: event.mode,
    startDate: event.startDate,
    endDate: event.endDate,
    interested: event.interested,
    registerClicks: event.registerClicks,
    teams: event.teams,
  };
}

function filterEvents(url: URL): MockEvent[] {
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const college = url.searchParams.get("college");
  const club = url.searchParams.get("club");
  const type = url.searchParams.get("type");
  const mode = url.searchParams.get("mode");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  return events.filter(
    (event) =>
      (!q || event.title.toLowerCase().includes(q)) &&
      (!college || clubById(event.clubId)?.collegeId === college) &&
      (!club || event.clubId === club) &&
      (!type || event.type === type) &&
      (!mode || event.mode === mode) &&
      (!from || event.startDate >= from) &&
      (!to || event.startDate <= to),
  );
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function reportRow(report: (typeof reports)[number]) {
  const { history: _history, targetSummary: _summary, ...row } = report;
  void _history;
  void _summary;
  return row;
}

export const superadminHandlers = [
  http.get("*/api/superadmin/overview", async () => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const today = new Date().toISOString().slice(0, 10);
    const sum = (key: keyof MockEvent) => events.reduce((total, event) => total + Number(event[key]), 0);
    return HttpResponse.json({
      totals: {
        users: studentsIn(null),
        newUsersThisWeek: weekly(studentsIn(null), 11).slice(-1)[0],
        profilesCompleted: Math.round(studentsIn(null) * 0.79),
        colleges: colleges.length,
        clubs: clubs.length,
        liveEvents: events.filter((event) => event.startDate >= today).length,
        interestedClicks: sum("interested"),
        registerClicks: sum("registerClicks"),
        teamsFormed: sum("teams"),
        matches: sum("matches"),
        openReports: reports.filter((report) => report.status === "open").length,
      },
      topEvents: [...events]
        .sort((a, b) => b.interested - a.interested)
        .slice(0, 5)
        .map((event) => ({ id: event.id, title: event.title, interested: event.interested })),
      recentAudit: audit.slice(0, 5),
    });
  }),

  http.get("*/api/superadmin/analytics", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    return HttpResponse.json(buildAnalytics(new URL(request.url)));
  }),

  // Must come before events/:id
  http.get("*/api/superadmin/events/export", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const rows = filterEvents(new URL(request.url));
    const header = [
      "Title",
      "Club",
      "College",
      "Type",
      "Mode",
      "Start date",
      "End date",
      "Interested",
      "Register-link clicks",
      "Teams formed",
    ];
    const lines = rows.map((event) => {
      const row = eventRow(event);
      return [
        row.title,
        row.club,
        row.college,
        row.type,
        row.mode,
        row.startDate,
        row.endDate,
        row.interested,
        row.registerClicks,
        row.teams,
      ]
        .map(csvCell)
        .join(",");
    });
    log(who.user.email, "events_exported", `${rows.length} events`);
    const today = new Date().toISOString().slice(0, 10);
    return new HttpResponse([header.join(","), ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="konnevo_events_${today}.csv"`,
      },
    });
  }),

  http.get("*/api/superadmin/events/:id", async ({ params }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const event = events.find((item) => item.id === params.id);
    if (!event) return fail(404, "not_found", "Event not found.");
    const row = eventRow(event);
    return HttpResponse.json({
      id: row.id,
      title: row.title,
      club: row.club,
      college: row.college,
      type: row.type,
      mode: row.mode,
      startDate: row.startDate,
      endDate: row.endDate,
      place: event.place,
      registrationUrl: event.registrationUrl,
      posterUrl: null,
      funnel: {
        interested: event.interested,
        registerClicks: event.registerClicks,
        teams: event.teams,
        matches: event.matches,
      },
    });
  }),

  http.get("*/api/superadmin/events", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const url = new URL(request.url);
    const list = filterEvents(url).sort((a, b) => b.startDate.localeCompare(a.startDate));
    const page = paginate(list, url);
    return HttpResponse.json({ ...page, items: page.items.map(eventRow) });
  }),

  http.get("*/api/superadmin/reports/:id", async ({ params }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const report = reports.find((item) => item.id === params.id);
    if (!report) return fail(404, "not_found", "Report not found.");
    return HttpResponse.json(report);
  }),

  http.patch("*/api/superadmin/reports/:id", async ({ params, request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const report = reports.find((item) => item.id === params.id);
    if (!report) return fail(404, "not_found", "Report not found.");
    const body = (await request.json()) as { status?: string; note?: string };
    if (!body.status || !(REPORT_STATUSES as readonly string[]).includes(body.status))
      return fail(422, "validation_error", "Check the form.", { status: "Choose a status" });
    report.status = body.status as (typeof REPORT_STATUSES)[number];
    report.history.push({
      status: report.status,
      at: new Date().toISOString(),
      by: who.user.email,
      note: body.note || undefined,
    });
    log(who.user.email, "report_status_updated", `Report ${report.id} → ${report.status}`);
    return HttpResponse.json(report);
  }),

  http.get("*/api/superadmin/reports", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const list = reports
      .filter((report) => (!type || report.type === type) && (!status || report.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const page = paginate(list, url);
    return HttpResponse.json({ ...page, items: page.items.map(reportRow) });
  }),

  http.get("*/api/superadmin/clubs", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const url = new URL(request.url);
    const rows = clubs.map((club) => ({
      id: club.id,
      name: club.name,
      college: collegeById(club.collegeId)?.name ?? "",
      admin: club.admin,
      eventsCount: events.filter((event) => event.clubId === club.id).length,
    }));
    return HttpResponse.json(paginate(rows, url));
  }),

  http.post("*/api/superadmin/admins", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const parsed = addAdminFormSchema.safeParse(await request.json());
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
      return fail(422, "validation_error", "Check the form.", fields);
    }
    const { clubId, email } = parsed.data;
    const club = clubById(clubId);
    if (!club) return fail(404, "not_found", "Club not found.");
    // One admin per club.
    if (club.admin) return fail(409, "club_has_admin", "This club already has an admin.");
    const lower = email.toLowerCase();
    if (clubs.some((item) => item.admin?.email.toLowerCase() === lower))
      return fail(409, "email_already_admin", "That email is already an admin of another club.");
    club.admin = { id: nextId("adm"), email };
    if (!APPROVED_ADMINS.includes(lower)) APPROVED_ADMINS.push(lower);
    log(who.user.email, "admin_added", `${email} → ${club.name}`);
    return HttpResponse.json({ id: club.admin.id }, { status: 201 });
  }),

  http.delete("*/api/superadmin/admins/:id", async ({ params }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const club = clubs.find((item) => item.admin?.id === params.id);
    if (!club || !club.admin) return fail(404, "not_found", "That admin was not found.");
    const { email } = club.admin;
    // The club and all its events stay. Only the access goes.
    club.admin = null;
    const index = APPROVED_ADMINS.indexOf(email.toLowerCase());
    if (index >= 0) APPROVED_ADMINS.splice(index, 1);
    log(who.user.email, "admin_removed", `${email} from ${club.name}`);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/superadmin/colleges", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const url = new URL(request.url);
    const rows = colleges.map((college) => ({
      id: college.id,
      name: college.name,
      nameKey: college.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
      students: college.students,
      clubs: clubs.filter((club) => club.collegeId === college.id).length,
      createdAt: college.createdAt,
    }));
    return HttpResponse.json(paginate(rows, url));
  }),

  http.post("*/api/superadmin/colleges/merge", async ({ request }) => {
    await wait(400);
    const who = core();
    if ("error" in who) return who.error;
    const body = (await request.json()) as { keepId?: string; mergeIds?: string[] };
    const keep = body.keepId ? collegeById(body.keepId) : undefined;
    const mergeIds = (body.mergeIds ?? []).filter((id) => id !== body.keepId);
    if (!keep || mergeIds.length === 0)
      return fail(422, "validation_error", "Choose a college to keep and at least one to merge.");
    let studentsMoved = 0;
    let clubsMoved = 0;
    const names: string[] = [];
    for (const id of mergeIds) {
      const college = collegeById(id);
      if (!college) continue;
      studentsMoved += college.students;
      keep.students += college.students;
      for (const club of clubs) {
        if (club.collegeId === id) {
          club.collegeId = keep.id;
          clubsMoved += 1;
        }
      }
      names.push(college.name);
      colleges.splice(colleges.indexOf(college), 1);
    }
    log(who.user.email, "colleges_merged", `${names.join(", ")} → ${keep.name}`);
    return HttpResponse.json({ studentsMoved, clubsMoved });
  }),

  http.get("*/api/superadmin/audit", async ({ request }) => {
    await wait();
    const who = core();
    if ("error" in who) return who.error;
    const url = new URL(request.url);
    const actor = (url.searchParams.get("actor") ?? "").trim().toLowerCase();
    const action = url.searchParams.get("action");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const list = audit
      .filter(
        (entry) =>
          (!actor || entry.actor.toLowerCase().includes(actor)) &&
          (!action || ((AUDIT_ACTIONS as readonly string[]).includes(action) && entry.action === action)) &&
          (!from || entry.at.slice(0, 10) >= from) &&
          (!to || entry.at.slice(0, 10) <= to),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
    return HttpResponse.json(paginate(list, url));
  }),
];
