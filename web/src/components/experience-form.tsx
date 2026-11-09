"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Experience } from "@/lib/api/types";
import { EXPERIENCE_KEY } from "@/lib/onboarding";
import { EXPERIENCE_TYPES, experienceSchema, type ExperienceValues } from "@/lib/schemas/profile";
import { experienceService } from "@/lib/services/experience";
import { showServerError } from "@/lib/form-errors";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** Add or edit one experience entry. "Organisation or event" is required. */
export function ExperienceForm({
  entry,
  onSaved,
  onCancel,
}: {
  entry?: Experience;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      type: entry?.type as ExperienceValues["type"],
      title: entry?.title ?? "",
      organisation: entry?.organisation ?? "",
      startMonth: entry?.startMonth ?? "",
      endMonth: entry?.endMonth ?? "",
      description: entry?.description ?? "",
    },
  });
  const { errors } = form.formState;
  const descriptionLength = form.watch("description").length;

  const mutation = useMutation({
    mutationFn: (values: ExperienceValues) => {
      const input = { ...values, endMonth: values.endMonth || undefined };
      return entry ? experienceService.update(entry.id, input) : experienceService.create(input);
    },
    onSuccess: () => {
      toast.success(entry ? "Experience updated" : "Experience added");
      void queryClient.invalidateQueries({ queryKey: EXPERIENCE_KEY });
      onSaved();
    },
    onError: (error) => showServerError(error, form.setError),
  });

  return (
    <form
      noValidate
      className="space-y-4 rounded-2xl border border-border bg-surface p-5"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="exp-type" label="Type" error={errors.type?.message}>
          <Select
            id="exp-type"
            aria-invalid={errors.type ? true : undefined}
            aria-describedby={errors.type ? "exp-type-error" : undefined}
            {...form.register("type")}
          >
            <option value="">Pick a type</option>
            {EXPERIENCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="exp-title" label="What you did" error={errors.title?.message}>
          <Input
            id="exp-title"
            placeholder="For example: Backend developer"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "exp-title-error" : undefined}
            {...form.register("title")}
          />
        </FormField>
      </div>
      <FormField id="exp-org" label="Organisation or event" error={errors.organisation?.message}>
        <Input
          id="exp-org"
          placeholder="For example: HackFest 2026"
          aria-invalid={errors.organisation ? true : undefined}
          aria-describedby={errors.organisation ? "exp-org-error" : undefined}
          {...form.register("organisation")}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="exp-start" label="Start" error={errors.startMonth?.message}>
          <Input
            id="exp-start"
            type="month"
            aria-invalid={errors.startMonth ? true : undefined}
            aria-describedby={errors.startMonth ? "exp-start-error" : undefined}
            {...form.register("startMonth")}
          />
        </FormField>
        <FormField id="exp-end" label="End (leave empty if ongoing)" error={errors.endMonth?.message}>
          <Input
            id="exp-end"
            type="month"
            aria-invalid={errors.endMonth ? true : undefined}
            aria-describedby={errors.endMonth ? "exp-end-error" : undefined}
            {...form.register("endMonth")}
          />
        </FormField>
      </div>
      <FormField
        id="exp-desc"
        label={`Description (${descriptionLength}/500)`}
        error={errors.description?.message}
      >
        <Textarea
          id="exp-desc"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "exp-desc-error" : undefined}
          {...form.register("description")}
        />
      </FormField>
      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : entry ? "Save changes" : "Add experience"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
