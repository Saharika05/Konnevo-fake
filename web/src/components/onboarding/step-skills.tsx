"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import type { Profile } from "@/lib/api/types";
import { PROFILE_KEY } from "@/lib/onboarding";
import { MAX_CUSTOM_SKILLS, customSkillSchema } from "@/lib/schemas/profile";
import { profileService } from "@/lib/services/profile";
import { showServerError } from "@/lib/form-errors";
import { Chip, StepFooter, type StepProps } from "@/components/onboarding/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function StepSkills({ profile, onDone, editing }: StepProps & { profile: Profile }) {
  const queryClient = useQueryClient();
  const catalog = useQuery({
    queryKey: ["skills"],
    queryFn: profileService.skillCatalog,
    staleTime: Infinity,
  });

  const [skills, setSkills] = React.useState(profile.skills);
  const [interests, setInterests] = React.useState(profile.interests);
  const [custom, setCustom] = React.useState(profile.customSkills);
  const [search, setSearch] = React.useState("");
  const [customText, setCustomText] = React.useState("");
  const [customError, setCustomError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => profileService.saveSkills({ skills, interests, customSkills: custom }),
    onSuccess: () => {
      queryClient.setQueryData(PROFILE_KEY, (old: { profile: Profile } | undefined) =>
        old ? { profile: { ...old.profile, skills, interests, customSkills: custom } } : old,
      );
      onDone();
    },
    onError: (error) => showServerError(error),
  });

  const query = search.trim().toLowerCase();
  const matches = (name: string) => !query || name.toLowerCase().includes(query);
  const selectedCount = skills.length + interests.length + custom.length;

  function addCustom() {
    const parsed = customSkillSchema.safeParse(customText);
    if (!parsed.success) {
      setCustomError(parsed.error.issues[0].message);
      return;
    }
    const value = parsed.data;
    const exists = [...custom, ...skills].some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      setCustomError("You already added that.");
      return;
    }
    if (custom.length >= MAX_CUSTOM_SKILLS) {
      setCustomError(`You can add up to ${MAX_CUSTOM_SKILLS} custom skills.`);
      return;
    }
    setCustom([...custom, value]);
    setCustomText("");
    setCustomError(null);
  }

  if (catalog.isPending) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" aria-busy="true" />
    );
  }
  if (catalog.isError) {
    return (
      <p className="text-sm text-danger-text">Could not load the skills list. Please refresh the page.</p>
    );
  }

  const groups = catalog.data.skills
    .map((group) => ({ ...group, items: group.items.filter(matches) }))
    .filter((group) => group.items.length > 0);
  const shownInterests = catalog.data.interests.filter(matches);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="skill-search" className="sr-only">
            Search skills and interests
          </label>
          <Input
            id="skill-search"
            type="search"
            placeholder="Search skills and interests"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <p className="text-sm font-semibold text-primary-text" aria-live="polite">
          {selectedCount} selected
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">Pick at least three for better matches.</p>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section key={group.group} aria-label={group.group}>
            <h2 className="mb-2 text-sm font-bold">{group.group}</h2>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Chip
                  key={item}
                  selected={skills.includes(item)}
                  onClick={() => setSkills(toggle(skills, item))}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </section>
        ))}
        {shownInterests.length > 0 && (
          <section aria-label="Interests">
            <h2 className="mb-2 text-sm font-bold">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {shownInterests.map((item) => (
                <Chip
                  key={item}
                  selected={interests.includes(item)}
                  onClick={() => setInterests(toggle(interests, item))}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </section>
        )}
        {groups.length === 0 && shownInterests.length === 0 && (
          <p className="text-sm text-muted">Nothing matches “{search}”. Add it below as your own skill.</p>
        )}
      </div>

      <section aria-label="Your own skills" className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold">Not on the list? Add your own</h2>
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <label htmlFor="custom-skill" className="sr-only">
              Your own skill
            </label>
            <Input
              id="custom-skill"
              value={customText}
              placeholder="For example: Three.js"
              aria-invalid={customError ? true : undefined}
              aria-describedby={customError ? "custom-skill-error" : undefined}
              onChange={(event) => setCustomText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustom();
                }
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={addCustom}>
            Add
          </Button>
        </div>
        {customError && (
          <p id="custom-skill-error" role="alert" className="mt-1 text-xs text-danger-text">
            {customError}
          </p>
        )}
        {custom.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {custom.map((item) => (
              <li
                key={item}
                className="flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-sm text-primary-text"
              >
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  className="cursor-pointer rounded-full p-1 hover:bg-primary/20"
                  onClick={() => setCustom(custom.filter((entry) => entry !== item))}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">
          {custom.length} of {MAX_CUSTOM_SKILLS} used. Each can be 2 to 40 characters.
        </p>
      </section>

      <StepFooter step={3} editing={editing} saving={mutation.isPending} />
    </form>
  );
}
