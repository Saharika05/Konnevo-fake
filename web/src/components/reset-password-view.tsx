"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPasswordSchema, type CreatePasswordValues } from "@/lib/schemas/auth";
import { authService } from "@/lib/services/auth";
import { showServerError } from "@/lib/form-errors";
import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordView() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [linkError, setLinkError] = React.useState<string | null>(null);

  const form = useForm<CreatePasswordValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: CreatePasswordValues) =>
      authService.resetPassword({ token: token ?? "", password: values.password }),
    onSuccess: () => {
      toast.success("Password changed. Log in with your new password.");
      router.replace("/login");
    },
    onError: (error) =>
      setLinkError(showServerError(error, form.setError, { inlineCodes: ["invalid_token"] })),
  });

  if (!token || linkError) {
    return (
      <AuthShell title="This link does not work">
        <p className="text-sm text-muted">{linkError ?? "The reset link is missing or incomplete."}</p>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/forgot-password">Ask for a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FormField
          id="reset-password"
          label="New password"
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "reset-password-error" : undefined}
            {...form.register("password")}
          />
        </FormField>
        <FormField id="reset-confirm" label="Confirm password" error={errors.confirm?.message}>
          <Input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={errors.confirm ? "reset-confirm-error" : undefined}
            {...form.register("confirm")}
          />
        </FormField>
        <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Change password"}
        </Button>
      </form>
    </AuthShell>
  );
}
