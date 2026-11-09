import { request } from "@/lib/api/client";
import type {
  EventItem,
  EventListResponse,
  PeopleResponse,
  PersonResponse,
  SuggestedResponse,
} from "@/lib/api/types";

export type EventFilters = {
  q?: string;
  type?: string[];
  mode?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const EVENTS_PAGE_SIZE = 12;
export const PEOPLE_PAGE_SIZE = 20;

export const eventsService = {
  /** Upcoming events for the Home page. Expired events are never returned. */
  home() {
    return request<{ events: EventItem[] }>("/api/events/home");
  },

  /** The Events page. 12 per page, with a cursor for "Load more". */
  list(filters: EventFilters, cursor?: string) {
    return request<EventListResponse>("/api/events", {
      query: {
        q: filters.q,
        type: filters.type,
        mode: filters.mode,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        cursor,
        limit: EVENTS_PAGE_SIZE,
      },
    });
  },

  /** Called when a student taps Register. Counts the click for the Core numbers. The link opens either way. */
  registerClick(id: string) {
    return request<void>(`/api/events/${encodeURIComponent(id)}/register-click`, { method: "POST" });
  },

  get(id: string) {
    return request<{ event: EventItem }>(`/api/events/${encodeURIComponent(id)}`);
  },

  /** Mark or unmark "I'm interested". */
  setInterested(id: string, interested: boolean) {
    return request<{ event: EventItem }>(`/api/events/${encodeURIComponent(id)}/interested`, {
      method: interested ? "POST" : "DELETE",
    });
  },

  /** Students only. 20 per page. */
  people(id: string, cursor?: string) {
    return request<PeopleResponse>(`/api/events/${encodeURIComponent(id)}/people`, {
      query: { cursor, limit: PEOPLE_PAGE_SIZE },
    });
  },

  /** Students only. */
  suggested(id: string) {
    return request<SuggestedResponse>(`/api/events/${encodeURIComponent(id)}/suggested`);
  },

  /** One person for the swipe screen, with "why you match" and the position in the list. */
  person(eventId: string, userId: string) {
    return request<PersonResponse>(
      `/api/events/${encodeURIComponent(eventId)}/people/${encodeURIComponent(userId)}`,
    );
  },
};
