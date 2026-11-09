"use client";

import * as React from "react";
import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { MotionValue } from "motion/react";
import { Check, X } from "lucide-react";
import type { SwipeDirection } from "@/lib/api/types";

const KNOB = 56;
/** Past this share of the way, the slide counts. */
const THRESHOLD = 0.6;

/**
 * The slide-to-match control. Drag the knob right to match, left to skip.
 * Let go before 60% and it snaps back. `progress` runs from -1 (skip) to 1 (match)
 * and also drives the 3D card, so the card leans with the knob.
 * Skip and Match buttons and the arrow keys do the same for keyboard and screen readers.
 */
export function SlideToMatch({
  progress,
  name,
  disabled,
  resetKey,
  onCommit,
}: {
  progress: MotionValue<number>;
  name: string;
  disabled?: boolean;
  /** Changes with each new person, so the knob returns to the middle. */
  resetKey: string;
  onCommit: (direction: SwipeDirection) => void;
}) {
  const reduced = useReducedMotion();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [max, setMax] = React.useState(0);
  const x = useMotionValue(0);

  React.useEffect(() => {
    const element = trackRef.current;
    if (!element) return;
    const measure = () => setMax(Math.max(0, (element.clientWidth - KNOB) / 2 - 4));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    x.set(0);
    progress.set(0);
  }, [resetKey, x, progress]);

  // After a failed swipe the parent enables the control again: bring the knob home.
  React.useEffect(() => {
    if (!disabled) animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
  }, [disabled, x]);

  useMotionValueEvent(x, "change", (latest) => {
    progress.set(max > 0 ? Math.max(-1, Math.min(1, latest / max)) : 0);
  });

  const commit = React.useCallback(
    (direction: SwipeDirection) => {
      if (disabled) return;
      animate(x, direction === "right" ? max : -max, { duration: reduced ? 0 : 0.18 });
      onCommit(direction);
    },
    [disabled, max, onCommit, reduced, x],
  );

  // Left and right arrow keys, unless the person is typing or a popup is open.
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      commit(event.key === "ArrowRight" ? "right" : "left");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit]);

  const skipGlow = useTransform(progress, [-1, 0], [0.45, 0]);
  const matchGlow = useTransform(progress, [0, 1], [0, 0.6]);
  const skipScale = useTransform(progress, [-1, 0], [1.2, 1]);
  const matchScale = useTransform(progress, [0, 1], [1, 1.2]);
  const hintOpacity = useTransform(progress, [-0.4, 0, 0.4], [0, 1, 0]);

  return (
    <div>
      <div
        ref={trackRef}
        className="relative flex h-16 touch-none select-none items-center justify-between overflow-hidden rounded-full border border-border knob-track px-6 shadow-inset-track"
      >
        <motion.span
          aria-hidden="true"
          style={{ opacity: skipGlow }}
          className="absolute inset-0 bg-brick-glow"
        />
        <motion.span
          aria-hidden="true"
          style={{ opacity: matchGlow }}
          className="absolute inset-0 bg-sage"
        />

        <motion.span
          aria-hidden="true"
          style={{ scale: skipScale }}
          className="font-display relative z-10 flex items-center gap-1.5 text-sm font-extrabold tracking-[0.2em] text-soft-white"
        >
          <X className="h-4 w-4" /> SKIP
        </motion.span>
        <motion.span
          aria-hidden="true"
          style={{ scale: matchScale }}
          className="font-display relative z-10 flex items-center gap-1.5 text-sm font-extrabold tracking-[0.2em] text-ink"
        >
          MATCH <Check className="h-4 w-4" />
        </motion.span>

        <motion.div
          aria-hidden="true"
          drag={disabled ? false : "x"}
          dragConstraints={{ left: -max, right: max }}
          dragElastic={0}
          dragMomentum={false}
          style={{ x, width: KNOB, height: KNOB }}
          whileTap={{ scale: 1.08 }}
          onDragEnd={() => {
            const share = max > 0 ? x.get() / max : 0;
            if (share >= THRESHOLD) commit("right");
            else if (share <= -THRESHOLD) commit("left");
            else animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
          }}
          className="absolute left-1/2 top-1/2 -ml-7 -mt-7 z-20 cursor-grab rounded-full bg-soft-white shadow-knob active:cursor-grabbing"
        >
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-paper to-sage-200" />
          <span className="absolute inset-x-2 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-sm">
            <Image
              src="/konnevo-logo.png"
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              style={{ objectPosition: "center 40%" }}
            />
          </span>
        </motion.div>
      </div>

      <motion.p style={{ opacity: hintOpacity }} className="mt-2 text-center text-xs text-muted">
        Slide left to skip, right to match
      </motion.p>

      <div className="mt-1 flex justify-center gap-6">
        <button
          type="button"
          onClick={() => commit("left")}
          disabled={disabled}
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Skip<span className="sr-only"> {name}</span>
        </button>
        <button
          type="button"
          onClick={() => commit("right")}
          disabled={disabled}
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Match<span className="sr-only"> with {name}</span>
        </button>
      </div>
    </div>
  );
}
