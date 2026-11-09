"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { toast } from "sonner";
import type { Experience, Project } from "@/lib/api/types";
import { friendlyMessage } from "@/lib/api/client";
import { EXPERIENCE_KEY, PROJECTS_KEY } from "@/lib/onboarding";
import { experienceService } from "@/lib/services/experience";
import { projectsService } from "@/lib/services/projects";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ExperienceForm } from "@/components/experience-form";
import { ProjectForm } from "@/components/project-form";
import { EmptyState, ErrorState } from "@/components/state-messages";
import { ExperienceCard, ProjectCard } from "@/components/work-cards";
import { Button } from "@/components/ui/button";

const TABS = ["projects", "experience"] as const;
const LABELS = { projects: "Projects", experience: "Experience" } as const;

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />
      ))}
    </div>
  );
}

function ProjectsTab() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: PROJECTS_KEY, queryFn: projectsService.list });
  // "new" shows the add form, an id shows the edit form for that project.
  const [editing, setEditing] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Project | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => projectsService.remove(id),
    onSuccess: () => {
      toast.success("Project deleted");
      void queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      setDeleting(null);
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });

  const list = query.data?.projects ?? [];

  return (
    <div>
      <p className="rounded-lg border border-border bg-warning-soft px-3 py-2 text-xs text-warning-text">
        Add real projects only. Misleading ones can be reported.
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Your projects</h2>
        {editing !== "new" && <Button onClick={() => setEditing("new")}>Add a project</Button>}
      </div>

      {editing === "new" && (
        <div className="mt-4">
          <ProjectForm onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="mt-5">
        {query.isPending ? (
          <ListSkeleton />
        ) : query.isError ? (
          <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />
        ) : list.length === 0 && editing !== "new" ? (
          <EmptyState
            title="No projects yet"
            action={<Button onClick={() => setEditing("new")}>Add your first project</Button>}
          >
            Show what you have built. A link and a screenshot or two make it stand out.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {list.map((project) =>
              editing === project.id ? (
                <li key={project.id}>
                  <ProjectForm
                    project={project}
                    onSaved={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => setEditing(project.id)}
                  onDelete={() => setDeleting(project)}
                />
              ),
            )}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this project?"
        description={`“${deleting?.title ?? ""}” will be removed from your profile. This cannot be undone.`}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function ExperienceTab() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: EXPERIENCE_KEY, queryFn: experienceService.list });
  const [editing, setEditing] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Experience | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => experienceService.remove(id),
    onSuccess: () => {
      toast.success("Experience deleted");
      void queryClient.invalidateQueries({ queryKey: EXPERIENCE_KEY });
      setDeleting(null);
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });

  const list = query.data?.experience ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Your experience</h2>
        {editing !== "new" && <Button onClick={() => setEditing("new")}>Add experience</Button>}
      </div>

      {editing === "new" && (
        <div className="mt-4">
          <ExperienceForm onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="mt-5">
        {query.isPending ? (
          <ListSkeleton />
        ) : query.isError ? (
          <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />
        ) : list.length === 0 && editing !== "new" ? (
          <EmptyState
            title="No experience yet"
            action={<Button onClick={() => setEditing("new")}>Add your first one</Button>}
          >
            Hackathons, internships and events you took part in all count.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {list.map((entry) =>
              editing === entry.id ? (
                <li key={entry.id}>
                  <ExperienceForm
                    entry={entry}
                    onSaved={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <ExperienceCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => setEditing(entry.id)}
                  onDelete={() => setDeleting(entry)}
                />
              ),
            )}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this experience?"
        description={`“${deleting?.title ?? ""}” at ${deleting?.organisation ?? ""} will be removed from your profile.`}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

/** My Work. The tab (projects or experience) lives in the web address. */
export function MyWorkView() {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("projects"));

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    void setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My Work</h1>
      <p className="mt-1 text-muted">What you have built and where you have been.</p>

      <div
        role="tablist"
        aria-label="My Work sections"
        className="mt-6 inline-flex max-w-full overflow-x-auto rounded-xl bg-subtle p-1"
      >
        {TABS.map((item, index) => (
          <button
            key={item}
            id={`tab-${item}`}
            role="tab"
            type="button"
            aria-selected={tab === item}
            aria-controls={`panel-${item}`}
            tabIndex={tab === item ? 0 : -1}
            onClick={() => void setTab(item)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "cursor-pointer rounded-lg px-4 py-2 text-sm sm:px-5 font-semibold transition-colors",
              tab === item ? "bg-surface text-foreground shadow" : "text-muted hover:text-foreground",
            )}
          >
            {LABELS[item]}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-8">
        {tab === "projects" ? <ProjectsTab /> : <ExperienceTab />}
      </div>
    </div>
  );
}
