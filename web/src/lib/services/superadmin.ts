import { request, requestBlob } from "@/lib/api/client";
import {
  auditPageSchema,
  clubsPageSchema,
  collegesPageSchema,
  coreEventDetailSchema,
  coreEventsPageSchema,
  mergeResultSchema,
  analyticsSchema,
  overviewSchema,
  reportDetailSchema,
  reportsPageSchema,
  type AddAdminInput,
  type AnalyticsFilters,
  type AuditFilters,
  type EventFilters,
  type ReportFilters,
  type ReportUpdateInput,
} from "@/lib/core/schemas";

/** NEW in v3.1: the Core admin API. Every call sends the session cookie; the server rejects anyone who is not core. */
const BASE = "/api/superadmin";

function eventQuery(filters: EventFilters) {
  return {
    q: filters.q,
    college: filters.college,
    club: filters.club,
    type: filters.type,
    mode: filters.mode,
    from: filters.from,
    to: filters.to,
  };
}

export const superadminService = {
  async overview() {
    return overviewSchema.parse(await request(`${BASE}/overview`));
  },

  async analytics(filters: AnalyticsFilters) {
    return analyticsSchema.parse(
      await request(`${BASE}/analytics`, {
        query: { weeks: filters.weeks, college: filters.college, type: filters.type },
      }),
    );
  },

  async events(filters: EventFilters) {
    return coreEventsPageSchema.parse(
      await request(`${BASE}/events`, { query: { ...eventQuery(filters), page: filters.page ?? 1 } }),
    );
  },

  /** The CSV of the current filters (no page). Counts only, no personal data. */
  exportEvents(filters: EventFilters) {
    return requestBlob(`${BASE}/events/export`, eventQuery(filters));
  },

  async event(id: string) {
    return coreEventDetailSchema.parse(await request(`${BASE}/events/${encodeURIComponent(id)}`));
  },

  async reports(filters: ReportFilters) {
    return reportsPageSchema.parse(
      await request(`${BASE}/reports`, {
        query: { type: filters.type, status: filters.status, page: filters.page ?? 1 },
      }),
    );
  },

  async report(id: string) {
    return reportDetailSchema.parse(await request(`${BASE}/reports/${encodeURIComponent(id)}`));
  },

  async updateReport(id: string, input: ReportUpdateInput) {
    return reportDetailSchema.parse(
      await request(`${BASE}/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
    );
  },

  async clubs(page = 1, pageSize = 10) {
    return clubsPageSchema.parse(await request(`${BASE}/clubs`, { query: { page, pageSize } }));
  },

  /** 409 `club_has_admin` when the club already has an admin. */
  addAdmin(input: AddAdminInput) {
    return request<{ id: string }>(`${BASE}/admins`, { method: "POST", body: input });
  },

  /** The person goes back to a normal student. The club and its events stay. */
  removeAdmin(id: string) {
    return request<void>(`${BASE}/admins/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async colleges(page = 1, pageSize = 10) {
    return collegesPageSchema.parse(await request(`${BASE}/colleges`, { query: { page, pageSize } }));
  },

  async mergeColleges(input: { keepId: string; mergeIds: string[] }) {
    return mergeResultSchema.parse(await request(`${BASE}/colleges/merge`, { method: "POST", body: input }));
  },

  async audit(filters: AuditFilters) {
    return auditPageSchema.parse(
      await request(`${BASE}/audit`, {
        query: {
          actor: filters.actor,
          action: filters.action,
          from: filters.from,
          to: filters.to,
          page: filters.page ?? 1,
        },
      }),
    );
  },
};
