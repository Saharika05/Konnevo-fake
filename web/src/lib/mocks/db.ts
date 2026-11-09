import type { EventItem, Experience, Privacy, Profile, Project, SessionUser } from "@/lib/api/types";

/**
 * A tiny fake database that lives in the browser (localStorage), so a mock
 * login survives a page refresh. It is only used while NEXT_PUBLIC_API_URL is empty.
 */
type MockUser = SessionUser & { password?: string };

type MockProfile = Omit<Profile, "id" | "name"> & {
  privacy: Privacy;
  projects: Project[];
  experience: Experience[];
};

type MockDb = {
  users: MockUser[];
  sessionUserId: string | null;
  /** Keyed by user id. Older saved data may not have it. */
  profiles?: Record<string, MockProfile>;
  /** Event ids each user marked interested, keyed by user id. */
  interested?: Record<string, string[]>;
  /** What each user did with people, keyed by "userId:eventId" then by person id. */
  swipes?: Record<string, Record<string, "left" | "right">>;
  /** Mutual matches. Step 7 shows them on My Teams. */
  matches?: { id: string; userId: string; eventId: string; personId: string }[];
  /** Teams (Step 7). Members include people who have not accepted yet. */
  teams?: MockTeam[];
  /** Users who already got their demo invite. */
  invitesSeededFor?: string[];
  /** Person ids each student has blocked, keyed by user id. */
  blocks?: Record<string, string[]>;
  /** Events a club admin created (Step 9). */
  customEvents?: EventItem[];
  /** Changes an admin made to the built-in events, by id. */
  eventEdits?: Record<string, Partial<EventItem>>;
  /** Built-in events an admin deleted. */
  deletedEvents?: string[];
  /** Reports for the admin overview. Added once. */
  reports?: { id: string; reason: string; subject: string; createdAt: string; status: "open" | "resolved" }[];
  adminSeeded?: boolean;
};

export type MockTeam = {
  id: string;
  name: string;
  eventId: string;
  members: {
    userId: string;
    name: string;
    role: string;
    accepted: boolean;
    invitedById?: string;
    invitedByName?: string;
  }[];
};

/** Matching opt-in starts On, as proposed in the brief. */
const DEFAULT_PRIVACY: Privacy = {
  showCollege: true,
  showSkills: true,
  showLinkedin: true,
  showGithub: true,
  showMeToOthers: true,
  hideProfile: false,
};

function emptyProfile(): MockProfile {
  return {
    college: "",
    year: "",
    lookingFor: [],
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
    discord: "",
    whatsapp: "",
    about: "",
    skills: [],
    interests: [],
    customSkills: [],
    privacy: { ...DEFAULT_PRIVACY },
    projects: [],
    experience: [],
  };
}

const SEED_PROFILES: Record<string, MockProfile> = {
  "00000000-0000-4000-8000-000000000001": {
    ...emptyProfile(),
    college: "National Institute of Technology",
    year: "3rd",
    lookingFor: ["teammate", "learning"],
    bio: "Frontend dev who loves hackathons and good design.",
    github: "https://github.com/priya-demo",
    linkedin: "https://linkedin.com/in/priya-demo",
    about: "Third year CS student. I build with React and love turning rough ideas into working demos.",
    skills: ["React", "TypeScript", "Figma"],
    interests: ["Hackathons", "UI/UX"],
    customSkills: [],
    projects: [
      {
        id: "project-seed-1",
        title: "CampusCart",
        description: "A small marketplace for students to sell used books and gadgets within their campus.",
        techTags: ["React", "Node.js"],
        link: "https://github.com/priya-demo/campuscart",
        imageUrls: [],
      },
    ],
    experience: [
      {
        id: "experience-seed-1",
        type: "hackathon",
        title: "Frontend developer",
        organisation: "HackFest 2025",
        startMonth: "2025-11",
        endMonth: "2025-11",
        description: "Built the team's web app in 24 hours. We reached the top ten.",
      },
    ],
  },
};

/** College names the suggestion box searches. */
export const MOCK_COLLEGES = [
  "National Institute of Technology",
  "Indian Institute of Technology Madras",
  "Indian Institute of Technology Bombay",
  "BITS Pilani",
  "Anna University",
  "VIT Vellore",
  "SRM Institute of Science and Technology",
  "PSG College of Technology",
  "RV College of Engineering",
  "Delhi Technological University",
];

const KEY = "konnevo-mock-db";

