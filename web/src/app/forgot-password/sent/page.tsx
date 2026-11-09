import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Check your email" };

export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <AuthShell title="Check your email">
      <p className="text-sm text-muted">
        If {email ? <strong className="text-foreground">{email}</strong> : "that address"} has an account, a
        reset link is on its way. It can take a minute. Look in spam too.
      </p>
      <Button asChild className="mt-6 w-full" size="lg">
        <Link href="/login">Back to log in</Link>
      </Button>
    </AuthShell>
  );
}
