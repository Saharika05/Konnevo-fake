"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { eventsService } from "@/lib/services/events";
import { formatDateRange } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PersonAvatar } from "@/components/person-avatar";
import { Marquee } from "@/components/marquee";
import { OrbitScene } from "@/components/orbit-scene";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import skills from "@/data/skills.json";

const SWATCHES = [
  { name: "background", className: "bg-background" },
  { name: "surface", className: "bg-surface" },
  { name: "subtle", className: "bg-subtle" },
  { name: "primary", className: "bg-primary" },
  { name: "primary-soft", className: "bg-primary-soft" },
  { name: "moss", className: "bg-moss" },
  { name: "sage", className: "bg-sage" },
  { name: "success", className: "bg-success" },
  { name: "success-soft", className: "bg-success-soft" },
  { name: "danger", className: "bg-danger" },
  { name: "warning-soft", className: "bg-warning-soft" },
  { name: "foreground", className: "bg-foreground" },
];

export default function FoundationPage() {
  const events = useQuery({ queryKey: ["events", "upcoming"], queryFn: eventsService.home });

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-10 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Foundation check</h1>
        <p className="mt-1 text-sm text-muted">
          Everything on this page comes from the shared building blocks every screen will use.
        </p>
      </div>

      <section aria-labelledby="colours">
        <h2 id="colours" className="mb-3 text-lg font-bold">
          Colours
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map((swatch) => (
            <div key={swatch.name} className="rounded-xl border border-border bg-surface p-2">
              <div className={`h-12 rounded-lg border border-border ${swatch.className}`} />
              <p className="mt-1 text-xs font-semibold">{swatch.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="motion">
        <h2 id="motion" className="mb-3 text-lg font-bold">
          3D and motion
        </h2>
        <div className="grid items-center gap-6 md:grid-cols-2">
          <OrbitScene />
          <div className="grid gap-4">
            <TiltCard className="rounded-2xl border border-border bg-surface p-6">
              <p className="font-bold">Hover me</p>
              <p className="text-sm text-muted">Tilts in 3D towards your pointer. Flat on phones.</p>
            </TiltCard>
            <Reveal>
              <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
                This block fades in as it scrolls into view.
              </p>
            </Reveal>
          </div>
        </div>
        <div className="mt-6">
          <Marquee items={skills.skills.flatMap((group) => group.items)} />
        </div>
      </section>

      <section aria-labelledby="buttons">
        <h2 id="buttons" className="mb-3 text-lg font-bold">
          Buttons, badges and avatars
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="success">Team up</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="link">Link style</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="info">42 interested</Badge>
          <Badge variant="success">Posted by Tech Club</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Rejected</Badge>
          <Badge>Expired</Badge>
          <PersonAvatar name="Priya" />
          <PersonAvatar name="Meera" />
          <PersonAvatar name="Arjun" />
          <PersonAvatar name="Sana" />
        </div>
      </section>

      <section aria-labelledby="popups">
        <h2 id="popups" className="mb-3 text-lg font-bold">
          Dialog and toast
        </h2>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open a dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>It works</DialogTitle>
                <DialogDescription>
                  Press Escape or the cross to close. Tab stays inside the dialog.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Got it</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => toast.success("This is a success message")}>
            Show a toast
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          The feedback form lives only on the About page. There is no floating Feedback button.
        </p>
      </section>

      <section aria-labelledby="data">
        <h2 id="data" className="mb-3 text-lg font-bold">
          Fake data layer
        </h2>
        {events.isPending && <p className="text-sm text-muted">Loading events...</p>}
        {events.isError && <p className="text-sm text-danger-text">Could not load events.</p>}
        {events.data && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {events.data.events.map((event) => (
              <li key={event.id} className="rounded-xl border border-border bg-surface p-4">
                <p className={event.expired ? "font-bold text-muted" : "font-bold"}>{event.title}</p>
                <p className="text-sm text-muted">
                  {formatDateRange(event.startDate, event.endDate)} · {event.place} · {event.type}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.expired ? (
                    <Badge>Expired</Badge>
                  ) : (
                    <Badge variant="info">{event.interestedCount} interested</Badge>
                  )}
                  <Badge variant="success">Posted by {event.clubName}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          Skills list loaded: {skills.skills.length} groups, {skills.interests.length} interests.
        </p>
      </section>
    </div>
  );
}
