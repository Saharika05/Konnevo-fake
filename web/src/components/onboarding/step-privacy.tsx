"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Privacy } from "@/lib/api/types";
import { PRIVACY_KEY } from "@/lib/onboarding";
import { profileService } from "@/lib/services/profile";
import { showServerError } from "@/lib/form-errors";
import { StepFooter, type StepProps } from "@/components/onboarding/parts";
import { Switch } from "@/components/ui/switch";

export const PRIVACY_OPTIONS: { key: keyof Privacy; label: string; help: string }[] = [
  {
    key: "showMeToOthers",
    label: "Show me to others for matching",
    help: "People interested in the same events can find you and slide to match. Turn it off and nobody can match with you.",
  },
  { key: "showCollege", label: "Show my college", help: "Visible on your profile to other students." },
  {
    key: "showSkills",
    label: "Show my skills and interests",
    help: "They also power the 'why you match' lines.",
  },
  { key: "showLinkedin", label: "Show my LinkedIn link", help: "Matches can open it from the match popup." },
  { key: "showGithub", label: "Show my GitHub link", help: "Matches can open it from the match popup." },
  { key: "hideProfile", label: "Hide my profile", help: "Only you can see your profile page." },
];

export function StepPrivacy({ onDone, editing }: StepProps) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PRIVACY_KEY,
    queryFn: profileService.privacy,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const [draft, setDraft] = React.useState<Privacy | null>(null);
  const values = draft ?? query.data?.privacy ?? null;

  const mutation = useMutation({
    mutationFn: (privacy: Privacy) => profileService.updatePrivacy(privacy),
    onSuccess: (data) => {
      queryClient.setQueryData(PRIVACY_KEY, data);
      onDone();
    },
    onError: (error) => showServerError(error),
  });

  if (query.isPending) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" aria-busy="true" />
    );
  }
  if (query.isError || !values) {
    return (
      <p className="text-sm text-danger-text">
        Could not load your privacy choices. Please refresh the page.
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(values);
      }}
    >
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {PRIVACY_OPTIONS.map((option) => (
          <li key={option.key} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p id={`privacy-${option.key}`} className="text-sm font-bold">
                {option.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{option.help}</p>
            </div>
            <Switch
              aria-labelledby={`privacy-${option.key}`}
              checked={values[option.key]}
              onCheckedChange={(checked) => setDraft({ ...values, [option.key]: checked })}
            />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">You can change all of these later in Settings.</p>
      <StepFooter step={6} editing={editing} saving={mutation.isPending} />
    </form>
  );
}
