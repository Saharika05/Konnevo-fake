import { http, HttpResponse } from "msw";
import { mockEvents as builtInEvents } from "@/data/mock-events";
import { mockPeople, type MockPerson } from "@/data/mock-people";
import skillCatalog from "@/data/skills.json";
import type {
  AdminReport,
  EventItem,
  EventMode,
  EventType,
  ExperienceInput,
  PersonCard,
  Privacy,
  Profile,
  ProfileUpdate,
  SkillSelection,
  SuggestedPerson,
  PersonProfile,
  SwipeDirection,
  Team,
  TeamEventRef,
  TeamInvite,
} from "@/lib/api/types";
import { APPROVED_ADMINS, MOCK_COLLEGES, mockDb, type MockTeam } from "@/lib/mocks/db";
import { validateImage } from "@/lib/schemas/files";
import { duplicateMessage, findDuplicateProject, projectKey } from "@/lib/projects";
import { superadminHandlers } from "@/lib/mocks/superadmin/handlers";

/**
 * The fake API. Every endpoint the screens use is answered here, in the same
 * shapes the real API uses. When NEXT_PUBLIC_API_URL is set these are not loaded.
 */

function fail(status: number, code: string, message: string, fields: Record<string, string> = {}) {
  return HttpResponse.json({ error: { code, message, fields } }, { status });
}

/** Photos and project images are kept as data URLs so they survive a refresh. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** The logged-in student, or an error response to return straight away. */
function student() {
  const user = mockDb.currentUser();
  if (!user) return { error: fail(401, "unauthenticated", "You are not logged in.") } as const;
  if (user.role !== "student")
    return { error: fail(403, "forbidden", "Only students can do that.") } as const;
  return { user } as const;
}

function profileFor(userId: string, name: string): Profile {
  const { privacy: _privacy, projects: _projects, ...rest } = mockDb.profileOf(userId);
  void _privacy;
  void _projects;
  return { id: userId, name, ...rest };
}

/** An event as the current person sees it: the interest count includes them, and `interested` is set for students. */
function viewEvent(event: EventItem): EventItem {
  const me = mockDb.currentUser();
  if (!me || me.role !== "student") return event;
  const interested = mockDb.interestedIds(me.id).includes(event.id);
  return { ...event, interested, interestedCount: event.interestedCount + (interested ? 1 : 0) };
}

/** Built-in events with the admin's deletions and edits applied, plus the events admins created. */
function allEvents(): EventItem[] {
  const { custom, edits, deleted } = mockDb.eventChanges();
  const today = new Date().toISOString().slice(0, 10);
  return [...builtInEvents.filter((item) => !deleted.includes(item.id)), ...custom].map((item) => {
    const merged = { ...item, ...(edits[item.id] ?? {}) };
    // Past or not is worked out from the dates, so an edited date moves the event in or out of "upcoming".
    return { ...merged, expired: (merged.endDate ?? merged.startDate) < today };
  });
}

/** The logged-in club admin, or an error response to return straight away. */
function admin() {
  const user = mockDb.currentUser();
  if (!user) return { error: fail(401, "unauthenticated", "You are not logged in.") } as const;
  if (user.role !== "club_admin")
    return { error: fail(403, "forbidden", "Only club admins can do that.") } as const;
  return { user, club: user.clubName ?? "" } as const;
}

/** Reads and checks the add or edit event form. Returns the values, or the field errors. */
async function readEventForm(request: Request) {
  const form = await request.formData();
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const fields: Record<string, string> = {};
  const title = text("title");
  const type = text("type") as EventType;
  const mode = text("mode") as EventMode;
  const startDate = text("start_date");
  const endDate = text("end_date");
  const place = text("place");
  const registrationUrl = text("registration_url");
  const description = text("description");
  if (title.length < 2 || title.length > 100) fields.title = "Use 2 to 100 characters";
  if (!["hackathon", "meetup", "conference", "workshop"].includes(type)) fields.type = "Pick a type";
  if (!["online", "offline"].includes(mode)) fields.mode = "Pick online or offline";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) fields.start_date = "Pick a date";
  if (endDate && endDate < startDate) fields.end_date = "The end date cannot be before the start date";
  if (place.length < 2) fields.place = "Enter the venue or the link";
  if (!/^https?:\/\//.test(registrationUrl))
    fields.registration_url = "Enter a full link starting with https://";
  if (description.length < 10 || description.length > 2000) fields.description = "Use 10 to 2000 characters";
  const poster = form.get("poster");
  let posterUrl: string | undefined;
  if (poster instanceof File && poster.size > 0) {
    const problem = validateImage(poster);
    if (problem) fields.poster = problem;
    else posterUrl = await fileToDataUrl(poster);
  }
  if (Object.keys(fields).length > 0) return { fields } as const;
  return {
    values: {
      title,
      type,
      mode,
      startDate,
      endDate: endDate || undefined,
      place,
      registrationUrl,
      description,
    },
    posterUrl,
  } as const;
}

/** Two demo reports, added the first time a club admin looks. */
function seedAdmin() {
  if (mockDb.adminSeeded()) return;
  const now = new Date().toISOString();
  mockDb.seedAdmin([
    {
      id: "report-1",
      reason: "This project is not the person's own work.",
      subject: "Project: PlantPal",
      createdAt: now,
      status: "open",
    },
    {
      id: "report-2",
      reason: "The link in this project goes to something unrelated.",
      subject: "Project: MessMenu",
      createdAt: now,
      status: "open",
    },
  ]);
}

