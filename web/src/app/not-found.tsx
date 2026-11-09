import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl font-extrabold text-gradient-404 sm:text-8xl">404</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">We could not find that page</h1>
      <p className="mt-2 text-muted">The link may be old, or the page may have moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/events">See upcoming events</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
