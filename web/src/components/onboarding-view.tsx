"use client";

import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS, TOTAL_STEPS, useProfile } from "@/lib/onboarding";
import { ProgressBar } from "@/components/onboarding/parts";
import { StepBasic } from "@/components/onboarding/step-basic";
import { StepLinks } from "@/components/onboarding/step-links";
import { StepPhoto } from "@/components/onboarding/step-photo";
import { StepPrivacy } from "@/components/onboarding/step-privacy";
import { StepReview } from "@/components/onboarding/step-review";
import { StepSkills } from "@/components/onboarding/step-skills";
import { StepWork } from "@/components/onboarding/step-work";
import { Button } from "@/components/ui/button";

/**
 * One onboarding step. With `editing` (opened from the Profile page) the same
 * steps are used to change a single part, and saving returns to the Profile.
 */
export function OnboardingView({ step, editing }: { step: number; editing: boolean }) {
  const router = useRouter();
  const profile = useProfile();
  const meta = ONBOARDING_STEPS[step - 1];

  function onDone() {
    if (editing) router.push("/profile");
    else if (step === TOTAL_STEPS) router.replace("/events");
    else router.push(`/onboarding/${step + 1}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {editing ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Edit profile · {meta.title}</p>
      ) : (
        <ProgressBar step={step} />
      )}
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{meta.title}</h1>
      <p className="mt-1 text-muted">{meta.hint}</p>

      <div className="mt-8">
        {profile.isPending ? (
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" aria-busy="true" />
        ) : profile.isError ? (
          <div>
            <p className="text-sm text-danger-text">Could not load your profile.</p>
            <Button className="mt-4" variant="outline" onClick={() => profile.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <StepSwitch step={step} editing={editing} onDone={onDone} profile={profile.data.profile} />
        )}
      </div>
    </div>
  );
}

function StepSwitch({
  step,
  editing,
  onDone,
  profile,
}: {
  step: number;
  editing: boolean;
  onDone: () => void;
  profile: Parameters<typeof StepBasic>[0]["profile"];
}) {
  const common = { editing, onDone };
  switch (step) {
    case 1:
      return <StepBasic {...common} profile={profile} />;
    case 2:
      return <StepPhoto {...common} profile={profile} />;
    case 3:
      return <StepSkills {...common} profile={profile} />;
    case 4:
      return <StepLinks {...common} profile={profile} />;
    case 5:
      return <StepWork {...common} />;
    case 6:
      return <StepPrivacy {...common} />;
    default:
      return <StepReview {...common} profile={profile} />;
  }
}
