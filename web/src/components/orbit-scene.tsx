"use client";

import * as React from "react";
import Image from "next/image";
import { PersonAvatar } from "@/components/person-avatar";
import { cn } from "@/lib/utils";

const PEOPLE = [
  { name: "Aditi", skill: "Next.js" },
  { name: "Harsh", skill: "Docker" },
  { name: "Meghna", skill: "Figma" },
  { name: "Yash", skill: "TensorFlow" },
  { name: "Riya", skill: "Django" },
  { name: "Varun", skill: "Kotlin" },
];

/** A 3D scene: teammates orbit a glowing konnevo core. Purely decorative. */
export function OrbitScene({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--px", `${((event.clientX - rect.left) / rect.width - 0.5) * 2}`);
    element.style.setProperty("--py", `${((event.clientY - rect.top) / rect.height - 0.5) * 2}`);
  }

  function handleLeave() {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--px", "0");
    element.style.setProperty("--py", "0");
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn("orbit-scene", className)}
      aria-hidden="true"
    >
      <div className="orbit-tilt">
        <div className="orbit-core">
          <span className="relative block h-8 w-28 overflow-hidden rounded-sm">
            <Image
              src="/konnevo-logo.png"
              alt=""
              fill
              sizes="112px"
              className="object-cover"
              style={{ objectPosition: "center 40%" }}
            />
          </span>
        </div>
        <div className="orbit-ring" />
        <div className="orbit-stage">
          {PEOPLE.map((person, index) => (
            <div
              key={person.name}
              className="orbit-chip"
              style={{ "--a": `${index * (360 / PEOPLE.length)}deg` } as React.CSSProperties}
            >
              <div className="orbit-chip-face">
                <PersonAvatar name={person.name} className="h-9 w-9" />
                <div className="leading-tight">
                  <p className="text-sm font-bold">{person.name}</p>
                  <p className="text-xs text-muted">{person.skill}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