function peopleFor(eventId: string): MockPerson[] {
  const event = allEvents().find((item) => item.id === eventId);
  if (!event) return [];
  const offset = [...eventId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % mockPeople.length;
  const rotated = [...mockPeople.slice(offset), ...mockPeople.slice(0, offset)];
  return rotated.slice(0, Math.min(event.interestedCount, mockPeople.length));
}

function toCard(person: MockPerson): PersonCard {
  return { id: person.id, name: person.name, college: person.college, topSkills: person.skills.slice(0, 2) };
}

/** The catalogue group of each skill (from skills.json). */
const SKILL_GROUP = new Map<string, string>(
  skillCatalog.skills.flatMap((group) => group.items.map((item) => [item.toLowerCase(), group.group] as const)),
);

/**
 * "Web development" mixes screens and servers, so those skills are split into the two areas people
 * actually team up across. This is general knowledge about the technologies, not about any person.
 */
const AREA_OVERRIDE: Record<string, string> = {
  "html/css": "frontend",
  react: "frontend",
  "next.js": "frontend",
  angular: "frontend",
  vue: "frontend",
  figma: "design",
  "ui/ux": "design",
  "node.js": "backend",
  express: "backend",
  django: "backend",
  flask: "backend",
  fastapi: "backend",
  "rest apis": "backend",
};
/** Languages and general tools are shared by everyone, so they never count as a different strength. */
const GENERAL_GROUPS = new Set(["Programming languages", "Cloud and tools", "Other tech"]);

function areaOf(skill: string): string | undefined {
  const key = skill.toLowerCase();
  const override = AREA_OVERRIDE[key];
  if (override) return override;
  const group = SKILL_GROUP.get(key);
  if (!group || GENERAL_GROUPS.has(group)) return undefined;
  return group.toLowerCase();
}

/** Skills grouped by area, biggest group first. */
function byArea(skills: string[]): { area: string; skills: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const skill of skills) {
    const area = areaOf(skill);
    if (area) groups.set(area, [...(groups.get(area) ?? []), skill]);
  }
  return [...groups].map(([area, list]) => ({ area, skills: list })).sort((x, y) => y.skills.length - x.skills.length);
}

