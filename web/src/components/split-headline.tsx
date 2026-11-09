import * as React from "react";

/** A big headline whose lines slide up one after another. */
export function SplitHeadline({ lines, className }: { lines: React.ReactNode[]; className?: string }) {
  return (
    <h1 className={className}>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden pb-[0.12em]">
          <span className="rise block" style={{ animationDelay: `${index * 130}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}
