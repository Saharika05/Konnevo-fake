import type { Project } from "@/lib/api/types";

/** "Campus  Cart" and "campuscart " should count as the same project. */
export function projectKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function linkKey(link?: string): string {
  return (link ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/**
 * A project the person already has with the same title, or the same link.
 * `ignoreId` is the project being edited, so it does not match itself.
 */
export function findDuplicateProject(
  projects: Pick<Project, "id" | "title" | "link">[],
  input: { title: string; link?: string },
  ignoreId?: string,
) {
  const title = projectKey(input.title);
  const link = linkKey(input.link);
  return projects.find(
    (project) =>
      project.id !== ignoreId &&
      ((title !== "" && projectKey(project.title) === title) ||
        (link !== "" && linkKey(project.link) === link)),
  );
}

export function duplicateMessage(existing: { title: string }, sameLink: boolean): string {
  return sameLink
    ? `You already added a project with this link (“${existing.title}”).`
    : `You already have a project called “${existing.title}”. Edit that one instead.`;
}
