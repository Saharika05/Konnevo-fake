"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/api/types";
import { PROFILE_KEY } from "@/lib/onboarding";
import { ME_KEY } from "@/lib/session";
import { validateImage } from "@/lib/schemas/files";
import { profileService } from "@/lib/services/profile";
import { showServerError } from "@/lib/form-errors";
import { ProfileAvatar } from "@/components/profile-avatar";
import { StepFooter, type StepProps } from "@/components/onboarding/parts";
import { Input } from "@/components/ui/input";

export function StepPhoto({ profile, onDone, editing }: StepProps & { profile: Profile }) {
  const queryClient = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: (chosen: File) => profileService.uploadPhoto(chosen),
    onSuccess: ({ photoUrl }) => {
      queryClient.setQueryData(PROFILE_KEY, (old: { profile: Profile } | undefined) =>
        old ? { profile: { ...old.profile, photoUrl } } : old,
      );
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
      onDone();
    },
    onError: (err) =>
      setError(showServerError(err, undefined, { inlineCodes: [] }) ?? "Could not upload the photo."),
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    const problem = validateImage(chosen);
    setError(problem);
    setFile(problem ? null : chosen);
    if (problem) setPreview(null);
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (file) mutation.mutate(file);
        else onDone();
      }}
    >
      <div className="flex items-center gap-5">
        <ProfileAvatar
          name={profile.name}
          photoUrl={preview ?? profile.photoUrl}
          className="h-24 w-24 text-3xl"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor="photo" className="mb-1 block text-xs font-semibold text-muted">
            Choose a photo
          </label>
          <Input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="h-auto py-2"
            aria-describedby={error ? "photo-error" : "photo-hint"}
            onChange={handleChange}
          />
          {error ? (
            <p id="photo-error" role="alert" className="mt-1 text-xs text-danger-text">
              {error}
            </p>
          ) : (
            <p id="photo-hint" className="mt-1 text-xs text-muted">
              JPG, PNG or WebP, up to 5 MB.
            </p>
          )}
        </div>
      </div>
      <StepFooter
        step={2}
        editing={editing}
        saving={mutation.isPending}
        onSkip={onDone}
        saveLabel={file ? undefined : editing ? "Save" : "Continue"}
      />
    </form>
  );
}
