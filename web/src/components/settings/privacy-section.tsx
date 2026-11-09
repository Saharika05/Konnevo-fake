"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Privacy } from "@/lib/api/types";
import { friendlyMessage } from "@/lib/api/client";
import { PRIVACY_KEY } from "@/lib/onboarding";
import { profileService } from "@/lib/services/profile";
import { PRIVACY_OPTIONS } from "@/components/onboarding/step-privacy";
import { ErrorState } from "@/components/state-messages";
import { Switch } from "@/components/ui/switch";

/** Every switch saves the moment it is flipped. If the save fails it flips back. */
export function PrivacySection() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: PRIVACY_KEY, queryFn: profileService.privacy });

  const save = useMutation({
    mutationFn: (patch: Partial<Privacy>) => profileService.updatePrivacy(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: PRIVACY_KEY });
      const previous = queryClient.getQueryData<{ privacy: Privacy }>(PRIVACY_KEY);
      if (previous) queryClient.setQueryData(PRIVACY_KEY, { privacy: { ...previous.privacy, ...patch } });
      return { previous };
    },
    onError: (error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(PRIVACY_KEY, context.previous);
      toast.error(friendlyMessage(error));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PRIVACY_KEY, data);
      toast.success("Saved");
    },
  });

  if (query.isPending) {
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" aria-busy="true" />
    );
  }
  if (query.isError)
    return <ErrorState message={friendlyMessage(query.error)} onRetry={() => query.refetch()} />;

  const values = query.data.privacy;

  return (
    <div>
      <p className="text-sm text-muted">
        Choose what other students can see. Changes save straight away. The server decides what is really
        hidden.
      </p>
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
        {PRIVACY_OPTIONS.map((option) => (
          <li key={option.key} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p id={`setting-${option.key}`} className="text-sm font-bold">
                {option.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{option.help}</p>
            </div>
            <Switch
              aria-labelledby={`setting-${option.key}`}
              checked={values[option.key]}
              onCheckedChange={(checked) => save.mutate({ [option.key]: checked })}
            />
          </li>
        ))}
      </ul>
      {!values.showMeToOthers && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-border bg-warning-soft px-3 py-2 text-xs text-warning-text"
        >
          Matching is off. You can look at people, but you cannot slide to match until you turn it back on.
        </p>
      )}
    </div>
  );
}
