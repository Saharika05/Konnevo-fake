import { handlers } from "@/lib/mocks/handlers";
import { mockDb } from "@/lib/mocks/db";

const store: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
  },
};
(globalThis as any).FileReader = class {
  result: any;
  onload: any;
  readAsDataURL(f: File) {
    this.result = "data:x;base64,AAAA";
    setTimeout(() => this.onload?.(), 0);
  }
};
(globalThis as any).setTimeoutOrig = setTimeout;
// make waits instant
const realST = globalThis.setTimeout;
(globalThis as any).setTimeout = (fn: any, ms: any, ...a: any[]) => realST(fn, Math.min(ms ?? 0, 1), ...a);

let fails = 0;
async function call(method: string, path: string, body?: any, form?: FormData) {
  const url = "http://x" + path;
  for (const h of handlers as any[]) {
    if (h.method !== method) continue;
    const m = h.re.exec(url.replace("http://x", "http://x"));
    if (!m) continue;
    const init: any = { method };
    if (form) init.body = form;
    else if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers = { "content-type": "application/json" };
    }
    const request = new Request(url, init);
    const res: Response = await h.resolver({ request, params: m.groups ?? {} });
    const text = res.status === 204 ? "" : await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  }
  throw new Error("NO HANDLER " + method + " " + path);
}
function check(name: string, cond: boolean, extra?: any) {
  if (!cond) {
    fails++;
    console.log("FAIL", name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : "");
  } else console.log("ok  ", name);
}

