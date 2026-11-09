"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/api/types";
import { PROFILE_KEY } from "@/lib/onboarding";
import { linksSchema, type LinksValues } from "@/lib/schemas/profile";
import { profileService } from "@/lib/services/profile";
import { showServerError } from "@/lib/form-errors";
import { FormField } from "@/components/form-field";
import { StepFooter, type StepProps } from "@/components/onboarding/parts";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function StepLinks({ profile, onDone, editing }: StepProps & { profile: Profile }) {
  const queryClient = useQueryClient();
  const form = useForm<LinksValues>({
    resolver: zodResolver(linksSchema),
    defaultValues: {
      github: profile.github,
      linkedin: profile.linkedin,
      portfolio: profile.portfolio ?? "",
      discord: profile.discord ?? "",
      whatsapp: profile.whatsapp ?? "",
      about: profile.about,
    },
  });
  const { errors } = form.formState;
  const aboutLength = form.watch("about").length;

  const mutation = useMutation({
    mutationFn: (values: LinksValues) => profileService.update(values),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY, data);
      onDone();
    },
    onError: (error) => showServerError(error, form.setError),
  });

  const skip = () => onDone();

  return (
    <form noValidate className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FormField id="github" label="GitHub (optional)" error={errors.github?.message}>
        <Input
          id="github"
          type="url"
          inputMode="url"
          placeholder="https://github.com/your-name"
          aria-invalid={errors.github ? true : undefined}
          aria-describedby={errors.github ? "github-error" : undefined}
          {...form.register("github")}
        />
      </FormField>
      <FormField
        id="linkedin"
        label="LinkedIn (optional)"
        error={errors.linkedin?.message}
        hint="Only a link. konnevo never reads your LinkedIn."
      >
        <Input
          id="linkedin"
          type="url"
          inputMode="url"
          placeholder="https://linkedin.com/in/your-name"
          aria-invalid={errors.linkedin ? true : undefined}
          aria-describedby={errors.linkedin ? "linkedin-error" : undefined}
          {...form.register("linkedin")}
        />
      </FormField>
      <FormField id="portfolio" label="Portfolio or website (optional)" error={errors.portfolio?.message}>
        <Input
          id="portfolio"
          type="url"
          inputMode="url"
          placeholder="https://your-name.dev"
          aria-invalid={errors.portfolio ? true : undefined}
          aria-describedby={errors.portfolio ? "portfolio-error" : undefined}
          {...form.register("portfolio")}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="discord" label="Discord (optional)" error={errors.discord?.message}>
          <Input
            id="discord"
            autoComplete="off"
            placeholder="your_username"
            aria-invalid={errors.discord ? true : undefined}
            aria-describedby={errors.discord ? "discord-error" : undefined}
            {...form.register("discord")}
          />
        </FormField>
        <FormField id="whatsapp" label="WhatsApp (optional)" error={errors.whatsapp?.message}>
          <Input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="+91 98765 43210"
            aria-invalid={errors.whatsapp ? true : undefined}
            aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
            {...form.register("whatsapp")}
          />
        </FormField>
      </div>
      <FormField id="about" label={`About you (${aboutLength}/1000)`} error={errors.about?.message}>
        <Textarea
          id="about"
          className="min-h-36"
          placeholder="What you have built, what you want to learn, what kind of teammate you are."
          aria-invalid={errors.about ? true : undefined}
          aria-describedby={errors.about ? "about-error" : undefined}
          {...form.register("about")}
        />
      </FormField>
      <StepFooter step={4} editing={editing} saving={mutation.isPending} onSkip={skip} />
    </form>
  );
}
