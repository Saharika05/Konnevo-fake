import { request } from "@/lib/api/client";
import type { MatchItem, TeamInput, TeamsResponse, Team } from "@/lib/api/types";

export const teamsService = {
  /** My teams and my pending invites. */
  list() {
    return request<TeamsResponse>("/api/teams");
  },

  create(input: TeamInput) {
    return request<{ team: Team }>("/api/teams", {
      method: "POST",
      body: {
        name: input.name,
        event_id: input.eventId,
        my_role: input.myRole,
        member_ids: input.memberIds,
      },
    });
  },

  /** Rename the team or change my role. */
  update(id: string, input: { name?: string; myRole?: string }) {
    return request<{ team: Team }>(`/api/teams/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name: input.name, my_role: input.myRole },
    });
  },

  respond(id: string, accept: boolean) {
    return request<{ team?: Team }>(`/api/teams/${encodeURIComponent(id)}/respond`, {
      method: "POST",
      body: { accept },
    });
  },

  matches() {
    return request<{ matches: MatchItem[] }>("/api/matches");
  },

  removeMatch(id: string) {
    return request<void>(`/api/matches/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