function joinNames(names: string[]) {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The one project each mock person has. The same one is shown on their profile and used in the reason. */
function projectOf(person: MockPerson) {
  const [title, description] = PROJECT_IDEAS[Math.max(0, mockPeople.indexOf(person)) % PROJECT_IDEAS.length];
  return { title, description, techTags: person.skills.slice(0, 2) };
}

/**
 * Why two people match. Every sentence is built from facts that are really on the two profiles
 * and projects: skills grouped by area, the technologies in a project, shared interests, the same college.
 * Nothing is invented. When there is nothing to compare, it says so instead of guessing.
 */
function whyMatch(
  person: MockPerson,
  mine: ReturnType<typeof mockDb.profileOf>,
): { text: string; score: number } {
  const first = person.name.split(" ")[0];
  const mySkills = [...mine.skills, ...mine.customSkills];
  const myKeys = new Set(mySkills.map((item) => item.toLowerCase()));
  const myAreas = byArea(mySkills);
  const theirAreas = byArea(person.skills);

  const shared = person.skills.filter((item) => myKeys.has(item.toLowerCase()));
  const interests = person.interests.filter((item) => mine.interests.includes(item));
  const sameCollege = !!mine.college && mine.college.toLowerCase() === person.college.toLowerCase();
  const project = projectOf(person);
  const projectShared = project.techTags.filter((tag) => myKeys.has(tag.toLowerCase()));

  const sentences: { text: string; score: number }[] = [];

  // A strength of theirs in an area none of your skills touch, set against your strongest area.
  const theirs = theirAreas.find((group) => !myAreas.some((own) => own.area === group.area));
  const yours = theirs ? myAreas.find((group) => group.area !== theirs.area) : undefined;
  if (theirs && yours) {
    sentences.push({
      text: `${first} works with ${joinNames(theirs.skills.slice(0, 3))} (${theirs.area}), while you bring ${joinNames(yours.skills.slice(0, 3))} (${yours.area}), so together you could cover both ${yours.area} and ${theirs.area}.`,
      score: 3 * Math.min(theirs.skills.length, 3) + 2,
    });
  } else if (theirs && myAreas.length === 0 && mySkills.length === 0) {
    // You have not added skills yet: only say what they have.
    sentences.push({ text: `${first} works with ${joinNames(theirs.skills.slice(0, 3))} (${theirs.area}).`, score: 2 });
  }

  if (shared.length > 0) {
    sentences.push({ text: `You both know ${joinNames(shared.slice(0, 3))}.`, score: 5 * shared.length });
  }

  if (projectShared.length > 0) {
    sentences.push({
      text: `Their project “${project.title}” uses ${joinNames(project.techTags)}, and ${joinNames(projectShared)} ${projectShared.length === 1 ? "is" : "are"} on your profile too.`,
      score: 3,
    });
  } else if (sentences.length > 0) {
    sentences.push({
      text: `They built “${project.title}” with ${joinNames(project.techTags)}.`,
      score: 1,
    });
  }

  if (interests.length > 0) {
    sentences.push({
      text: `You are both interested in ${joinNames(interests.slice(0, 2))}.`,
      score: 2 * interests.length,
    });
  }
  if (sameCollege) sentences.push({ text: "You study at the same college.", score: 2 });

  if (sentences.length === 0) {
    return { text: "There is not enough profile information yet to say how you would work together.", score: 0 };
  }
  // Best reasons first, at most three, so the card stays readable.
  const top = [...sentences].sort((x, y) => y.score - x.score).slice(0, 3);
  return { text: top.map((item) => item.text).join(" "), score: top.reduce((sum, item) => sum + item.score, 0) };
}

const PROJECT_IDEAS = [
  ["CampusCart", "A marketplace where students sell used books and gadgets on campus."],
  ["StudyBuddy", "A bot that quizzes you on your lecture notes."],
  ["EventRadar", "Finds hackathons near you and reminds you before they start."],
  ["PlantPal", "Tracks your plants and tells you when to water them."],
  ["MessMenu", "Shows the hostel mess menu and lets students rate each meal."],
  ["BugBounty Lite", "A tiny platform for students to report and fix bugs in open source."],
];

function toProfile(person: MockPerson, index: number): PersonProfile {
  const { title, description, techTags } = projectOf(person);
  return {
    id: person.id,
    name: person.name,
    college: person.college,
    year: ["1st", "2nd", "3rd", "4th"][index % 4],
    bio: `${person.skills[0]} person who loves ${person.interests[0].toLowerCase()} and building with friends.`,
    lookingFor: index % 3 === 0 ? ["teammate"] : index % 3 === 1 ? ["teammate", "learning"] : ["networking"],
    skills: person.skills,
    interests: person.interests,
    projects: [
      {
        id: `${person.id}-p1`,
        title,
        description,
        techTags,
        link:
          index % 2 === 0
            ? `https://github.com/example/${title.toLowerCase().replace(/\W+/g, "-")}`
            : undefined,
      },
    ],
  };
}

/** In the mock, about half of the people have already swiped right on you. */
function likesYou(personId: string): boolean {
  return [...personId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2 === 0;
}

/** Links on a match. GitHub is always there, LinkedIn only for some, so both cases can be seen. */
function matchLinks(person: MockPerson) {
  const slug = person.name.toLowerCase().replace(/\W+/g, "-");
  const index = mockPeople.findIndex((item) => item.id === person.id);
  return {
    github: `https://github.com/${slug}`,
    linkedin: index % 2 === 0 ? `https://linkedin.com/in/${slug}` : undefined,
  };
}

function eventRef(eventId: string): TeamEventRef {
  const event = allEvents().find((item) => item.id === eventId);
  return {
    id: eventId,
    title: event?.title ?? "Event",
    startDate: event?.startDate ?? "",
    endDate: event?.endDate,
  };
}

/** The team as the logged-in student sees it. The status comes from the API, never from the screen. */
function viewTeam(team: MockTeam, userId: string): Team {
  const mine = team.members.find((item) => item.userId === userId);
  return {
    id: team.id,
    name: team.name,
    event: eventRef(team.eventId),
    myRole: mine?.role ?? "",
    // In the mock, people who liked you accept the invite as soon as you look again.
    members: team.members.map((item) => ({
      id: item.userId,
      name: item.name,
      role: item.role,
      accepted: item.accepted || (item.userId !== userId && likesYou(item.userId)),
    })),
    // There is no attendance proof or club check, so the mock only ever says "registered".
    status: "registered",
  };
}

/** The first time a student opens My Teams, one invite is waiting so Accept and Decline can be tried. */
function seedInvite(userId: string, userName: string) {
  if (mockDb.invitesSeeded(userId)) return;
  mockDb.markInvitesSeeded(userId);
  // The last suitable event, so it is not the one you are most likely to explore and match on first.
  // (Accepting puts you in a team for that event, and a person can only be in one team per event.)
  const event = [...allEvents()].reverse().find((item) => !item.expired && peopleFor(item.id).length >= 3);
  if (!event) return;
  const owner = peopleFor(event.id)[0];
  mockDb.teamList().push({
    id: crypto.randomUUID(),
    name: "Byte Benders",
    eventId: event.id,
    members: [
      { userId: owner.id, name: owner.name, role: "Backend", accepted: true },
      {
        userId,
        name: userName,
        role: "Frontend",
        accepted: false,
        invitedById: owner.id,
        invitedByName: owner.name,
      },
    ],
  });
  mockDb.commit();
}

/** The person already has an accepted team for this event. */
function inTeamFor(userId: string, eventId: string): boolean {
  return mockDb
    .teamList()
    .some((item) => item.eventId === eventId && item.members.some((m) => m.userId === userId && m.accepted));
}

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export const handlers = [
  // ---- Events ----
  http.get("*/api/events/home", async () => {
    await wait();
    return HttpResponse.json({
      events: allEvents()
        .filter((event) => !event.expired)
        .slice(0, 6),
    });
  }),

  http.get("*/api/events", async ({ request }) => {
    await wait();
    const params = new URL(request.url).searchParams;
    const q = (params.get("q") ?? "").trim().toLowerCase();
    const types = params.getAll("type");
    const mode = params.get("mode");
    const from = params.get("date_from");
    const to = params.get("date_to");
    const limit = Math.min(Number(params.get("limit")) || 12, 50);
    const offset = Number(params.get("cursor")) || 0;

    const matching = allEvents()
      .filter((item) => !item.expired)
      .filter((item) => !q || `${item.title} ${item.clubName} ${item.description}`.toLowerCase().includes(q))
      .filter((item) => types.length === 0 || types.includes(item.type))
      .filter((item) => !mode || item.mode === mode)
      .filter((item) => !from || (item.endDate ?? item.startDate) >= from)
      .filter((item) => !to || item.startDate <= to)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const page = matching.slice(offset, offset + limit);
    const nextCursor = offset + limit < matching.length ? String(offset + limit) : null;
    return HttpResponse.json({ events: page.map(viewEvent), nextCursor });
  }),

  http.get("*/api/events/:id", async ({ params }) => {
    await wait();
    const found = allEvents().find((item) => item.id === params.id);
    if (!found) return fail(404, "not_found", "That event does not exist.");
    return HttpResponse.json({ event: viewEvent(found) });
  }),

  http.post("*/api/events/:id/interested", async ({ params }) => {
    await wait(250);
    const who = student();
    if ("error" in who) return who.error;
    const found = allEvents().find((item) => item.id === params.id);
    if (!found) return fail(404, "not_found", "That event does not exist.");
    if (found.expired) return fail(409, "event_expired", "That event has already happened.");
    mockDb.setInterested(who.user.id, found.id, true);
    return HttpResponse.json({ event: viewEvent(found) });
  }),

  http.delete("*/api/events/:id/interested", async ({ params }) => {
    await wait(250);
    const who = student();
    if ("error" in who) return who.error;
    const found = allEvents().find((item) => item.id === params.id);
    if (!found) return fail(404, "not_found", "That event does not exist.");
    mockDb.setInterested(who.user.id, found.id, false);
    return HttpResponse.json({ event: viewEvent(found) });
  }),

  http.post("*/api/events/:id/register-click", async ({ params }) => {
    const who = student();
    if ("error" in who) return who.error;
    if (!allEvents().some((item) => item.id === params.id)) return fail(404, "not_found", "That event does not exist.");
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/events/:id/people", async ({ params, request }) => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    if (!allEvents().some((item) => item.id === params.id))
      return fail(404, "not_found", "That event does not exist.");
    const search = new URL(request.url).searchParams;
    const limit = Math.min(Number(search.get("limit")) || 20, 50);
    const offset = Number(search.get("cursor")) || 0;
    const all = peopleFor(String(params.id));
    const nextCursor = offset + limit < all.length ? String(offset + limit) : null;
    return HttpResponse.json({
      people: all.slice(offset, offset + limit).map(toCard),
      nextCursor,
      total: all.length,
    });
  }),

  http.get("*/api/events/:id/suggested", async ({ params }) => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    if (!allEvents().some((item) => item.id === params.id))
      return fail(404, "not_found", "That event does not exist.");
    const all = peopleFor(String(params.id));
    if (all.length < 3) return HttpResponse.json({ people: [], lowCandidates: true });
    const mine = mockDb.profileOf(who.user.id);
    const ranked: SuggestedPerson[] = all
      .map((person) => ({ person, match: whyMatch(person, mine) }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 3)
      .map(({ person, match }) => ({ ...toCard(person), whyMatch: match.text }));
    return HttpResponse.json({ people: ranked, lowCandidates: false });
  }),

  http.get("*/api/events/:id/people/:userId", async ({ params }) => {
    await wait(300);
    const who = student();
    if ("error" in who) return who.error;
    const eventId = String(params.id);
    if (!allEvents().some((item) => item.id === eventId))
      return fail(404, "not_found", "That event does not exist.");
    const all = peopleFor(eventId);
    if (all.length < 3) return HttpResponse.json({ lowCandidates: true });

    const index = all.findIndex((item) => item.id === params.userId);
    if (index === -1) return fail(404, "not_found", "That person is not on this event.");

    const swipes = mockDb.swipesFor(who.user.id, eventId);
    const after = all.slice(index + 1).find((item) => !swipes[item.id]);
    const next = after ?? all.slice(0, index).find((item) => !swipes[item.id]);
    const mine = mockDb.profileOf(who.user.id);
    return HttpResponse.json({
      lowCandidates: false,
      person: toProfile(all[index], index),
      whyMatch: whyMatch(all[index], mine).text,
      position: index + 1,
      total: all.length,
      nextUserId: next?.id ?? null,
      swiped: swipes[all[index].id] ?? null,
    });
  }),

  http.post("*/api/swipes", async ({ request }) => {
    await wait(350);
    const who = student();
    if ("error" in who) return who.error;
    const body = (await request.json()) as {
      event_id?: string;
      target_id?: string;
      direction?: SwipeDirection;
    };
    const event = allEvents().find((item) => item.id === body.event_id);
    if (!event) return fail(404, "not_found", "That event does not exist.");
    if (event.expired) return fail(409, "event_expired", "That event has already happened.");
    if (body.direction !== "left" && body.direction !== "right") {
      return fail(422, "validation_error", "Check the request.", { direction: "Use left or right" });
    }
    const all = peopleFor(event.id);
    const index = all.findIndex((item) => item.id === body.target_id);
    if (index === -1) return fail(404, "not_found", "That person is not on this event.");
    if (!mockDb.profileOf(who.user.id).privacy.showMeToOthers) {
      return fail(403, "matching_off", "Turn on 'Show me to others for matching' to swipe.");
    }

    mockDb.recordSwipe(who.user.id, event.id, all[index].id, body.direction);
    if (body.direction === "right" && likesYou(all[index].id)) {
      const person = all[index];
      const matchId = mockDb.addMatch(who.user.id, event.id, person.id);
      return HttpResponse.json({
        matched: true,
        match: {
          id: matchId,
          person: { id: person.id, name: person.name },
          ...matchLinks(person),
        },
      });
    }
    return HttpResponse.json({ matched: false });
  }),

  // ---- Matches and teams (Step 7) ----
  http.get("*/api/matches", async () => {
    await wait(250);
    const who = student();
    if ("error" in who) return who.error;
    const matches = mockDb.matchesFor(who.user.id).flatMap((item) => {
      const person = mockPeople.find((candidate) => candidate.id === item.personId);
      if (!person) return [];
      return [
        {
          id: item.id,
          event: { id: item.eventId, title: eventRef(item.eventId).title },
          person: { id: person.id, name: person.name },
          ...matchLinks(person),
        },
      ];
    });
    return HttpResponse.json({ matches });
  }),

  http.delete("*/api/matches/:id", async ({ params }) => {
    await wait(250);
    const who = student();
    if ("error" in who) return who.error;
    if (!mockDb.removeMatch(who.user.id, String(params.id)))
      return fail(404, "not_found", "That match does not exist.");
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/teams", async () => {
    await wait(300);
    const who = student();
    if ("error" in who) return who.error;
    seedInvite(who.user.id, who.user.name);
    const mine = mockDb.teamList().filter((team) => team.members.some((m) => m.userId === who.user.id));
    const teams: Team[] = [];
    const invites: TeamInvite[] = [];
    for (const team of mine) {
      const me = team.members.find((m) => m.userId === who.user.id)!;
      if (me.accepted) teams.push(viewTeam(team, who.user.id));
      else
        invites.push({
          id: team.id,
          teamName: team.name,
          event: eventRef(team.eventId),
          invitedBy: { id: me.invitedById ?? "", name: me.invitedByName ?? "Someone" },
          role: me.role,
        });
    }
    return HttpResponse.json({ teams, invites });
  }),

  http.post("*/api/teams", async ({ request }) => {
    await wait(450);
    const who = student();
    if ("error" in who) return who.error;
    const body = (await request.json()) as {
      name?: string;
      event_id?: string;
      my_role?: string;
      member_ids?: string[];
    };
    const name = (body.name ?? "").trim();
    const role = (body.my_role ?? "").trim();
    const memberIds = body.member_ids ?? [];
    const fields: Record<string, string> = {};
    if (name.length < 2) fields.name = "Give your team a name";
    if (role.length < 2) fields.my_role = "Say what you will do";
    if (Object.keys(fields).length > 0)
      return fail(422, "validation_error", "Check the highlighted fields.", fields);

    const event = allEvents().find((item) => item.id === body.event_id);
    if (!event) return fail(404, "not_found", "That event does not exist.");
    if (event.expired) return fail(409, "event_expired", "That event has already happened.");
    if (inTeamFor(who.user.id, event.id))
      return fail(409, "already_in_team", "You are already in a team for this event.");
    if (memberIds.length + 1 > 6)
      return fail(422, "team_full", "A team can have at most 6 people.", {
        member_ids: "Choose up to 5 people",
      });

    const matchedIds = mockDb
      .matchesFor(who.user.id)
      .filter((item) => item.eventId === event.id)
      .map((item) => item.personId);
    if (memberIds.some((id) => !matchedIds.includes(id)))
      return fail(422, "not_a_match", "You can only invite people you matched with.", {
        member_ids: "Pick from your matches",
      });

    const team: MockTeam = {
      id: crypto.randomUUID(),
      name,
      eventId: event.id,
      members: [
        { userId: who.user.id, name: who.user.name, role, accepted: true },
        ...memberIds.map((id) => ({
          userId: id,
          name: mockPeople.find((person) => person.id === id)?.name ?? "Student",
          role: "Teammate",
          accepted: false,
          invitedById: who.user.id,
          invitedByName: who.user.name,
        })),
      ],
    };
    mockDb.teamList().push(team);
    mockDb.commit();
    return HttpResponse.json({ team: viewTeam(team, who.user.id) }, { status: 201 });
  }),

  http.patch("*/api/teams/:id", async ({ params, request }) => {
    await wait(300);
    const who = student();
    if ("error" in who) return who.error;
    const team = mockDb.teamList().find((item) => item.id === params.id);
    const me = team?.members.find((m) => m.userId === who.user.id && m.accepted);
    if (!team || !me) return fail(404, "not_found", "We could not find that team.");
    const body = (await request.json()) as { name?: string; my_role?: string };
    const fields: Record<string, string> = {};
    if (body.name !== undefined && body.name.trim().length < 2) fields.name = "Give your team a name";
    if (body.my_role !== undefined && body.my_role.trim().length < 2) fields.my_role = "Say what you will do";
    if (Object.keys(fields).length > 0)
      return fail(422, "validation_error", "Check the highlighted fields.", fields);
    if (body.name !== undefined) team.name = body.name.trim();
    if (body.my_role !== undefined) me.role = body.my_role.trim();
    mockDb.commit();
    return HttpResponse.json({ team: viewTeam(team, who.user.id) });
  }),

  http.post("*/api/teams/:id/respond", async ({ params, request }) => {
    await wait(350);
    const who = student();
    if ("error" in who) return who.error;
    const team = mockDb.teamList().find((item) => item.id === params.id);
    const me = team?.members.find((m) => m.userId === who.user.id && !m.accepted);
    if (!team || !me) return fail(404, "not_found", "That invite is no longer there.");
    const body = (await request.json()) as { accept?: boolean };
    if (body.accept) {
      if (inTeamFor(who.user.id, team.eventId))
        return fail(409, "already_in_team", "You are already in a team for this event.");
      me.accepted = true;
      mockDb.commit();
      return HttpResponse.json({ team: viewTeam(team, who.user.id) });
    }
    team.members = team.members.filter((m) => m !== me);
    mockDb.commit();
    return HttpResponse.json({});
  }),

  // ---- Club admin (Step 9) ----
  http.get("*/api/admin/overview", async () => {
    await wait(300);
    const who = admin();
    if ("error" in who) return who.error;
    seedAdmin();
    const events = allEvents()
      .filter((item) => item.clubName === who.club)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const reports: AdminReport[] = mockDb.reportList();
    return HttpResponse.json({
      clubName: who.club,
      stats: {
        events: events.length,
        upcoming: events.filter((item) => !item.expired).length,
        interested: events.reduce((sum, item) => sum + item.interestedCount, 0),
      },
      events,
      reports,
    });
  }),

  http.patch("*/api/admin/reports/:id", async ({ params }) => {
    await wait(250);
    const who = admin();
    if ("error" in who) return who.error;
    const report = mockDb.reportList().find((item) => item.id === params.id);
    if (!report) return fail(404, "not_found", "That report does not exist.");
    report.status = "resolved";
    mockDb.commit();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/admin/events", async ({ request }) => {
    await wait(600);
    const who = admin();
    if ("error" in who) return who.error;
    const read = await readEventForm(request);
    if ("fields" in read) return fail(422, "validation_error", "Check the highlighted fields.", read.fields);
    const slug = read.values.title.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "");
    const event: EventItem = {
      id: `${slug}-${crypto.randomUUID().slice(0, 6)}`,
      ...read.values,
      posterUrl: read.posterUrl,
      clubName: who.club,
      interestedCount: 0,
      expired: false,
    };
    // Published at once. There is no approval step.
    mockDb.addEvent(event);
    return HttpResponse.json({ event }, { status: 201 });
  }),

  http.patch("*/api/admin/events/:id", async ({ params, request }) => {
    await wait(500);
    const who = admin();
    if ("error" in who) return who.error;
    const found = allEvents().find((item) => item.id === params.id);
    if (!found) return fail(404, "not_found", "That event does not exist.");
    if (found.clubName !== who.club)
      return fail(403, "forbidden", "You can only edit your own club's events.");
    const read = await readEventForm(request);
    if ("fields" in read) return fail(422, "validation_error", "Check the highlighted fields.", read.fields);
    mockDb.patchEvent(found.id, {
      ...read.values,
      // An empty string, not undefined, so clearing the end date survives a refresh.
      endDate: read.values.endDate ?? "",
      ...(read.posterUrl ? { posterUrl: read.posterUrl } : {}),
    });
    return HttpResponse.json({ event: allEvents().find((item) => item.id === found.id) });
  }),

  http.delete("*/api/admin/events/:id", async ({ params }) => {
    await wait(400);
    const who = admin();
    if ("error" in who) return who.error;
    const found = allEvents().find((item) => item.id === params.id);
    if (!found) return fail(404, "not_found", "That event does not exist.");
    if (found.clubName !== who.club)
      return fail(403, "forbidden", "You can only delete your own club's events.");
    mockDb.removeEvent(found.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Auth ----
  http.get("*/api/auth/me", async () => {
    await wait(150);
    const user = mockDb.currentUser();
    if (!user) return fail(401, "unauthenticated", "You are not logged in.");
    return HttpResponse.json({ user });
  }),

  http.post("*/api/auth/google", async ({ request }) => oauth("google", request)),
  http.post("*/api/auth/github", async ({ request }) => oauth("github", request)),

  http.post("*/api/auth/login", async ({ request }) => {
    await wait();
    const body = (await request.json()) as { email?: string; password?: string; intent?: string };
    const email = (body.email ?? "").trim();

    const user = mockDb.findByEmail(email);
    // The core team signs in like everyone else. The server decides the role, the login form never offers it.
    const isCore = user?.role === "core";

    if (!isCore && body.intent === "admin" && !APPROVED_ADMINS.includes(email.toLowerCase())) {
      return fail(403, "admin_not_approved", "That email is not on the club admin list.");
    }

    const wantsRole = body.intent === "admin" ? "club_admin" : "student";
    if (!user || user.password !== body.password || (!isCore && user.role !== wantsRole)) {
      return fail(401, "invalid_credentials", "Wrong email or password.");
    }
    mockDb.signIn(user.id);
    return HttpResponse.json({ user: mockDb.currentUser() });
  }),

  http.post("*/api/auth/logout", async () => {
    mockDb.signOut();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/auth/password/create", async ({ request }) => {
    await wait();
    const body = (await request.json()) as { password?: string };
    if (!mockDb.currentUser()) return fail(401, "unauthenticated", "You are not logged in.");
    if ((body.password ?? "").length < 8) {
      return fail(422, "validation_error", "Check the form.", { password: "Use at least 8 characters" });
    }
    mockDb.setPassword(body.password as string);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/auth/password/change", async ({ request }) => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    const body = (await request.json()) as { current_password?: string; password?: string };
    const fields: Record<string, string> = {};
    if (!mockDb.passwordMatches(body.current_password ?? ""))
      fields.current_password = "That is not your current password";
    if ((body.password ?? "").length < 8) fields.password = "Use at least 8 characters";
    if (Object.keys(fields).length > 0) return fail(422, "validation_error", "Check the form.", fields);
    mockDb.setPassword(body.password as string);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Settings: blocks and account ----
  http.get("*/api/blocks", async () => {
    await wait(200);
    const who = student();
    if ("error" in who) return who.error;
    // The first time, one person is already blocked so Unblock can be tried.
    let ids = mockDb.blocksOf(who.user.id);
    if (!ids) {
      ids = [mockPeople[5].id];
      mockDb.setBlocks(who.user.id, ids);
    }
    const people = ids.flatMap((id) => {
      const person = mockPeople.find((item) => item.id === id);
      return person ? [{ id: person.id, name: person.name, college: person.college }] : [];
    });
    return HttpResponse.json({ blocked: people });
  }),

  http.delete("*/api/blocks/:userId", async ({ params }) => {
    await wait(250);
    const who = student();
    if ("error" in who) return who.error;
    const ids = mockDb.blocksOf(who.user.id) ?? [];
    if (!ids.includes(String(params.userId))) return fail(404, "not_found", "That person is not blocked.");
    mockDb.setBlocks(
      who.user.id,
      ids.filter((id) => id !== params.userId),
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("*/api/account", async ({ request }) => {
    await wait(600);
    const who = student();
    if ("error" in who) return who.error;
    const body = (await request.json().catch(() => ({}))) as { confirm?: string };
    if (body.confirm !== "DELETE")
      return fail(422, "validation_error", "Type DELETE to confirm.", { confirm: "Type DELETE to confirm" });
    mockDb.deleteAccount(who.user.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/auth/password/forgot", async () => {
    await wait();
    // Always succeeds, so nobody can use this to find out which emails have accounts.
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/auth/password/reset", async ({ request }) => {
    await wait();
    const body = (await request.json()) as { token?: string; password?: string };
    if (!body.token || body.token === "invalid") {
      return fail(400, "invalid_token", "This reset link has expired. Ask for a new one.");
    }
    if ((body.password ?? "").length < 8) {
      return fail(422, "validation_error", "Check the form.", { password: "Use at least 8 characters" });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Profile ----
  http.get("*/api/profile/me", async () => {
    await wait(200);
    const who = student();
    if ("error" in who) return who.error;
    return HttpResponse.json({ profile: profileFor(who.user.id, who.user.name) });
  }),

  http.patch("*/api/profile/me", async ({ request }) => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    const patch = (await request.json()) as ProfileUpdate;
    if (patch.name !== undefined && patch.name.trim().length < 2) {
      return fail(422, "validation_error", "Check the form.", { name: "Use at least 2 characters" });
    }
    const stored = mockDb.profileOf(who.user.id);
    const { name, ...rest } = patch;
    Object.assign(stored, rest);
    if (name !== undefined) mockDb.rename(who.user.id, name.trim());
    mockDb.commit();
    const current = mockDb.currentUser();
    return HttpResponse.json({ profile: profileFor(who.user.id, current?.name ?? who.user.name) });
  }),

  http.post("*/api/profile/photo", async ({ request }) => {
    await wait(500);
    const who = student();
    if ("error" in who) return who.error;
    const file = (await request.formData()).get("photo");
    if (!(file instanceof File)) {
      return fail(422, "validation_error", "Check the form.", { photo: "Choose an image" });
    }
    const photoUrl = await fileToDataUrl(file);
    mockDb.profileOf(who.user.id).photoUrl = photoUrl;
    mockDb.commit();
    return HttpResponse.json({ photoUrl });
  }),

  http.get("*/api/colleges/suggest", async ({ request }) => {
    await wait(150);
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
    // An empty q is the dropdown button: send the first colleges so the list can be browsed.
    const colleges = q
      ? MOCK_COLLEGES.filter((name) => name.toLowerCase().includes(q)).slice(0, 6)
      : MOCK_COLLEGES.slice(0, 10);
    return HttpResponse.json({ colleges });
  }),

  http.get("*/api/skills", async () => {
    await wait(150);
    return HttpResponse.json({ skills: skillCatalog.skills, interests: skillCatalog.interests });
  }),

  http.put("*/api/profile/skills", async ({ request }) => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    const body = (await request.json()) as SkillSelection;
    if (body.customSkills.length > 10) {
      return fail(422, "validation_error", "Check the form.", { customSkills: "Use up to 10 custom skills" });
    }
    Object.assign(mockDb.profileOf(who.user.id), {
      skills: body.skills,
      interests: body.interests,
      customSkills: body.customSkills,
    });
    mockDb.commit();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/profile/privacy", async () => {
    await wait(150);
    const who = student();
    if ("error" in who) return who.error;
    return HttpResponse.json({ privacy: mockDb.profileOf(who.user.id).privacy });
  }),

  http.patch("*/api/profile/privacy", async ({ request }) => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    const patch = (await request.json()) as Partial<Privacy>;
    const stored = mockDb.profileOf(who.user.id);
    stored.privacy = { ...stored.privacy, ...patch };
    mockDb.commit();
    return HttpResponse.json({ privacy: stored.privacy });
  }),

  http.post("*/api/profile/complete", async () => {
    await wait();
    const who = student();
    if ("error" in who) return who.error;
    const stored = mockDb.profileOf(who.user.id);
    if (!stored.college || !stored.year || stored.lookingFor.length === 0) {
      return fail(422, "profile_incomplete", "Finish the basic info first.");
    }
    mockDb.completeOnboarding(who.user.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Projects ----
  http.get("*/api/projects", async () => {
    await wait(200);
    const who = student();
    if ("error" in who) return who.error;
    return HttpResponse.json({ projects: mockDb.profileOf(who.user.id).projects });
  }),

  http.post("*/api/projects", async ({ request }) => {
    await wait(500);
    const who = student();
    if ("error" in who) return who.error;
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (!title)
      return fail(422, "validation_error", "Check the form.", { title: "Give the project a title" });
    // The same project cannot be added twice (same title or same link).
    const newLink = String(form.get("link") ?? "") || undefined;
    const twin = findDuplicateProject(mockDb.profileOf(who.user.id).projects, { title, link: newLink });
    if (twin) {
      const sameTitle = projectKey(twin.title) === projectKey(title);
      return fail(409, "duplicate_project", "You already added this project.", {
        [sameTitle ? "title" : "link"]: duplicateMessage(twin, !sameTitle),
      });
    }
    const images = form.getAll("images").filter((item): item is File => item instanceof File);
    if (images.length > 3) {
      return fail(422, "validation_error", "Check the form.", { images: "Use up to 3 images" });
    }
    const imageUrls = await Promise.all(images.map(fileToDataUrl));
    const project = {
      id: crypto.randomUUID(),
      title,
      description,
      techTags: form.getAll("techTags").map(String),
      link: String(form.get("link") ?? "") || undefined,
      imageUrls,
    };
    mockDb.profileOf(who.user.id).projects.push(project);
    mockDb.commit();
    return HttpResponse.json({ project }, { status: 201 });
  }),

  http.patch("*/api/projects/:id", async ({ params, request }) => {
    await wait(500);
    const who = student();
    if ("error" in who) return who.error;
    const project = mockDb.profileOf(who.user.id).projects.find((item) => item.id === params.id);
    if (!project) return fail(404, "not_found", "We could not find that project.");
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    if (!title)
      return fail(422, "validation_error", "Check the form.", { title: "Give the project a title" });
    const editedLink = String(form.get("link") ?? "") || undefined;
    const twin = findDuplicateProject(
      mockDb.profileOf(who.user.id).projects,
      { title, link: editedLink },
      project.id,
    );
    if (twin) {
      const sameTitle = projectKey(twin.title) === projectKey(title);
      return fail(409, "duplicate_project", "You already have this project.", {
        [sameTitle ? "title" : "link"]: duplicateMessage(twin, !sameTitle),
      });
    }
    const removed = new Set(form.getAll("removeImageIndexes").map((item) => Number(item)));
    const kept = project.imageUrls.filter((_, index) => !removed.has(index));
    const added = form.getAll("images").filter((item): item is File => item instanceof File);
    if (kept.length + added.length > 3) {
      return fail(422, "validation_error", "Check the form.", { images: "Use up to 3 images" });
    }
    project.title = title;
    project.description = String(form.get("description") ?? "").trim();
    project.techTags = form.getAll("techTags").map(String);
    project.link = String(form.get("link") ?? "") || undefined;
    project.imageUrls = [...kept, ...(await Promise.all(added.map(fileToDataUrl)))];
    mockDb.commit();
    return HttpResponse.json({ project });
  }),

  http.delete("*/api/projects/:id", async ({ params }) => {
    await wait(300);
    const who = student();
    if ("error" in who) return who.error;
    const stored = mockDb.profileOf(who.user.id);
    if (!stored.projects.some((item) => item.id === params.id)) {
      return fail(404, "not_found", "We could not find that project.");
    }
    stored.projects = stored.projects.filter((item) => item.id !== params.id);
    mockDb.commit();
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Experience ----
  http.get("*/api/experience", async () => {
    await wait(200);
    const who = student();
    if ("error" in who) return who.error;
    return HttpResponse.json({ experience: mockDb.profileOf(who.user.id).experience });
  }),

  http.post("*/api/experience", async ({ request }) => {
    await wait(400);
    const who = student();
    if ("error" in who) return who.error;
    const body = (await request.json()) as ExperienceInput;
    if (!body.organisation?.trim()) {
      return fail(422, "validation_error", "Check the form.", {
        organisation: "Enter the organisation or event",
      });
    }
    const item = { ...body, id: crypto.randomUUID() };
    mockDb.profileOf(who.user.id).experience.push(item);
    mockDb.commit();
    return HttpResponse.json({ experience: item }, { status: 201 });
  }),

  http.patch("*/api/experience/:id", async ({ params, request }) => {
    await wait(400);
    const who = student();
    if ("error" in who) return who.error;
    const item = mockDb.profileOf(who.user.id).experience.find((entry) => entry.id === params.id);
    if (!item) return fail(404, "not_found", "We could not find that entry.");
    const body = (await request.json()) as ExperienceInput;
    if (!body.organisation?.trim()) {
      return fail(422, "validation_error", "Check the form.", {
        organisation: "Enter the organisation or event",
      });
    }
    Object.assign(item, body);
    mockDb.commit();
    return HttpResponse.json({ experience: item });
  }),

  http.delete("*/api/experience/:id", async ({ params }) => {
    await wait(300);
    const who = student();
    if ("error" in who) return who.error;
    const stored = mockDb.profileOf(who.user.id);
    if (!stored.experience.some((entry) => entry.id === params.id)) {
      return fail(404, "not_found", "We could not find that entry.");
    }
    stored.experience = stored.experience.filter((entry) => entry.id !== params.id);
    mockDb.commit();
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Feedback ----
  http.post("*/api/feedback", async () => {
    await wait();
    return new HttpResponse(null, { status: 204 });
  }),

  // NEW: Core admin API (/api/superadmin). Lives in its own folder so it can be deleted when the real backend is used.
  ...superadminHandlers,
];

async function oauth(provider: string, request: Request) {
  await wait();
  const body = (await request.json()) as { intent?: string; callback_url?: string };
  const callback = body.callback_url ?? "/auth/callback";

  if (body.intent === "admin") {
    const admin = mockDb.findByEmail(APPROVED_ADMINS[0]);
    if (admin) mockDb.signIn(admin.id);
  } else {
    mockDb.oauthStudent(provider);
  }
  // The real API returns the provider's page. The mock goes straight back to the app.
  return HttpResponse.json({ url: callback });
}
