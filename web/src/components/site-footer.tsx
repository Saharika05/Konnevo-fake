import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="theme-dark bar-dark border-t border-border text-xs text-muted">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
      <nav aria-label="Footer" className="flex flex-wrap gap-x-2">
        <Link href="/about" className="hover:text-foreground hover:underline">
          About
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Privacy
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-foreground hover:underline">
          Terms
        </Link>
      </nav>
      <p>{APP_NAME} · Built by students, for students.</p>
      </div>
    </footer>
  );
}
