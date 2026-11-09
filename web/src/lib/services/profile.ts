import { request } from "@/lib/api/client";
import type { Privacy, Profile, ProfileUpdate, SkillCatalog, SkillSelection } from "@/lib/api/types";

export const profileService = {
  me() {
    return request<{ profile: Profile }>("/api/profile/me");
  },

  update(patch: ProfileUpdate) {
    return request<{ profile: Profile }>("/api/profile/me", { method: "PATCH", body: patch });
  },

  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("photo", file);
    return request<{ photoUrl: string }>("/api/profile/photo", { method: "POST", formData });
  },

  /** Free typing with suggestions. Never a dropdown. */
  suggestColleges(q: string) {
    return request<{ colleges: string[] }>("/api/colleges/suggest", { query: { q } });
  },

  skillCatalog() {
    return request<SkillCatalog>("/api/skills");
  },

  saveSkills(selection: SkillSelection) {
    return request<void>("/api/profile/skills", { method: "PUT", body: selection });
  },

  privacy() {
    return request<{ privacy: Privacy }>("/api/profile/privacy");
  },

  updatePrivacy(patch: Partial<Privacy>) {
    return request<{ privacy: Privacy }>("/api/profile/privacy", { method: "PATCH", body: patch });
  },

  /** Finishes onboarding. */
  complete() {
    return request<void>("/api/profile/complete", { method: "POST" });
  },
};
