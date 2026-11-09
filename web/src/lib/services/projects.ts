import { request } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

export type NewProject = {
  title: string;
  description: string;
  techTags: string[];
  link?: string;
  images: File[];
};

export type ProjectChanges = NewProject & {
  /** Positions of the saved images to remove. */
  removeImageIndexes: number[];
};

function toFormData(input: NewProject): FormData {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("description", input.description);
  input.techTags.forEach((tag) => formData.append("techTags", tag));
  formData.append("link", input.link ?? "");
  input.images.forEach((file) => formData.append("images", file));
  return formData;
}

export const projectsService = {
  list() {
    return request<{ projects: Project[] }>("/api/projects");
  },

  create(input: NewProject) {
    return request<{ project: Project }>("/api/projects", { method: "POST", formData: toFormData(input) });
  },

  update(id: string, input: ProjectChanges) {
    const formData = toFormData(input);
    input.removeImageIndexes.forEach((index) => formData.append("removeImageIndexes", String(index)));
    return request<{ project: Project }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      formData,
    });
  },

  remove(id: string) {
    return request<void>(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
