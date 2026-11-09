export type EventType = "hackathon" | "meetup" | "conference" | "workshop";
export type EventMode = "online" | "offline";

export type EventItem = {
  id: string;
  title: string;
  type: EventType;
  mode: EventMode;
  /** YYYY-MM-DD */
  startDate: string;
  endDate?: string;
  /** Venue or online link */
  place: string;
  registrationUrl: string;
  description: string;
  posterUrl?: string;
  clubName: string;
  interestedCount: number;
  expired: boolean;
  /** Set for logged-in students: have I marked this event interested? */
  interested?: boolean;
};

/** "core" is the konnevo team. It comes only from the server (CORE_ADMIN_EMAILS), never from a login choice. */
export type Role = "student" | "club_admin" | "core";
export type LoginAs = "student" | "admin";

/** What GET /api/auth/me returns for a signed-in person. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  photoUrl?: string;
  /** False after a first Google or GitHub login until the person sets one. */
  hasPassword: boolean;
  /** Students only. False sends them into onboarding. */
  onboardingComplete: boolean;
  /** Club admins only. */
  clubName?: string;
};

export type OAuthProvider = "google" | "github";

export type FeedbackInput = {
  message: string;
  email?: string;
};

export type Year = "1st" | "2nd" | "3rd" | "4th" | "5th" | "other";
export type LookingFor = "teammate" | "learning" | "networking";

/** GET /api/profile/me */
export type Profile = {
  id: string;
  name: string;
  college: string;
  year: Year | "";
  lookingFor: LookingFor[];
  /** Short bio, 300 characters. */
  bio: string;
  photoUrl?: string;
  github: string;
  linkedin: string;
  /** Optional: a personal site or portfolio link. */
  portfolio: string;
  /** Optional: Discord username, for teammates to reach you. */
  discord: string;
  /** Optional: WhatsApp number with country code. */
  whatsapp: string;
  /** The general "About you" text, 1000 characters. */
  about: string;
  skills: string[];
  interests: string[];
  customSkills: string[];
};

export type ProfileUpdate = Partial<
  Pick<Profile, "name" | "college" | "year" | "lookingFor" | "bio" | "github" | "linkedin" | "portfolio" | "discord" | "whatsapp" | "about">
>;

/** GET /api/profile/privacy */
export type Privacy = {
  showCollege: boolean;
  showSkills: boolean;
  showLinkedin: boolean;
  showGithub: boolean;
  /** Matching opt-in. */
  showMeToOthers: boolean;
  hideProfile: boolean;
};

export type SkillCatalog = {
  skills: { group: string; items: string[] }[];
  interests: string[];
};

export type SkillSelection = {
  skills: string[];
  interests: string[];
  customSkills: string[];
};

export type Project = {
  id: string;
  title: string;
  description: string;
  techTags: string[];
  link?: string;
  imageUrls: string[];
};

export type EventListResponse = { events: EventItem[]; nextCursor: string | null };

/** A person shown in "Who is interested". The server decides which fields it returns. */
export type PersonCard = {
  id: string;
  name: string;
  photoUrl?: string;
  college?: string;
  topSkills: string[];
};

export type PeopleResponse = { people: PersonCard[]; nextCursor: string | null; total: number };

export type SuggestedPerson = PersonCard & { whyMatch: string };

/** `lowCandidates` means there are not enough people yet. */
export type SuggestedResponse = { people: SuggestedPerson[]; lowCandidates: boolean };

export type ExperienceType = "hackathon" | "internship" | "event" | "other";

export type Experience = {
  id: string;
  type: ExperienceType;
  title: string;
  /** Required: the organisation or event. */
  organisation: string;
  /** YYYY-MM */
  startMonth: string;
  endMonth?: string;
  description: string;
};

export type ExperienceInput = Omit<Experience, "id">;

export type SwipeDirection = "left" | "right";

export type PersonProject = {
  id: string;
  title: string;
  description: string;
  techTags: string[];
  link?: string;
};

/** Another student, as the server chooses to show them. Hidden fields are simply missing. */
export type PersonProfile = {
  id: string;
  name: string;
  photoUrl?: string;
  college?: string;
  year?: string;
  bio: string;
  lookingFor: LookingFor[];
  skills: string[];
  interests: string[];
  projects: PersonProject[];
};

/** GET /api/events/:id/people/:userId */
export type PersonResponse =
  | { lowCandidates: true }
  | {
      lowCandidates: false;
      person: PersonProfile;
      whyMatch: string;
      /** "Person 3 of 41" */
      position: number;
      total: number;
      /** The next person to show, or null after the last one. */
      nextUserId: string | null;
      /** What I already did with this person, if anything. */
      swiped: SwipeDirection | null;
    };

/** A mutual match. The links are present only when the server says they may be shown. */
export type Match = {
  id: string;
  person: { id: string; name: string; photoUrl?: string };
  linkedin?: string;
  github?: string;
};

export type SwipeResponse = { matched: boolean; match?: Match };

/** The only two team statuses the brief allows. The API decides which one, the UI never computes it. */
export type TeamStatus = "registered" | "attended";

export type TeamEventRef = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  /** False while the invite is still waiting. */
  accepted: boolean;
};

/** A team I belong to. */
export type Team = {
  id: string;
  name: string;
  event: TeamEventRef;
  myRole: string;
  members: TeamMember[];
  status: TeamStatus;
};

/** A team invite waiting for my answer. */
export type TeamInvite = {
  /** The team id. Used with POST /api/teams/:id/respond. */
  id: string;
  teamName: string;
  event: TeamEventRef;
  invitedBy: { id: string; name: string };
  /** The role they would like me to take. */
  role: string;
};

/** GET /api/teams returns both my teams and my pending invites. */
export type TeamsResponse = { teams: Team[]; invites: TeamInvite[] };

export type TeamInput = {
  name: string;
  eventId: string;
  myRole: string;
  memberIds: string[];
};

/** One row of GET /api/matches. The links are present only when the server says they may be shown. */
export type MatchItem = {
  id: string;
  event: { id: string; title: string };
  person: { id: string; name: string; photoUrl?: string };
  linkedin?: string;
  github?: string;
};

/** What a club admin types into the add or edit event form. */
export type EventInput = {
  title: string;
  type: EventType;
  mode: EventMode;
  /** YYYY-MM-DD */
  startDate: string;
  endDate?: string;
  place: string;
  registrationUrl: string;
  description: string;
  /** A new poster. Leave out to keep the old one. */
  poster?: File;
};

export type AdminReport = {
  id: string;
  reason: string;
  /** What was reported, for example "Project: PlantPal". */
  subject: string;
  createdAt: string;
  status: "open" | "resolved";
};

export type AdminStats = {
  events: number;
  upcoming: number;
  interested: number;
};

/** GET /api/admin/overview */
export type AdminOverview = {
  clubName: string;
  stats: AdminStats;
  /** The club's own events, soonest first. Past ones are included. */
  events: EventItem[];
  reports: AdminReport[];
};
