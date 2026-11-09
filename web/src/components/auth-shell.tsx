import * as React from "react";
import { Reveal } from "@/components/reveal";

/** The centred card every login-related page sits in. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] justify-center px-4 py-12 sm:px-6 sm:py-16">
      <Reveal className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-[0_0_60px_-30px] shadow-primary backdrop-blur sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </Reveal>
    </div>
  );
}
