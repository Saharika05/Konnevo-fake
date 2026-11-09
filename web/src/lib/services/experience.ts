import { request } from "@/lib/api/client";
import type { Experience, ExperienceInput } from "@/lib/api/types";

export const experienceService = {
  list() {
    return request<{ experience: Experience[] }>("/api/experience");
  },

  create(input: ExperienceInput) {
    return request<{ experience: Experience }>("/api/experience", { method: "POST", body: input });
  },

  update(id: string, input: ExperienceInput) {
    return request<{ experience: Experience }>(`/api/experience/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: input,
    });
  },

  remove(id: string) {
    return request<void>(`/api/experience/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
