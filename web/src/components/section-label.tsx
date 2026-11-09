import * as React from "react";

/** The small lettered marker above a section: "A  Find". */
export function SectionLabel({ letter, children }: { letter: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
      <span className="grid h-6 w-6 place-items-center rounded-md border border-border font-bold text-primary-text">
        {letter}
      </span>
      {children}
    </p>
  );
}
