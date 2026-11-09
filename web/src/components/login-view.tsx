"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { authService } from "@/lib/services/auth";
import { landingFor, safeNext, useSession } from "@/lib/session";
import { showServerError } from "@/lib/form-errors";
import type { LoginAs } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const URL_ERRORS: Record<string, string> = {
  admin_not_approved: "That email is not on the club admin list.",
  login_failed: "We could not log you in. Please try again.",
};

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser } = useSession();

  const intent: LoginAs = params.get("as") === "admin" ? "admin" : "student";
  const next = safeNext(params.get("next"));
  const urlError = params.get("error");

  const [formError, setFormError] = React.useState<string | null>(null);

  // Already logged in: nothing to do here.
  React.useEffect(() => {
    if (user) router.replace(landingFor(user, next));
  }, [user, next, router]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => authService.login({ ...values, intent }),
    onSuccess: ({ user: signedIn }) => {
      setUser(signedIn);
      router.replace(landingFor(signedIn, next));
    },
    onError: (error) => {
      setFormError(
        showServerError(error, form.setError, { inlineCodes: ["invalid_credentials", "admin_not_approved"] }),
      );
    },
  });

  function switchTo(target: LoginAs) {
    const query = new URLSearchParams(params.toString());
    query.set("as", target);
    query.delete("error");
    setFormError(null);
    router.replace(`/login?${query.toString()}`);
  }

  const banner = formError ?? (urlError ? (URL_ERRORS[urlError] ?? URL_ERRORS.login_failed) : null);

  return (
    <AuthShell
      title={intent === "admin" ? "Club admin login" : "Welcome to konnevo"}
      subtitle={
        intent === "admin"
          ? "Post and manage events for your club."
          : "Log in or join in a few seconds. No form to fill first."
      }
    >
      <div
        role="group"
        aria-label="Who is logging in"
        className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1"
      >
        {(["student", "admin"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={intent === option}
            onClick={() => switchTo(option)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              intent === option ? "bg-surface text-foreground shadow" : "text-muted hover:text-foreground",
            )}
          >
            {option === "student" ? "I'm a student" : "I'm a club admin"}
          </button>
        ))}
      </div>

      {intent === "admin" && (
        <p className="mb-4 rounded-lg border border-border bg-warning-soft px-3 py-2 text-xs text-warning-text">
          Only approved club admins can log in. Not on the list yet? Ask the konnevo team to add your club.
        </p>
      )}

      {banner && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger-text"
        >
          {banner}
        </p>
      )}

      <OAuthButtons intent={intent} next={next} />

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or log in with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          setFormError(null);
          mutation.mutate(values);
        })}
      >
        <FormField id="login-email" label="Email" error={errors.email?.message}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...form.register("email")}
          />
        </FormField>
        <FormField
          id="login-password"
          label="Password"
          error={errors.password?.message}
          hint="Only if you set an app password. Otherwise use Google or GitHub."
        >
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...form.register("password")}
          />
        </FormField>
        <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in..." : "Log in"}
        </Button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="font-semibold text-primary-text hover:underline">
            Forgot password?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