const SEED: MockDb = {
  sessionUserId: null,
  users: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Priya",
      email: "student@konnevo.test",
      password: "password123",
      role: "student",
      hasPassword: true,
      onboardingComplete: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Tech Club",
      email: "admin@techclub.test",
      password: "password123",
      role: "club_admin",
      hasPassword: true,
      onboardingComplete: true,
      clubName: "Tech Club",
    },
    // The core team. In the real system this comes from CORE_ADMIN_EMAILS plus users.role = core.
    {
      id: "00000000-0000-4000-8000-000000000003",
      name: "Core team",
      email: "core@konnevo.test",
      password: "password123",
      role: "core",
      hasPassword: true,
      onboardingComplete: true,
    },
  ],
};

/** Emails approved to log in as a club admin. */
export const APPROVED_ADMINS = ["admin@techclub.test"];

function load(): MockDb {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as MockDb;
      // Data saved by an older version may be missing seeded accounts (for example the core user).
      for (const seeded of SEED.users) {
        if (!saved.users.some((user) => user.id === seeded.id)) saved.users.push(structuredClone(seeded));
      }
      return saved;
    }
  } catch {
    // Storage blocked or damaged: fall back to the seed.
  }
  return structuredClone(SEED);
}

let db: MockDb | null = null;

function state(): MockDb {
  if (!db) db = load();
  return db;
}

function profiles(): Record<string, MockProfile> {
  const current = state();
  if (!current.profiles) current.profiles = {};
  return current.profiles;
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state()));
  } catch {
    // Without storage the fake login resets on refresh. That is fine.
  }
}

function strip({ password: _password, ...user }: MockUser): SessionUser {
  void _password;
  return user;
}

