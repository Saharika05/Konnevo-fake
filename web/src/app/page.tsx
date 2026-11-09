import Link from "next/link";
import { Marquee } from "@/components/marquee";
import { OrbitScene } from "@/components/orbit-scene";
import { Reveal } from "@/components/reveal";
import { SectionLabel } from "@/components/section-label";
import { SplitHeadline } from "@/components/split-headline";
import { TiltCard } from "@/components/tilt-card";
import { UpcomingEvents } from "@/components/upcoming-events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EVENT_CATEGORIES = [
  "Hackathons",
  "Ideathons",
  "Tech Fests",
  "Workshops",
  "Coding Competitions",
  "Tech Talks",
  "Developer Meetups",
  "Innovation Challenges",
];

// Repeated so the track is about as wide as the old list (~7,000px). That keeps the
// scroll speed and the seamless loop of the unchanged marquee animation.
const TICKER = Array.from({ length: 6 }, () => EVENT_CATEGORIES).flat();

const STEPS = [
  {
    letter: "A",
    label: "Find",
    title: "Spot the event",
    text: "Hackathons, meetups and workshops from every college, all in one feed.",
  },
  {
    letter: "B",
    label: "Scout",
    title: "See the squad",
    text: "Peek at who is interested and what they build before you commit.",
  },
  {
    letter: "C",
    label: "Match",
    title: "Slide to match",
    text: "Slide right on people you would build with. Both say yes and you are a team.",
  },
];

/** The Home page. */
export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div>
          <Reveal>
            <Badge variant="info">Teammates, not just tickets</Badge>
          </Reveal>
          <SplitHeadline
            className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            lines={[
              "Do not just join",
              "a hackathon.",
              <span key="squad" className="text-gradient">
                Find your squad.
              </span>,
            ]}
          />
          <Reveal delay={350}>
            <p className="mt-6 max-w-lg text-lg text-muted">
              {
                "konnevo puts every tech event around you in one place, shows who is going, and matches you with teammates whose skills fit yours."
              }
            </p>
          </Reveal>
          <Reveal delay={500}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login?as=student">Join as a student</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/events">Browse events</Link>
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <OrbitScene />
        </Reveal>
      </section>

      <Reveal>
        <Marquee items={TICKER} />
      </Reveal>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            From scrolling to shipping in three moves.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.letter} delay={index * 120}>
              <TiltCard className="h-full">
                <SectionLabel letter={step.letter}>{step.label}</SectionLabel>
                <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Happening soon.</h2>
          <p className="mt-2 max-w-xl text-muted">
            Fresh from clubs near you. Pick one and find your people.
          </p>
        </Reveal>
        <div className="mt-8">
          <UpcomingEvents />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-primary-soft/60 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Running a club event?</h2>
              <p className="mt-1 text-sm text-muted">
                Approved club admins post here and reach students from every other campus.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/login?as=admin">Admin login</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
