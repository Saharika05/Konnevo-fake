/**
 * NEW: sample data for the Core admin screens (MSW only).
 * Delete this folder when the real /api/superadmin backend is used; nothing outside
 * lib/mocks/handlers.ts (one import line) depends on it.
 * Changes live in memory, so a full page reload puts the sample data back.
 */
import type { AuditAction, ReportStatus } from "@/lib/core/schemas";

export type MockCollege = { id: string; name: string; students: number; createdAt: string };
export type MockClub = {
  id: string;
  name: string;
  collegeId: string;
  admin: { id: string; email: string } | null;
};
export type MockEvent = {
  id: string;
  title: string;
  clubId: string;
  type: "hackathon" | "meetup" | "conference" | "workshop";
  mode: "online" | "offline";
  startDate: string;
  endDate: string | null;
  place: string;
  registrationUrl: string;
  interested: number;
  registerClicks: number;
  teams: number;
  matches: number;
};
export type MockReport = {
  id: string;
  createdAt: string;
  type: "event" | "user" | "project";
  target: string | null;
  targetSummary: string | null;
  reason: string;
  status: ReportStatus;
  reporter: string | null;
  history: { status: ReportStatus; at: string; by: string; note?: string }[];
};
export type MockAudit = { id: string; at: string; actor: string; action: AuditAction; target: string };

export const colleges: MockCollege[] = [
  { id: "col-1", name: "Sample College, Bengaluru", students: 412, createdAt: "2026-06-02" },
  { id: "col-2", name: "Tech University", students: 366, createdAt: "2026-06-03" },
  { id: "col-3", name: "PES University, Bengaluru", students: 301, createdAt: "2026-06-05" },
  { id: "col-4", name: "PES", students: 31, createdAt: "2026-08-19" },
  { id: "col-5", name: "City Institute", students: 148, createdAt: "2026-07-11" },
  { id: "col-6", name: "Metro College", students: 26, createdAt: "2026-09-02" },
  { id: "col-7", name: "XYZ College", students: 54, createdAt: "2026-07-20" },
  { id: "col-8", name: "xyz college of engg", students: 12, createdAt: "2026-09-14" },
];

export const clubs: MockClub[] = [
  { id: "club-1", name: "Tech Club", collegeId: "col-1", admin: { id: "adm-1", email: "tech@college.edu" } },
  { id: "club-2", name: "AI Club", collegeId: "col-2", admin: { id: "adm-2", email: "ai@techuni.edu" } },
  { id: "club-3", name: "Startup Cell", collegeId: "col-5", admin: { id: "adm-3", email: "cell@city.edu" } },
  {
    id: "club-4",
    name: "Cloud Club",
    collegeId: "col-1",
    admin: { id: "adm-4", email: "cloud@college.edu" },
  },
  { id: "club-5", name: "DS Club", collegeId: "col-6", admin: { id: "adm-5", email: "ds@metro.edu" } },
  { id: "club-6", name: "Robotics Club", collegeId: "col-2", admin: null },
  {
    id: "club-7",
    name: "Open Source Guild",
    collegeId: "col-3",
    admin: { id: "adm-6", email: "oss@pes.edu" },
  },
  { id: "club-8", name: "Design Circle", collegeId: "col-4", admin: null },
  { id: "club-9", name: "Coding Club", collegeId: "col-7", admin: { id: "adm-7", email: "code@xyz.edu" } },
  { id: "club-10", name: "Makers Lab", collegeId: "col-8", admin: null },
];

const BASE_TITLES = [
  "HackFest",
  "Founders Meetup",
  "AI Build Sprint",
  "Cloud Summit",
  "Startup Pitch Night",
  "Women in Tech Summit",
  "Data Science Day",
  "Open Source Meetup",
  "Web3 Workshop",
  "Robotics Challenge",
  "Design Sprint",
  "Cyber Security CTF",
  "Mobile Dev Day",
  "Game Jam",
];
const TYPES = ["hackathon", "meetup", "conference", "workshop"] as const;

/** A tiny repeatable "random": the same numbers every time, so screens look the same on every run. */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function dateFrom(base: string, addDays: number) {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10);
}

export const events: MockEvent[] = Array.from({ length: 41 }, (_, i) => {
  const interested = Math.round(18 + seeded(i, 1) * 230);
  const registerClicks = Math.round(interested * (0.3 + seeded(i, 2) * 0.35));
  const teams = Math.round(interested * (0.04 + seeded(i, 3) * 0.1));
  const type = TYPES[i % 4];
  const start = dateFrom("2026-09-05", i * 4);
  const edition = i < 14 ? "2026" : i < 28 ? "Edition 2" : "Edition 3";
  return {
    id: `ev-${i + 1}`,
    title: `${BASE_TITLES[i % BASE_TITLES.length]} ${edition}`,
    clubId: clubs[i % clubs.length].id,
    type,
    mode: i % 3 === 0 ? "online" : "offline",
    startDate: start,
    endDate: type === "hackathon" ? dateFrom(start, 1) : null,
    place: i % 3 === 0 ? "https://meet.example.org/konnevo" : "Main auditorium",
    registrationUrl: `https://events.example.org/register/${i + 1}`,
    interested,
    registerClicks,
    teams,
    matches: Math.round(interested * (0.2 + seeded(i, 5) * 0.3)),
  };
});

