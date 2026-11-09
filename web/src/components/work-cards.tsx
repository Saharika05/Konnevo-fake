"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { Experience, Project } from "@/lib/api/types";
import { formatMonth } from "@/lib/format";
import { EXPERIENCE_TYPES } from "@/lib/schemas/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Actions = { onEdit: () => void; onDelete: () => void };

function CardActions({ onEdit, onDelete, name }: Actions & { name: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button size="sm" variant="ghost" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit<span className="sr-only"> {name}</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete} className="text-danger-text">
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete<span className="sr-only"> {name}</span>
      </Button>
    </div>
  );
}

export function ProjectCard({ project, onEdit, onDelete }: { project: Project } & Actions) {
  return (
    <li className="rounded-2xl border border-border bg-surface/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{project.title}</h3>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-text hover:underline"
            >
              Open project <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
        <CardActions onEdit={onEdit} onDelete={onDelete} name={project.title} />
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-muted">{project.description}</p>
      {project.techTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.techTags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
      {project.imageUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {project.imageUrls.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={url}
              alt={`${project.title} screenshot ${index + 1}`}
              className="aspect-video w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </li>
  );
}

export function dateSpan(entry: Experience): string {
  const start = formatMonth(entry.startMonth);
  return entry.endMonth
    ? entry.endMonth === entry.startMonth
      ? start
      : `${start} – ${formatMonth(entry.endMonth)}`
    : `${start} – Present`;
}

export function ExperienceCard({ entry, onEdit, onDelete }: { entry: Experience } & Partial<Actions>) {
  const typeLabel = EXPERIENCE_TYPES.find((item) => item.value === entry.type)?.label ?? entry.type;
  return (
    <li className="rounded-2xl border border-border bg-surface/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="info">{typeLabel}</Badge>
          <h3 className="mt-2 text-lg font-bold">{entry.title}</h3>
          <p className="text-sm text-muted">
            {entry.organisation} · {dateSpan(entry)}
          </p>
        </div>
        {onEdit && onDelete && <CardActions onEdit={onEdit} onDelete={onDelete} name={entry.title} />}
      </div>
      {entry.description && (
        <p className="mt-2 whitespace-pre-line text-sm text-muted">{entry.description}</p>
      )}
    </li>
  );
}
