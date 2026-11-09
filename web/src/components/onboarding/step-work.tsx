"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PROJECTS_KEY } from "@/lib/onboarding";
import { projectsService } from "@/lib/services/projects";
import { ProjectForm } from "@/components/project-form";
import { StepFooter, type StepProps } from "@/components/onboarding/parts";
import { Button } from "@/components/ui/button";

export function StepWork({ onDone, editing }: StepProps) {
  const projects = useQuery({ queryKey: PROJECTS_KEY, queryFn: projectsService.list });
  const [adding, setAdding] = React.useState(false);
  const list = projects.data?.projects ?? [];

  return (
    <div>
      <p className="rounded-lg border border-border bg-warning-soft px-3 py-2 text-xs text-warning-text">
        Add real projects only. Misleading ones can be reported and removed.
      </p>

      {projects.isPending ? (
        <div
          className="mt-5 h-20 animate-pulse rounded-2xl border border-border bg-surface"
          aria-busy="true"
        />
      ) : projects.isError ? (
        <p className="mt-5 text-sm text-danger-text">
          Could not load your projects. Please refresh the page.
        </p>
      ) : (
        list.length > 0 && (
          <ul className="mt-5 space-y-3">
            {list.map((project) => (
              <li key={project.id} className="rounded-2xl border border-border bg-surface p-4">
                <p className="font-bold">{project.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
              </li>
            ))}
          </ul>
        )
      )}

      <div className="mt-5">
        {adding ? (
          <ProjectForm onSaved={() => setAdding(false)} onCancel={() => setAdding(false)} />
        ) : (
          <Button type="button" variant="outline" onClick={() => setAdding(true)}>
            {list.length > 0 ? "Add another project" : "Add a project"}
          </Button>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onDone();
        }}
      >
        <StepFooter
          step={5}
          editing={editing}
          saving={false}
          onSkip={onDone}
          saveLabel={editing ? "Done" : "Continue"}
        />
      </form>
    </div>
  );
}