(async () => {
  // visitor
  let r = await call("GET", "/api/events/home");
  check(
    "home events",
    r.status === 200 && r.json.events.length > 0 && r.json.events.every((e: any) => !e.expired),
    r.status,
  );
  r = await call("GET", "/api/events?limit=12");
  check("events list 12 + cursor", r.json.events.length === 12 && !!r.json.nextCursor, Object.keys(r.json));
  const page2 = await call("GET", "/api/events?limit=12&cursor=" + r.json.nextCursor);
  check("events page 2", page2.status === 200 && page2.json.events.length > 0);
  const events = (await call("GET", "/api/events?limit=50")).json.events;
  const ev = events[0];
  const evId = ev.id;
  check("event detail", (await call("GET", "/api/events/" + evId)).status === 200);
  check("people needs login", (await call("GET", `/api/events/${evId}/people`)).status === 401);
  check("teams needs login", (await call("GET", `/api/teams`)).status === 401);

  // login
  r = await call("POST", "/api/auth/login", {
    email: "student@konnevo.test",
    password: "password123",
    intent: "student",
  });
  check("student login", r.status === 200 && r.json.user.role === "student", r);
  check(
    "bad login",
    (
      await call("POST", "/api/auth/login", {
        email: "student@konnevo.test",
        password: "nope",
        intent: "student",
      })
    ).status === 401,
  );
  r = await call("GET", "/api/auth/me");
  check("me", r.json.user.name === "Priya");

  // profile
  r = await call("GET", "/api/profile/me");
  check("profile me", r.status === 200, r);
  r = await call("GET", "/api/profile/privacy");
  check("privacy default", r.json.privacy.showMeToOthers === true);

  // events: interested
  const target = events.find((e: any) => e.interestedCount >= 10) ?? ev;
  r = await call("POST", `/api/events/${target.id}/interested`);
  check("mark interested", r.status === 200 && r.json.event.interested === true, r);
  const c1 = r.json.event.interestedCount;
  r = await call("DELETE", `/api/events/${target.id}/interested`);
  check(
    "unmark interested",
    r.json.event.interested === false && r.json.event.interestedCount === c1 - 1,
    r.json.event,
  );
  await call("POST", `/api/events/${target.id}/interested`);

  // people
  r = await call("GET", `/api/events/${target.id}/people?limit=20`);
  check("people page", r.status === 200 && r.json.people.length > 0, r);
  const people = r.json.people;
  const total = r.json.total;
  r = await call("GET", `/api/events/${target.id}/suggested`);
  check("suggested 3", r.json.people.length === 3, r.json);
  check(
    "why you match names real skills, not a generic line",
    r.json.people.every((p: any) => p.whyMatch.length > 15) && r.json.people.some((p: any) => /You both|You bring|They bring|You are both|Your /.test(p.whyMatch)),
    r.json.people.map((p: any) => p.whyMatch),
  );
  r = await call("GET", `/api/events/${target.id}/people/${people[0].id}`);
  check("person detail", r.json.person && r.json.position === 1 && r.json.total === total, r.json);

  // swipes until a match
  let matched = 0;
  let matchedIds: string[] = [];
  for (const p of people) {
    r = await call("POST", "/api/swipes", { event_id: target.id, target_id: p.id, direction: "right" });
    if (r.json.matched) {
      matched++;
      matchedIds.push(p.id);
      if (matched === 1)
        check("match has person+github", !!r.json.match.person.name && !!r.json.match.github, r.json);
    }
  }
  check("some matches and some not", matched > 0 && matched < people.length, { matched, n: people.length });
  r = await call("POST", "/api/swipes", {
    event_id: target.id,
    target_id: people[0].id,
    direction: "sideways",
  });
  check("bad direction 422", r.status === 422);
  r = await call("POST", "/api/swipes", { event_id: target.id, target_id: "nobody", direction: "left" });
  check("unknown target 404", r.status === 404);

  // matches
  r = await call("GET", "/api/matches");
  check("matches list equals matched", r.json.matches.length === matched, {
    n: r.json.matches.length,
    matched,
  });
  // teams: seeded invite
  r = await call("GET", "/api/teams");
  check("seeded invite", r.json.invites.length === 1 && r.json.teams.length === 0, r.json);
  const inv = r.json.invites[0];
  r = await call("POST", `/api/teams/${inv.id}/respond`, { accept: true });
  check("accept invite", r.status === 200 && r.json.team.status === "registered", r);
  r = await call("GET", "/api/teams");
  check("team listed, invite gone", r.json.teams.length === 1 && r.json.invites.length === 0, r.json);
  const team = r.json.teams[0];
  // create team on event with matches
  const mid = matchedIds.slice(0, 2);
  const already = team.event.id === target.id;
  r = await call("POST", "/api/teams", {
    name: "Squad",
    event_id: target.id,
    my_role: "Frontend",
    member_ids: mid,
  });
  check(
    already ? "create team conflicts (already in team for that event)" : "create team",
    already ? r.status === 409 : r.status === 201,
    r,
  );
  r = await call("POST", "/api/teams", { name: "S", event_id: target.id, my_role: "", member_ids: [] });
  check(
    "create team validation",
    r.status === 422 && r.json.error.fields.name && r.json.error.fields.my_role,
    r.json,
  );
  r = await call("POST", "/api/teams", {
    name: "Squad",
    event_id: target.id,
    my_role: "Dev",
    member_ids: ["stranger"],
  });
  check("non-match rejected", r.status === 422 || r.status === 409, r);
  r = await call("PATCH", `/api/teams/${team.id}`, { name: "Renamed", my_role: "Lead" });
  check("edit team", r.json.team.name === "Renamed" && r.json.team.myRole === "Lead", r.json);

  // no proof upload any more
  r = await call("GET", "/api/teams");
  check("team has no proof fields", r.json.teams[0].proof === undefined && r.json.teams[0].attendanceId === undefined, r.json.teams[0]);
  check("team status stays registered", r.json.teams[0].status === "registered", r.json.teams[0].status);
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(10)], "cert.pdf", { type: "application/pdf" }));
  r = await call("POST", `/api/events/${team.event.id}/proof`, undefined, fd).catch(() => ({ status: 0 }));
  check("proof upload endpoint is gone", r.status !== 201, r.status);

  // remove match
  const mm = (await call("GET", "/api/matches")).json.matches[0];
  r = await call("DELETE", `/api/matches/${mm.id}`);
  check("remove match", r.status === 204);
  check("remove match again 404", (await call("DELETE", `/api/matches/${mm.id}`)).status === 404);

  // privacy toggles + matching off
  r = await call("PATCH", "/api/profile/privacy", { showMeToOthers: false });
  check("toggle off", r.json.privacy.showMeToOthers === false);
  r = await call("POST", "/api/swipes", { event_id: target.id, target_id: people[0].id, direction: "right" });
  check("swipe blocked when off", r.status === 403 && r.json.error.code === "matching_off", r);
  await call("PATCH", "/api/profile/privacy", { showMeToOthers: true });

  // projects + experience
  r = await call("GET", "/api/projects");
  check("projects", r.json.projects.length >= 1, r.json);
  {
    const dup = new FormData();
    dup.append("title", " campus cart ");
    dup.append("description", "Same project typed again with different spacing.");
    r = await call("POST", "/api/projects", undefined, dup);
    check("duplicate project title -> 409 on the title field", r.status === 409 && !!r.json.error.fields.title, r.json);
    const dupLink = new FormData();
    dupLink.append("title", "Something else");
    dupLink.append("description", "Different title but the same link as CampusCart.");
    dupLink.append("link", "https://github.com/priya-demo/campuscart/");
    r = await call("POST", "/api/projects", undefined, dupLink);
    check("duplicate project link -> 409 on the link field", r.status === 409 && !!r.json.error.fields.link, r.json);
  }
  r = await call("GET", "/api/colleges/suggest?q=");
  check("college dropdown: empty q lists colleges", r.status === 200 && r.json.colleges.length >= 8, r.json);
  r = await call("GET", "/api/colleges/suggest?q=anna");
  check("college search narrows", r.json.colleges.length === 1 && /Anna/.test(r.json.colleges[0]), r.json);
  r = await call("PATCH", "/api/profile/me", { portfolio: "https://priya.dev", discord: "priya_dev", whatsapp: "+91 98765 43210" });
  check("portfolio, discord, whatsapp are saved", r.json.profile.portfolio === "https://priya.dev" && r.json.profile.discord === "priya_dev", r.json);
  r = await call("GET", "/api/experience");
  check("experience", r.status === 200, r.json);

  // settings
  r = await call("POST", "/api/auth/password/change", { current_password: "wrong", password: "newpass123" });
  check("change pw wrong current 422", r.status === 422 && r.json.error.fields.current_password, r.json);
  r = await call("POST", "/api/auth/password/change", {
    current_password: "password123",
    password: "newpass123",
  });
  check("change pw ok", r.status === 204);
  r = await call("GET", "/api/blocks");
  check("blocks seeded", r.json.blocked.length === 1, r.json);
  r = await call("DELETE", `/api/blocks/${r.json.blocked[0].id}`);
  check("unblock", r.status === 204);
  r = await call("GET", "/api/blocks");
  check("blocks empty stays empty", r.json.blocked.length === 0, r.json);
  r = await call("DELETE", "/api/account", { confirm: "nope" });
  check("delete needs DELETE", r.status === 422);
  r = await call("DELETE", "/api/account", { confirm: "DELETE" });
  check("delete account", r.status === 204);
  r = await call("GET", "/api/auth/me");
  check("logged out after delete", r.status === 401);
  r = await call("POST", "/api/auth/login", {
    email: "student@konnevo.test",
    password: "newpass123",
    intent: "student",
  });
  check("deleted user cannot login", r.status === 401);

  // oauth new student
  r = await call("POST", "/api/auth/google", { intent: "student", callback_url: "http://x/auth/callback" });
  console.log("oauth", r.status, JSON.stringify(r.json).slice(0, 150));
  // admin
  r = await call("POST", "/api/auth/login", {
    email: "admin@techclub.test",
    password: "password123",
    intent: "admin",
  });
  check("admin login", r.status === 200);
  r = await call("GET", `/api/events/${target.id}/people`);
  check("admin cannot list people 403", r.status === 403);

  // ---- Step 9: club admin ----
  r = await call("GET", "/api/admin/overview");
  check(
    "admin overview",
    r.status === 200 &&
      r.json.clubName === "Tech Club" &&
      r.json.events.length >= 2 &&
      r.json.reports.length === 2,
    r.json && Object.keys(r.json),
  );
  check("admin has no proofs stat", r.json.stats.proofsWaiting === undefined, r.json.stats);
  const clubEvent = r.json.events[0];
  check("admin proofs list is gone", (await call("GET", "/api/admin/proofs").catch(() => ({ status: 0 }))).status !== 200);
  r = await call("GET", "/api/proofs/x:y/url").catch(() => ({ status: 0 }));
  check("proof link endpoint is gone", r.status !== 200, r.status);
  r = await call("PATCH", "/api/admin/reports/report-1");
  check("resolve report", r.status === 204);
  r = await call("GET", "/api/admin/overview");
  check(
    "report resolved",
    r.json.reports[0].status === "resolved",
    r.json.stats,
  );

  const ef = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.append(k, v);
    return f;
  };
  const good = {
    title: "Robo Rumble",
    type: "meetup",
    mode: "offline",
    start_date: "2027-01-10",
    end_date: "2027-01-11",
    place: "Main Hall",
    registration_url: "https://example.com/r",
    description: "Build and battle robots all day.",
  };
  r = await call(
    "POST",
    "/api/admin/events",
    undefined,
    ef({ ...good, title: "R", registration_url: "nope", end_date: "2026-01-01" }),
  );
  check(
    "create event validation",
    r.status === 422 &&
      r.json.error.fields.title &&
      r.json.error.fields.registration_url &&
      r.json.error.fields.end_date,
    r.json,
  );
  r = await call("POST", "/api/admin/events", undefined, ef(good));
  check(
    "publish event (201, instant)",
    r.status === 201 && r.json.event.clubName === "Tech Club" && r.json.event.expired === false,
    r.json,
  );
  const newId = r.json.event.id;
  r = await call("GET", "/api/events/" + newId);
  check("new event is public at once", r.status === 200 && r.json.event.title === "Robo Rumble");
  r = await call("GET", "/api/events?q=robo&limit=12");
  check(
    "new event in list search",
    r.json.events.some((e: any) => e.id === newId),
  );
  r = await call(
    "PATCH",
    "/api/admin/events/" + newId,
    undefined,
    ef({ ...good, title: "Robo Rumble 2", end_date: "" }),
  );
  check(
    "edit own event",
    r.status === 200 && r.json.event.title === "Robo Rumble 2" && !r.json.event.endDate,
    r.json,
  );
  const other = (await call("GET", "/api/events?limit=50")).json.events.find(
    (e: any) => e.clubName !== "Tech Club",
  );
  r = await call("PATCH", "/api/admin/events/" + other.id, undefined, ef(good));
  check("cannot edit other club 403", r.status === 403);
  r = await call("DELETE", "/api/admin/events/" + other.id);
  check("cannot delete other club 403", r.status === 403);
  r = await call(
    "PATCH",
    "/api/admin/events/" + clubEvent.id,
    undefined,
    ef({ ...good, title: "HackFest Renamed" }),
  );
  check("edit built-in own event", r.status === 200);
  r = await call("GET", "/api/events/" + clubEvent.id);
  check("edit shows publicly", r.json.event.title === "HackFest Renamed", r.json);
  r = await call("DELETE", "/api/admin/events/" + newId);
  check("delete own event", r.status === 204);
  check("deleted event 404", (await call("GET", "/api/events/" + newId)).status === 404);
  r = await call("DELETE", "/api/admin/events/" + clubEvent.id);
  check("delete built-in own", r.status === 204);
  check("built-in gone", (await call("GET", "/api/events/" + clubEvent.id)).status === 404);
  // a student cannot use admin endpoints
  await call("POST", "/api/auth/logout");
  check("visitor admin 401", (await call("GET", "/api/admin/overview")).status === 401);
  r = await call("POST", "/api/auth/login", {
    email: "admin@techclub.test",
    password: "password123",
    intent: "admin",
  });

  console.log(fails === 0 ? "ALL PASSED" : fails + " FAILED");
})().catch((e) => {
  console.error("CRASH", e);
  process.exit(1);
});
