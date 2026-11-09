"use client";

import * as React from "react";
import Link from "next/link";
import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** What every step component receives. */
export type StepProps = {
  /** Go on after saving: the next step, or back to the profile when editing. */
  onDone: () => void;
  editing: boolean;
};

export function ProgressBar({ step }: { step: number }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Step {step} of {TOTAL_STEPS} · {ONBOARDING_STEPS[step - 1].title}
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
        aria-label="Profile setup progress"
        className="mt-3 flex gap-1.5"
      >
        {ONBOARDING_STEPS.map((item, index) => (
          <span
            key={item.title}
            className={cn("h-1.5 flex-1 rounded-full", index < step ? "bg-primary" : "bg-subtle")}
          />
        ))}
      </div>
    </div>
  );
}

/** Back, Skip and the main button, the same on every step. */
export function StepFooter({
  step,
  editing,
  saving,
  onSkip,
  saveLabel,
}: {
  step: number;
  editing: boolean;
  saving: boolean;
  /** Present only on steps that may be skipped. */
  onSkip?: () => void;
  saveLabel?: string;
}) {
  const backHref = editing ? "/profile" : step > 1 ? `/onboarding/${step - 1}` : null;
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Saving..." : (saveLabel ?? (editing ? "Save" : "Save and continue"))}
      </Button>
      {onSkip && !editing && (
        <Button type="button" variant="ghost" size="lg" onClick={onSkip} disabled={saving}>
          Skip for now
        </Button>
      )}
      {backHref && (
        <Link href={backHref} className="ml-auto text-sm font-semibold text-muted hover:text-foreground">
          {editing ? "Cancel" : "Back"}
        </Link>
      )}
    </div>
  );
}

/** A pill that toggles on and off. Reads out as a pressed button. */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary-soft text-primary-text"
          : "border-border bg-surface text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
