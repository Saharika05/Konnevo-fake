import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { SectionLabel } from "@/components/section-label";
import { TiltCard } from "@/components/tilt-card";
import { FeedbackForm } from "@/components/feedback";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  {
    letter: "A",
    label: "Why",
    title: "Events are easy. Teams are hard.",
    text: "Most students skip hackathons because they do not know anyone to build with. We fix that part.",
  },
  {
    letter: "B",
    label: "How",
    title: "Skills first",
    text: "You list what you can do. We show you people whose skills fit yours and the event you both want.",
  },
  {
    letter: "C",
    label: "Who",
    title: "Built by students",
    text: "Clubs post the events, students bring the energy. Nobody pays to find a teammate.",
  },
];

const TEAM_RULES = [
  "Mark yourself interested in an event to see who else is going.",
  "Open someone's profile and slide right to match, or left to skip.",
  "When you both slide right, it is a match and you see each other's links.",
  "Build a team from your matches. Teammates accept the invite to join.",
];
export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-text">About {APP_NAME}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          We help students find the people they will <span className="text-gradient">build with.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          {APP_NAME} brings every tech event into one feed, shows you who else is going, and matches you with
          teammates so you walk in with a squad instead of walking in alone.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PRINCIPLES.map((item, index) => (
          <Reveal key={item.letter} delay={index * 120}>
            <TiltCard className="h-full">
              <SectionLabel letter={item.letter}>{item.label}</SectionLabel>
              <h2 className="mt-5 text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">How it works</h2>
          <ol className="mt-6 space-y-4">
            {TEAM_RULES.map((rule, index) => (
              <li key={rule} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">
                  {index + 1}
                </span>
                <span className="text-sm text-muted">{rule}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={150}>
          <div id="feedback" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-tight">Got an idea? Spill it.</h2>
            <p className="mb-5 mt-1 text-sm text-muted">
              Bugs, wishes and wild ideas all land straight with the team.
            </p>
            <FeedbackForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