export const mockDb = {
  currentUser(): SessionUser | null {
    const { users, sessionUserId } = state();
    const user = users.find((item) => item.id === sessionUserId);
    if (!user) return null;
    // The photo lives on the profile; the session carries it so the navbar can show it.
    return { ...strip(user), photoUrl: profiles()[user.id]?.photoUrl };
  },

  findByEmail(email: string): MockUser | undefined {
    return state().users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  },

  signIn(userId: string) {
    state().sessionUserId = userId;
    save();
  },

  signOut() {
    state().sessionUserId = null;
    save();
  },

  /** Google or GitHub: a brand new student with no password and no profile. */
  oauthStudent(provider: string): SessionUser {
    const email = `demo.${provider}@konnevo.test`;
    let user = this.findByEmail(email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: "Demo Student",
        email,
        role: "student",
        hasPassword: false,
        onboardingComplete: false,
      };
      state().users.push(user);
    }
    this.signIn(user.id);
    return strip(user);
  },

  /** The profile of the person who is logged in. Created on first use. */
  profileOf(userId: string): MockProfile {
    const all = profiles();
    if (!all[userId]) all[userId] = structuredClone(SEED_PROFILES[userId] ?? emptyProfile());
    // Data saved by an older version may not have this yet.
    all[userId].experience ??= [];
    return all[userId];
  },

  interestedIds(userId: string): string[] {
    const current = state();
    if (!current.interested) current.interested = {};
    return current.interested[userId] ?? [];
  },

  setInterested(userId: string, eventId: string, on: boolean) {
    const current = state();
    if (!current.interested) current.interested = {};
    const list = new Set(current.interested[userId] ?? []);
    if (on) list.add(eventId);
    else list.delete(eventId);
    current.interested[userId] = [...list];
    save();
  },

  swipesFor(userId: string, eventId: string): Record<string, "left" | "right"> {
    const current = state();
    if (!current.swipes) current.swipes = {};
    return current.swipes[`${userId}:${eventId}`] ?? {};
  },

  recordSwipe(userId: string, eventId: string, personId: string, direction: "left" | "right") {
    const current = state();
    if (!current.swipes) current.swipes = {};
    const key = `${userId}:${eventId}`;
    current.swipes[key] = { ...(current.swipes[key] ?? {}), [personId]: direction };
    save();
  },

  /** Creates the match once; asking again returns the same one. */
  addMatch(userId: string, eventId: string, personId: string): string {
    const current = state();
    if (!current.matches) current.matches = [];
    const existing = current.matches.find(
      (item) => item.userId === userId && item.eventId === eventId && item.personId === personId,
    );
    if (existing) return existing.id;
    const id = crypto.randomUUID();
    current.matches.push({ id, userId, eventId, personId });
    save();
    return id;
  },

  matchesFor(userId: string) {
    return (state().matches ?? []).filter((item) => item.userId === userId);
  },

  removeMatch(userId: string, matchId: string): boolean {
    const current = state();
    const before = current.matches?.length ?? 0;
    current.matches = (current.matches ?? []).filter(
      (item) => !(item.id === matchId && item.userId === userId),
    );
    save();
    return current.matches.length !== before;
  },

  teamList(): MockTeam[] {
    const current = state();
    if (!current.teams) current.teams = [];
    return current.teams;
  },

  /** The demo invite is added once per student so the Invites tab is never empty on first look. */
  invitesSeeded(userId: string): boolean {
    return (state().invitesSeededFor ?? []).includes(userId);
  },

  markInvitesSeeded(userId: string) {
    const current = state();
    current.invitesSeededFor = [...(current.invitesSeededFor ?? []), userId];
    save();
  },

  /** Undefined until the student has any blocks (the mock then adds one demo block). */
  blocksOf(userId: string): string[] | undefined {
    return state().blocks?.[userId];
  },

  setBlocks(userId: string, ids: string[]) {
    const current = state();
    if (!current.blocks) current.blocks = {};
    current.blocks[userId] = ids;
    save();
  },

  passwordMatches(password: string): boolean {
    const { users, sessionUserId } = state();
    return users.find((item) => item.id === sessionUserId)?.password === password;
  },

  /** Removes the person and everything of theirs, then logs them out. */
  deleteAccount(userId: string) {
    const current = state();
    current.users = current.users.filter((item) => item.id !== userId);
    delete current.profiles?.[userId];
    delete current.interested?.[userId];
    delete current.blocks?.[userId];
    for (const key of Object.keys(current.swipes ?? {})) {
      if (key.startsWith(`${userId}:`)) delete current.swipes?.[key];
    }
    current.matches = (current.matches ?? []).filter((item) => item.userId !== userId);
    current.teams = (current.teams ?? [])
      .map((team) => ({ ...team, members: team.members.filter((m) => m.userId !== userId) }))
      .filter((team) => team.members.length > 0);
    current.sessionUserId = null;
    save();
  },

  /** Everything an admin changed about events, for the handlers to apply on top of the built-in list. */
  eventChanges() {
    const current = state();
    return {
      custom: current.customEvents ?? [],
      edits: current.eventEdits ?? {},
      deleted: current.deletedEvents ?? [],
    };
  },

  addEvent(event: EventItem) {
    const current = state();
    current.customEvents = [...(current.customEvents ?? []), event];
    save();
  },

  /** Custom events are changed in place, built-in ones through an edit record. */
  patchEvent(id: string, patch: Partial<EventItem>) {
    const current = state();
    const custom = current.customEvents?.find((item) => item.id === id);
    if (custom) Object.assign(custom, patch);
    else {
      current.eventEdits = {
        ...(current.eventEdits ?? {}),
        [id]: { ...(current.eventEdits?.[id] ?? {}), ...patch },
      };
    }
    save();
  },

  removeEvent(id: string) {
    const current = state();
    if (current.customEvents?.some((item) => item.id === id)) {
      current.customEvents = current.customEvents.filter((item) => item.id !== id);
    } else {
      current.deletedEvents = [...(current.deletedEvents ?? []), id];
    }
    save();
  },

  nameOf(userId: string): string | undefined {
    return state().users.find((item) => item.id === userId)?.name;
  },

  /** The demo reports are added once, the first time an admin looks. */
  adminSeeded(): boolean {
    return state().adminSeeded === true;
  },

  seedAdmin(reports: NonNullable<MockDb["reports"]>) {
    const current = state();
    current.adminSeeded = true;
    current.reports = reports;
    save();
  },

  reportList() {
    return state().reports ?? [];
  },

  /** Writes the current state to localStorage after a change. */
  commit() {
    save();
  },

  /** Renames the logged-in user (the profile name is the user name). */
  rename(userId: string, name: string) {
    const user = state().users.find((item) => item.id === userId);
    if (user) user.name = name;
  },

  completeOnboarding(userId: string) {
    const user = state().users.find((item) => item.id === userId);
    if (user) user.onboardingComplete = true;
    save();
  },

  setPassword(password: string) {
    const { users, sessionUserId } = state();
    const user = users.find((item) => item.id === sessionUserId);
    if (!user) return false;
    user.password = password;
    user.hasPassword = true;
    save();
    return true;
  },
};
