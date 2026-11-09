"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile } from "@/lib/api/types";
import { PROJECTS_KEY } from "@/lib/onboarding";
import { ME_KEY } from "@/lib/session";
import { YEARS } from "@/lib/schemas/profile";
import { profileService } from "@/lib/services/profile";
import { projectsService } from "@/lib/services/projects";
import { showServerError } from "@/lib/form-errors";
import { ProfileAvatar } from "@/components/profile-avatar";
import { StepFooter, type StepProps } from "@/components/onboarding/parts";

export function StepReview({ profile, onDone }: StepProps & { profile: Profile }) {
  const queryClient = useQueryClient();
  const projects = useQuery({ queryKey: PROJECTS_KEY, queryFn: projectsService.list });

  const mutation = useMutation({
    mutationFn: profileService.complete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_KEY });
      toast.success("You are all set. Welcome to konnevo!");
      onDone();
    },
    onError: (error) => showServerError(error),
  });

  const year = YEARS.find((item) => item.value === profile.year)?.label ?? "Not set";
  const skillCount = profile.skills.length + profile.interests.length + profile.customSkills.length;

  const rows: [string, string][] = [
    ["College", profile.college || "Not set"],
    ["Year", year],
    ["Looking for", profile.lookingFor.join(", ") || "Not set"],
    ["Skills and interests", `${skillCount} picked`],
    ["Projects", projects.data ? `${projects.data.projects.length} added` : "..."],
    ["GitHub", profile.github || "Not added"],
    ["LinkedIn", profile.linkedin || "Not added"],
  ];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <ProfileAvatar name={profile.name} photoUrl={profile.photoUrl} className="h-16 w-16 text-2xl" />
        <div className="min-w-0">
          <p className="text-lg font-bold">{profile.name}</p>
          {profile.bio && <p className="line-clamp-2 text-sm text-muted">{profile.bio}</p>}
        </div>
      </div>
      <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-5 py-3 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0 truncate text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <StepFooter step={7} editing={false} saving={mutation.isPending} saveLabel="Finish and find events" />
    </form>
  );
}
