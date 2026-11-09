"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Maximum tilt in degrees. */
  max?: number;
};

/** A card that tilts in 3D towards the pointer. It stays flat on phones and for reduced motion. */
export function TiltCard({ className, children, max = 8, ...props }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  function canTilt() {
    return (
      !window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || !canTilt()) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
    element.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
    element.style.setProperty("--gx", `${x * 100}%`);
    element.style.setProperty("--gy", `${y * 100}%`);
  }

  function handleLeave() {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--rx", "0deg");
    element.style.setProperty("--ry", "0deg");
  }

  return (
    <div className="tilt-wrap">
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={cn("tilt rounded-2xl border border-border bg-surface/80 p-6", className)}
        {...props}
      >
        <div className="tilt-glare" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
