import { request } from "@/lib/api/client";
import type { AdminOverview, EventInput, EventItem } from "@/lib/api/types";

function toForm(input: EventInput): FormData {
  const form = new FormData();
  form.append("title", input.title);
  form.append("type", input.type);
  form.append("mode", input.mode);
  form.append("start_date", input.startDate);
  if (input.endDate) form.append("end_date", input.endDate);
  form.append("place", input.place);
  form.append("registration_url", input.registrationUrl);
  form.append("description", input.description);
  if (input.poster) form.append("poster", input.poster);
  return form;
}

export const adminService = {
  overview() {
    return request<AdminOverview>("/api/admin/overview");
  },

  resolveReport(id: string) {
    return request<void>(`/api/admin/reports/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status: "resolved" },
    });
  },

  /** Events publish at once. There is no approval step. */
  createEvent(input: EventInput) {
    return request<{ event: EventItem }>("/api/admin/events", { method: "POST", formData: toForm(input) });
  },

  updateEvent(id: string, input: EventInput) {
    return request<{ event: EventItem }>(`/api/admin/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      formData: toForm(input),
    });
  },

  deleteEvent(id: string) {
    return request<void>(`/api/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
