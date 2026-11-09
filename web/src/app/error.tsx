"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Shown when a page crashes. "Try again" re-renders the page. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-5xl font-extrabold text-gradient-404">Oops</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-2 text-muted">
        It is not you. Try again, and if it keeps happening let us know on the About page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