export const reports: MockReport[] = [
  {
    id: "rep-1",
    createdAt: "2026-10-09T09:12:00Z",
    type: "event",
    target: "AI Build Sprint 2026",
    targetSummary: "Event by AI Club, Tech University",
    reason: "Wrong date shown",
    status: "open",
    reporter: "Arjun K.",
    history: [{ status: "open", at: "2026-10-09T09:12:00Z", by: "Arjun K." }],
  },
  {
    id: "rep-2",
    createdAt: "2026-10-08T17:40:00Z",
    type: "event",
    target: "Data Science Day 2026",
    targetSummary: "Event by DS Club, Metro College",
    reason: "Looks like spam",
    status: "reviewing",
    reporter: "Meera R.",
    history: [
      { status: "open", at: "2026-10-08T17:40:00Z", by: "Meera R." },
      {
        status: "reviewing",
        at: "2026-10-09T08:00:00Z",
        by: "core@konnevo.test",
        note: "Checking the club page",
      },
    ],
  },
  {
    id: "rep-3",
    createdAt: "2026-10-03T11:05:00Z",
    type: "event",
    target: "Cloud Summit 2026",
    targetSummary: "Event by Cloud Club, Sample College, Bengaluru",
    reason: "Wrong link",
    status: "resolved",
    reporter: "Sana M.",
    history: [
      { status: "open", at: "2026-10-03T11:05:00Z", by: "Sana M." },
      {
        status: "resolved",
        at: "2026-10-04T10:00:00Z",
        by: "core@konnevo.test",
        note: "Club fixed the link",
      },
    ],
  },
  {
    id: "rep-4",
    createdAt: "2026-10-07T14:22:00Z",
    type: "user",
    target: "Deleted user",
    targetSummary: null,
    reason: "Unwanted messages in invites",
    status: "open",
    reporter: "Kiran P.",
    history: [{ status: "open", at: "2026-10-07T14:22:00Z", by: "Kiran P." }],
  },
  {
    id: "rep-5",
    createdAt: "2026-10-05T10:00:00Z",
    type: "project",
    target: "CampusCart",
    targetSummary: "Project on a student profile",
    reason: "Copied from another repository",
    status: "dismissed",
    reporter: null,
    history: [
      { status: "open", at: "2026-10-05T10:00:00Z", by: "Deleted user" },
      {
        status: "dismissed",
        at: "2026-10-06T09:30:00Z",
        by: "core@konnevo.test",
        note: "Original work, checked history",
      },
    ],
  },
  {
    id: "rep-6",
    createdAt: "2026-10-10T08:15:00Z",
    type: "project",
    target: "Smart Attendance",
    targetSummary: "Project on a student profile",
    reason: "Offensive description",
    status: "open",
    reporter: "Dev S.",
    history: [{ status: "open", at: "2026-10-10T08:15:00Z", by: "Dev S." }],
  },
];

export const audit: MockAudit[] = [
  ["2026-10-20T10:02:00Z", "core@konnevo.test", "admin_added", "tech@college.edu → Tech Club"],
  ["2026-10-20T10:05:00Z", "core@konnevo.test", "admin_added", "ai@techuni.edu → AI Club"],
  ["2026-10-21T08:40:00Z", "core@konnevo.test", "events_exported", "41 events"],
  ["2026-10-22T12:10:00Z", "backup@konnevo.test", "report_status_updated", "Report rep-3 → resolved"],
  ["2026-10-22T12:45:00Z", "backup@konnevo.test", "admin_removed", "old@city.edu from Startup Cell"],
  ["2026-10-22T12:46:00Z", "backup@konnevo.test", "admin_added", "cell@city.edu → Startup Cell"],
  ["2026-10-23T09:00:00Z", "core@konnevo.test", "report_status_updated", "Report rep-5 → dismissed"],
  [
    "2026-10-23T09:30:00Z",
    "core@konnevo.test",
    "colleges_merged",
    "Sample College → Sample College, Bengaluru",
  ],
  ["2026-10-24T15:20:00Z", "core@konnevo.test", "events_exported", "12 events"],
  ["2026-10-24T16:00:00Z", "core@konnevo.test", "report_status_updated", "Report rep-2 → reviewing"],
].map(([at, actor, action, target], i) => ({
  id: `aud-${i + 1}`,
  at,
  actor,
  action: action as AuditAction,
  target,
}));

let counter = 100;
export function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

export const collegeById = (id: string) => colleges.find((college) => college.id === id);
export const clubById = (id: string) => clubs.find((club) => club.id === id);
export const collegeName = (clubId: string) => collegeById(clubById(clubId)?.collegeId ?? "")?.name ?? "";
