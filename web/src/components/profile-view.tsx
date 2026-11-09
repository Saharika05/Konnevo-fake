"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Pencil } from "lucide-react";
import { EXPERIENCE_KEY, PROJECTS_KEY, useProfile } from "@/lib/onboarding";
import { YEARS } from "@/lib/schemas/profile";
import { experienceService } from "@/lib/services/experience";
import { projectsService } from "@/lib/services/projects";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Reveal } from "@/components/reveal";
import { ExperienceCard } from "@/components/work-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function EditLink({ step, label }: { step: number; label: string }) {
  return (
    <Link
      href={`/onboarding/${step}?edit=1`}
      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-text hover:underline"
    >
      <Pencil className="h-3 w-3" aria-hidden="true" />
      {label}
    </Link>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The student's own profile page. Students cannot submit events, so there is no events section here. */
export function ProfileView() {
  const profile = useProfile();
  const projects = useQuery({ queryKey: PROJECTS_KEY, queryFn: projectsService.list });
  const experience = useQuery({ queryKey: EXPERIENCE_KEY, queryFn: experienceService.list });

  if (profile.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (profile.isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-danger-text">Could not load your profile.</p>
        <Button className="mt-4" variant="outline" onClick={() => profile.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const me = profile.data.profile;
  const year = YEARS.find((item) => item.value === me.year)?.label;
  const hasSkills = me.skills.length + me.customSkills.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-10 sm:px-6">
      <Reveal>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_0_60px_-35px] shadow-primary">
          <div className="flex flex-wrap items-start gap-5">
            <ProfileAvatar name={me.name} photoUrl={me.photoUrl} className="h-24 w-24 text-3xl" />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight">{me.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {[me.college, year].filter(Boolean).join(" · ") || "Add your college"}
              </p>
              {me.lookingFor.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {me.lookingFor.map((item) => (
                    <Badge key={item} variant="info" className="capitalize">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
              {me.bio && <p className="mt-3 text-sm">{me.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                {me.github && (
                  <Button asChild size="sm" variant="outline">
                    <a href={me.github} target="_blank" rel="noopener noreferrer">
                      GitHub <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </Button>
                )}
                {me.linkedin && (
                  <Button asChild size="sm" variant="outline">
                    <a href={me.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </Button>
                )}
                {me.portfolio && (
                  <Button asChild size="sm" variant="outline">
                    <a href={me.portfolio} target="_blank" rel="noopener noreferrer">
                      Portfolio <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>
              {(me.discord || me.whatsapp) && (
                <p className="mt-3 text-sm text-muted">
                  {me.discord && <span>Discord: {me.discord}</span>}
                  {me.discord && me.whatsapp && <span aria-hidden="true"> · </span>}
                  {me.whatsapp && <span>WhatsApp: {me.whatsapp}</span>}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <EditLink step={1} label="Edit basics" />
              <EditLink step={2} label="Change photo" />
              <Link href="/settings" className="text-xs font-semibold text-muted hover:text-foreground">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <Section title="Skills and interests" action={<EditLink step={3} label="Edit" />}>
          {hasSkills || me.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {[...me.skills, ...me.customSkills].map((item) => (
                <span key={item} className="rounded-full border border-border px-3 py-1 text-sm">
                  {item}
                </span>
              ))}
              {me.interests.map((item) => (
                <span key={item} className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary-text">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No skills yet. Add some so we can find you teammates.</p>
          )}
        </Section>
      </Reveal>

      <Reveal delay={120}>
        <Section title="About you" action={<EditLink step={4} label="Edit" />}>
          {me.about ? (
            <p className="whitespace-pre-line text-sm text-muted">{me.about}</p>
          ) : (
            <p className="text-sm text-muted">Tell people what you build and what you want to learn.</p>
          )}
        </Section>
      </Reveal>

      <Reveal delay={160}>
        <Section
          title="Projects"
          action={
            <Link href="/my-work" className="text-xs font-semibold text-primary-text hover:underline">
              Manage in My Work
            </Link>
          }
        >
          {projects.isPending ? (
            <div className="h-16 animate-pulse rounded-lg bg-subtle" aria-busy="true" />
          ) : projects.isError ? (
            <p className="text-sm text-danger-text">Could not load your projects.</p>
          ) : projects.data.projects.length === 0 ? (
            <p className="text-sm text-muted">No projects yet. Real ones only, please.</p>
          ) : (
            <ul className="space-y-3">
              {projects.data.projects.map((project) => (
                <li key={project.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold">{project.title}</p>
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-text hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">{project.title} in a new tab</span>
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{project.description}</p>
                  {project.techTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {project.techTags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {project.imageUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {project.imageUrls.map((url, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={index}
                          src={url}
                          alt={`${project.title} screenshot ${index + 1}`}
                          className="aspect-video w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </Reveal>

      <Reveal delay={200}>
        <Section
          title="Experience"
          action={
            <Link
              href="/my-work?tab=experience"
              className="text-xs font-semibold text-primary-text hover:underline"
            >
              Manage in My Work
            </Link>
          }
        >
          {experience.isPending ? (
            <div className="h-16 animate-pulse rounded-lg bg-subtle" aria-busy="true" />
          ) : experience.isError ? (
            <p className="text-sm text-danger-text">Could not load your experience.</p>
          ) : experience.data.experience.length === 0 ? (
            <p className="text-sm text-muted">No experience yet. Hackathons and internships count.</p>
          ) : (
            <ul className="space-y-3">
              {experience.data.experience.map((entry) => (
                <ExperienceCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </Section>
      </Reveal>
    </div>
  );
}
