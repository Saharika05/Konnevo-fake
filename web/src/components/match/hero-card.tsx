"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { Sparkles } from "lucide-react";
import type { PersonProfile, SwipeDirection } from "@/lib/api/types";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Badge } from "@/components/ui/badge";

/**
 * The 3D profile card. It leans and slides with the knob (`progress`), and its layers sit at
 * different depths, so the avatar, name and chips drift against each other like a hologram.
 * With "reduce motion" switched on, it stays flat.
 */
export function HeroCard({
  person,
  whyMatch,
  progress,
  exit,
}: {
  person: PersonProfile;
  whyMatch: string;
  progress: MotionValue<number>;
  /** Set once a swipe is committed, so the card flies off. */
  exit: "idle" | SwipeDirection;
}) {
  const reduced = useReducedMotion();

  const rotateY = useTransform(progress, [-1, 1], reduced ? [0, 0] : [-18, 18]);
  const rotateZ = useTransform(progress, [-1, 1], reduced ? [0, 0] : [-5, 5]);
  const shiftX = useTransform(progress, [-1, 1], reduced ? [0, 0] : [-70, 70]);
  const skipTint = useTransform(progress, [-1, 0], [0.45, 0]);
  const matchTint = useTransform(progress, [0, 1], [0, 0.6]);

  const flyOut =
    exit === "idle"
      ? { opacity: 1, x: 0, y: 0, rotateZ: 0, scale: 1 }
      : { opacity: 0, x: exit === "right" ? 640 : -640, rotateZ: exit === "right" ? 16 : -16, scale: 0.92 };

  return (
    <div className="theme-light [perspective:1300px]">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 48, rotateX: -14, scale: 0.95 }}
        animate={{ ...flyOut, rotateX: 0, y: 0 }}
        transition={{ duration: reduced ? 0 : exit === "idle" ? 0.55 : 0.32, ease: "easeOut" }}
        className="relative"
      >
        {/* Two ghost cards behind, so it feels like a deck */}
        <div
          aria-hidden="true"
          className="absolute inset-x-6 -bottom-3 top-6 rounded-3xl border border-border bg-surface/60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-12 -bottom-6 top-10 rounded-3xl border border-border bg-surface/30"
        />

        <motion.div
          style={{ rotateY, rotateZ, x: shiftX, transformStyle: "preserve-3d" }}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-dock"
        >
          {/* Background: a soft mesh and a grid, the deepest layer */}
          <div
            aria-hidden="true"
            className="hero-mesh absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="hero-grid absolute inset-0 opacity-60"
          />
          {/* Red and green tint that follows the slide */}
          <motion.div
            aria-hidden="true"
            style={{ opacity: skipTint }}
            className="absolute inset-0 bg-brick-glow"
          />
          <motion.div
            aria-hidden="true"
            style={{ opacity: matchTint }}
            className="absolute inset-0 bg-sage"
          />

          <div className="relative p-6 sm:p-8" style={{ transformStyle: "preserve-3d" }}>
            <div style={{ transform: "translateZ(70px)" }} className="flex items-center gap-5">
              <span className="relative inline-flex rounded-full bg-gradient-to-br from-deep-olive via-moss to-sage p-[3px] shadow-ring-glow">
                <ProfileAvatar
                  name={person.name}
                  photoUrl={person.photoUrl}
                  className="font-display h-24 w-24 border-4 border-surface text-4xl sm:h-28 sm:w-28 sm:text-5xl"
                />
              </span>
              <div className="min-w-0" style={{ transform: "translateZ(30px)" }}>
                <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                  {person.name}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  {[person.college, person.year ? `${person.year} year` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            {person.lookingFor.length > 0 && (
              <div style={{ transform: "translateZ(35px)" }} className="mt-5 flex flex-wrap gap-2">
                {person.lookingFor.map((item) => (
                  <Badge key={item} variant="info" className="capitalize">
                    {item}
                  </Badge>
                ))}
              </div>
            )}

            {person.bio && (
              <p
                style={{ transform: "translateZ(25px)" }}
                className="mt-4 max-w-xl text-base text-foreground/90"
              >
                {person.bio}
              </p>
            )}

            <div
              style={{ transform: "translateZ(55px)" }}
              className="mt-6 rounded-2xl border border-moss/60 bg-primary-soft/80 p-4 shadow-note backdrop-blur"
            >
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-deep-olive">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Why you match
              </p>
              <p className="font-display mt-1 text-xl font-bold leading-snug">{whyMatch}</p>
            </div>

            {(person.skills.length > 0 || person.interests.length > 0) && (
              <ul style={{ transform: "translateZ(40px)" }} className="mt-5 flex flex-wrap gap-2">
                {person.skills.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border bg-background/60 px-3 py-1 text-sm"
                  >
                    {item}
                  </li>
                ))}
                {person.interests.map((item) => (
                  <li key={item} className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary-text">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
