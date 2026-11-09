"use client";

import { motion, useReducedMotion } from "motion/react";
import { ExternalLink } from "lucide-react";
import type { Match } from "@/lib/api/types";
import { useSession } from "@/lib/session";
import { CONFETTI_COLORS } from "@/lib/theme";
import { AuroraBackground } from "@/components/aurora-background";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const COLOURS = CONFETTI_COLORS;

/** Falling bits of paper. The same pattern every time, hidden for "reduce motion". */
const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  delay: `${(i % 8) * 0.1}s`,
  dx: `${((i * 53) % 120) - 60}px`,
  colour: COLOURS[i % COLOURS.length],
}));

/**
 * "It's a match!" Two profile discs swing together in 3D, with the other person's
 * LinkedIn and GitHub buttons when the server sent them.
 */
export function MatchPopup({
  match,
  onKeepSwiping,
  onSeeMatches,
}: {
  match: Match;
  onKeepSwiping: () => void;
  onSeeMatches: () => void;
}) {
  const { user } = useSession();
  const reduced = useReducedMotion();
  const disc = "h-24 w-24 border-4 border-surface text-4xl font-display";

  return (
    <Dialog open onOpenChange={(open) => !open && onKeepSwiping()}>
      <DialogContent className="theme-dark overflow-hidden text-center sm:max-w-md">
        <AuroraBackground variant="dark" contained />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="confetti"
              style={{
                left: piece.left,
                background: piece.colour,
                animationDelay: piece.delay,
                ["--dx" as string]: piece.dx,
              }}
            />
          ))}
        </div>

        <div className="relative [perspective:900px]">
          <div className="mt-2 flex items-center justify-center">
            <motion.span
              initial={reduced ? false : { x: -90, rotateY: -70, opacity: 0 }}
              animate={{ x: 0, rotateY: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
              className="-mr-4 inline-flex rounded-full bg-gradient-to-br from-sage to-moss p-[3px] shadow-ring-glow-soft"
            >
              <ProfileAvatar name={user?.name ?? "You"} photoUrl={user?.photoUrl} className={disc} />
            </motion.span>
            <motion.span
              initial={reduced ? false : { x: 90, rotateY: 70, opacity: 0 }}
              animate={{ x: 0, rotateY: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
              className="inline-flex rounded-full bg-gradient-to-br from-sage-200 to-sage p-[3px] shadow-ring-glow-soft"
            >
              <ProfileAvatar name={match.person.name} photoUrl={match.person.photoUrl} className={disc} />
            </motion.span>
          </div>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: reduced ? 0 : 0.35, duration: 0.4 }}
          className="relative"
        >
          <DialogTitle className="font-display mt-6 text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">It is a match!</span>
          </DialogTitle>
          <DialogDescription className="mt-2">
            You and {match.person.name} both want to team up. Say hello and build something.
          </DialogDescription>

          {(match.linkedin || match.github) && (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {match.linkedin && (
                <Button asChild variant="outline">
                  <a href={match.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              )}
              {match.github && (
                <Button asChild variant="outline">
                  <a href={match.github} target="_blank" rel="noopener noreferrer">
                    GitHub <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={onKeepSwiping}>
              Keep swiping
            </Button>
            <Button size="lg" variant="ghost" onClick={onSeeMatches}>
              See my matches
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
