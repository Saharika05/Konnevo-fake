import { z } from "zod";

/**
 * Core admin: response shapes (checked at runtime) and form shapes.
 * NEW in v3.1: everything under /api/superadmin.
 */

export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };

// ---- Audit ----
export const AUDIT_ACTIONS = [
  "admin_added",
  "admin_removed",
  "colleges_merged",
  "report_status_updated",
  "events_exported",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  admin_added: "Added club admin",
  admin_removed: "Removed club admin",
  colleges_merged: "Merged colleges",
  report_status_updated: "Updated report status",
  events_exported: "Exported events CSV",
};

export const auditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.string(),
  action: z.enum(AUDIT_ACTIONS),
  target: z.string(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;
export const auditPageSchema = pageOf(auditEntrySchema);

// ---- Overview ----
export const overviewSchema = z.object({
  totals: z.object({
    users: z.number(),
    newUsersThisWeek: z.number(),
    profilesCompleted: z.number(),
    colleges: z.number(),
    clubs: z.number(),
    liveEvents: z.number(),
    interestedClicks: z.number(),
    registerClicks: z.number(),
    teamsFormed: z.number(),
    matches: z.number(),
    openReports: z.number(),
  }),
  topEvents: z.array(z.object({ id: z.string(), title: z.string(), interested: z.number() })),
  recentAudit: z.array(auditEntrySchema),
});
export type Overview = z.infer<typeof overviewSchema>;

const EVENT_TYPES_FOR_ANALYTICS = ["hackathon", "meetup", "conference", "workshop"] as const;

// ---- Analytics (dashboards) ----
export const ANALYTICS_WEEKS = [4, 8, 12] as const;
export type AnalyticsWeeks = (typeof ANALYTICS_WEEKS)[number];

export const analyticsSchema = z.object({
  filters: z.object({
    weeks: z.number().int(),
    college: z.string().nullable(),
    type: z.string().nullable(),
  }),
  /** Six headline numbers: this period against the period right before it. */
  kpis: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      unit: z.enum(["count", "percent"]),
      value: z.number(),
      previous: z.number(),
      spark: z.array(z.number()),
    }),
  ),
  /** One row per week, oldest first (the last `weeks` weeks). */
  trend: z.array(
    z.object({
      weekStart: z.string(),
      signups: z.number(),
      interested: z.number(),
      registerClicks: z.number(),
      matches: z.number(),
    }),
  ),
  /** All-time, for the events in scope. */
  funnel: z.array(z.object({ key: z.string(), label: z.string(), value: z.number() })),
  byType: z.array(
    z.object({
      type: z.enum(EVENT_TYPES_FOR_ANALYTICS),
      events: z.number(),
      interested: z.number(),
      registerClicks: z.number(),
    }),
  ),
  byMode: z.array(z.object({ mode: z.enum(["online", "offline"]), events: z.number(), interested: z.number() })),
  byCollege: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      students: z.number(),
      events: z.number(),
      interested: z.number(),
    }),
  ),
  heatmap: z.object({
    rows: z.array(z.object({ id: z.string(), name: z.string() })),
    cols: z.array(z.string()),
    cells: z.array(z.array(z.number())),
  }),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(EVENT_TYPES_FOR_ANALYTICS),
      interested: z.number(),
      registerClicks: z.number(),
      teams: z.number(),
    }),
  ),
  /** month is "YYYY-MM"; the screen turns it into "Oct 26". */
  monthly: z.array(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), events: z.number() })),
  reportsByStatus: z.array(z.object({ status: z.string(), count: z.number() })),
  clubCoverage: z.object({ withAdmin: z.number(), withoutAdmin: z.number() }),
});
export type Analytics = z.infer<typeof analyticsSchema>;
export type AnalyticsFilters = { weeks?: number; college?: string; type?: string };

// ---- Events ----
export const EVENT_TYPES = ["hackathon", "meetup", "conference", "workshop"] as const;
export const EVENT_MODES = ["online", "offline"] as const;

export const coreEventRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  club: z.string(),
  college: z.string(),
  type: z.enum(EVENT_TYPES),
  mode: z.enum(EVENT_MODES),
  startDate: z.string(),
  endDate: z.string().nullish(),
  interested: z.number(),
  registerClicks: z.number(),
  teams: z.number(),
});
export type CoreEventRow = z.infer<typeof coreEventRowSchema>;
export const coreEventsPageSchema = pageOf(coreEventRowSchema);

export const coreEventDetailSchema = coreEventRowSchema
  .omit({ interested: true, registerClicks: true, teams: true })
  .extend({
    place: z.string(),
    registrationUrl: z.string(),
    posterUrl: z.string().nullish(),
    funnel: z.object({
      interested: z.number(),
      registerClicks: z.number(),
      teams: z.number(),
      matches: z.number(),
    }),
  });
export type CoreEventDetail = z.infer<typeof coreEventDetailSchema>;

export type EventFilters = {
  q?: string;
  college?: string;
  club?: string;
  type?: string;
  mode?: string;
  from?: string;
  to?: string;
  page?: number;
};

// ---- Reports ----
export const REPORT_TYPES = ["event", "user", "project"] as const;
export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reportRowSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  type: z.enum(REPORT_TYPES),
  /** null when the target account or item was deleted. */
  target: z.string().nullable(),
  reason: z.string(),
  status: z.enum(REPORT_STATUSES),
  /** null when the reporter deleted their account. */
  reporter: z.string().nullable(),
});
export type ReportRow = z.infer<typeof reportRowSchema>;
export const reportsPageSchema = pageOf(reportRowSchema);

export const reportDetailSchema = reportRowSchema.extend({
  targetSummary: z.string().nullable(),
  history: z.array(
    z.object({
      status: z.enum(REPORT_STATUSES),
      at: z.string(),
      by: z.string(),
      note: z.string().nullish(),
    }),
  ),
});
export type ReportDetail = z.infer<typeof reportDetailSchema>;

export const reportUpdateSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  note: z.string().trim().max(500, "Keep the note under 500 characters").optional(),
});
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;

// ---- Clubs and admins ----
export const clubRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  college: z.string(),
  admin: z.object({ id: z.string(), email: z.string() }).nullable(),
  eventsCount: z.number(),
});
export type ClubRow = z.infer<typeof clubRowSchema>;
export const clubsPageSchema = pageOf(clubRowSchema);

export const addAdminFormSchema = z.object({
  clubId: z.string().min(1, "Choose a club"),
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address")
    .email("That does not look like an email address")
    .max(254, "That email is too long"),
});
export type AddAdminInput = z.infer<typeof addAdminFormSchema>;

// ---- Colleges ----
export const collegeRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameKey: z.string(),
  students: z.number(),
  clubs: z.number(),
  createdAt: z.string(),
});
export type CollegeRow = z.infer<typeof collegeRowSchema>;
export const collegesPageSchema = pageOf(collegeRowSchema);

export const mergeResultSchema = z.object({ studentsMoved: z.number(), clubsMoved: z.number() });
export type MergeResult = z.infer<typeof mergeResultSchema>;

export type AuditFilters = { actor?: string; action?: string; from?: string; to?: string; page?: number };
export type ReportFilters = { type?: string; status?: string; page?: number };
