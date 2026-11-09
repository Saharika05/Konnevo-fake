"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Project } from "@/lib/api/types";
import { PROJECTS_KEY } from "@/lib/onboarding";
import { duplicateMessage, findDuplicateProject, projectKey } from "@/lib/projects";
import { validateImage } from "@/lib/schemas/files";
import { projectSchema, splitTags, type ProjectValues } from "@/lib/schemas/profile";
import { projectsService } from "@/lib/services/projects";
import { showServerError } from "@/lib/form-errors";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_IMAGES = 3;

/**
 * The project form. With `project` it edits that project, otherwise it adds a new one.
 * Used in onboarding step 5 and on My Work.
 */
export function ProjectForm({
  project,
  onSaved,
  onCancel,
}: {
  project?: Project;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [images, setImages] = React.useState<File[]>([]);
  const [removed, setRemoved] = React.useState<number[]>([]);
  const [imageError, setImageError] = React.useState<string | null>(null);

  const saved = project?.imageUrls ?? [];
  const keptCount = saved.length - removed.length;

  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      techTags: project?.techTags.join(", ") ?? "",
      link: project?.link ?? "",
    },
  });
  const { errors } = form.formState;
  const descriptionLength = form.watch("description").length;

  // The projects the person already has, so a duplicate is caught before anything is sent.
  const existing = useQuery({ queryKey: PROJECTS_KEY, queryFn: projectsService.list });

  const mutation = useMutation({
    mutationFn: (values: ProjectValues) => {
      const input = {
        title: values.title,
        description: values.description,
        techTags: splitTags(values.techTags),
        link: values.link || undefined,
        images,
      };
      return project
        ? projectsService.update(project.id, { ...input, removeImageIndexes: removed })
        : projectsService.create(input);
    },
    onSuccess: () => {
      toast.success(project ? "Project updated" : "Project added");
      void queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      if (!project) {
        form.reset();
        setImages([]);
      }
      onSaved();
    },
    onError: (error) => {
      const message = showServerError(error, form.setError, { inlineCodes: [] });
      if (message) setImageError(message);
    },
  });

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []) as File[];
    event.target.value = "";
    if (chosen.length === 0) return;
    if (keptCount + images.length + chosen.length > MAX_IMAGES) {
      setImageError(`You can have up to ${MAX_IMAGES} images.`);
      return;
    }
    const problem = chosen.map(validateImage).find(Boolean) ?? null;
    setImageError(problem);
    if (!problem) setImages([...images, ...chosen]);
  }

  return (
    <form
      noValidate
      className="space-y-4 rounded-2xl border border-border bg-surface p-5"
      onSubmit={form.handleSubmit((values) => {
        const duplicate = findDuplicateProject(
          existing.data?.projects ?? [],
          { title: values.title, link: values.link },
          project?.id,
        );
        if (duplicate) {
          const sameTitle = projectKey(duplicate.title) === projectKey(values.title);
          form.setError(sameTitle ? "title" : "link", {
            type: "duplicate",
            message: duplicateMessage(duplicate, !sameTitle),
          });
          return;
        }
        mutation.mutate(values);
      })}
    >
      <FormField id="project-title" label="Project title" error={errors.title?.message}>
        <Input
          id="project-title"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "project-title-error" : undefined}
          {...form.register("title")}
        />
      </FormField>
      <FormField
        id="project-description"
        label={`What is it? (${descriptionLength}/500)`}
        error={errors.description?.message}
      >
        <Textarea
          id="project-description"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "project-description-error" : undefined}
          {...form.register("description")}
        />
      </FormField>
      <FormField
        id="project-tags"
        label="Tech tags"
        error={errors.techTags?.message}
        hint="Separate with commas, for example: React, Node.js"
      >
        <Input
          id="project-tags"
          aria-invalid={errors.techTags ? true : undefined}
          aria-describedby={errors.techTags ? "project-tags-error" : undefined}
          {...form.register("techTags")}
        />
      </FormField>
      <FormField id="project-link" label="Link (optional)" error={errors.link?.message}>
        <Input
          id="project-link"
          type="url"
          inputMode="url"
          placeholder="https://github.com/you/project"
          aria-invalid={errors.link ? true : undefined}
          aria-describedby={errors.link ? "project-link-error" : undefined}
          {...form.register("link")}
        />
      </FormField>

      <div>
        <label htmlFor="project-images" className="mb-1 block text-xs font-semibold text-muted">
          Screenshots (up to {MAX_IMAGES})
        </label>
        {saved.length > 0 && (
          <ul className="mb-2 grid grid-cols-3 gap-2">
            {saved.map((url, index) =>
              removed.includes(index) ? null : (
                <li key={index} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Saved screenshot ${index + 1}`}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 cursor-pointer rounded bg-deep-olive px-1.5 py-0.5 text-xs font-semibold text-soft-white"
                    onClick={() => setRemoved([...removed, index])}
                  >
                    Remove<span className="sr-only"> screenshot {index + 1}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
        <Input
          id="project-images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="h-auto py-2"
          disabled={keptCount + images.length >= MAX_IMAGES}
          aria-describedby={imageError ? "project-images-error" : undefined}
          onChange={handleImages}
        />
        {imageError && (
          <p id="project-images-error" role="alert" className="mt-1 text-xs text-danger-text">
            {imageError}
          </p>
        )}
        {images.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {images.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  className="cursor-pointer font-semibold text-primary-text hover:underline"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : project ? "Save changes" : "Add project"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
