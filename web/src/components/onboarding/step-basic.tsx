"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/api/types";
import { PROFILE_KEY } from "@/lib/onboarding";
import { ME_KEY } from "@/lib/session";
import { LOOKING_FOR, YEARS, basicSchema, type BasicValues } from "@/lib/schemas/profile";
import { profileService } from "@/lib/services/profile";
import { showServerError } from "@/lib/form-errors";
import { CollegeField } from "@/components/college-field";
import { FormField } from "@/components/form-field";
import { Chip, StepFooter, type StepProps } from "@/components/onboarding/parts";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function StepBasic({ profile, onDone, editing }: StepProps & { profile: Profile }) {
  const queryClient = useQueryClient();
  const form = useForm<BasicValues>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      name: profile.name,
      college: profile.college,
      year: profile.year as BasicValues["year"],
      lookingFor: profile.lookingFor,
      bio: profile.bio,
    },
  });
  const { errors } = form.formState;
  const bioLength = form.watch("bio").length;

  const mutation = useMutation({
    mutationFn: (values: BasicValues) => profileService.update(values),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY, data);
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
      onDone();
    },
    onError: (error) => showServerError(error, form.setError),
  });

  return (
    <form noValidate className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormField id="name" label="Your name" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...form.register("name")}
        />
      </FormField>

      <FormField
        id="college"
        label="College"
        error={errors.college?.message}
        hint="Pick from the list with the arrow, or type to search. Not listed? Add it as a new college."
      >
        <Controller
          control={form.control}
          name="college"
          render={({ field }) => (
            <CollegeField
              id="college"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.college}
              describedBy={errors.college ? "college-error" : undefined}
            />
          )}
        />
      </FormField>

      <FormField id="year" label="Year" error={errors.year?.message}>
        <Select
          id="year"
          aria-invalid={errors.year ? true : undefined}
          aria-describedby={errors.year ? "year-error" : undefined}
          {...form.register("year")}
        >
          <option value="">Pick your year</option>
          {YEARS.map((year) => (
            <option key={year.value} value={year.value}>
              {year.label}
            </option>
          ))}
        </Select>
      </FormField>

      <div>
        <p id="looking-label" className="mb-1 block text-xs font-semibold text-muted">
          I am looking for
        </p>
        <Controller
          control={form.control}
          name="lookingFor"
          render={({ field }) => (
            <div role="group" aria-labelledby="looking-label" className="flex flex-wrap gap-2">
              {LOOKING_FOR.map((option) => {
                const selected = field.value.includes(option.value);
                return (
                  <Chip
                    key={option.value}
                    selected={selected}
                    onClick={() =>
                      field.onChange(
                        selected
                          ? field.value.filter((v) => v !== option.value)
                          : [...field.value, option.value],
                      )
                    }
                  >
                    {option.label}
                  </Chip>
                );
              })}
            </div>
          )}
        />
        {errors.lookingFor && (
          <p role="alert" className="mt-1 text-xs text-danger-text">
            {errors.lookingFor.message}
          </p>
        )}
      </div>

      <FormField id="bio" label={`Short bio (${bioLength}/300)`} error={errors.bio?.message}>
        <Textarea
          id="bio"
          placeholder="One or two lines about what you build."
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby={errors.bio ? "bio-error" : undefined}
          {...form.register("bio")}
        />
      </FormField>

      <StepFooter step={1} editing={editing} saving={mutation.isPending} />
    </form>
  );
}
