"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas/auth";
import { authService } from "@/lib/services/auth";
import { showServerError } from "@/lib/form-errors";
import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordView() {
  const router = useRouter();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (_data, variables) =>
      router.push(`/forgot-password/sent?email=${encodeURIComponent(variables.email)}`),
    onError: (error) => showServerError(error, form.setError),
  });

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FormField id="forgot-email" label="Email" error={errors.email?.message}>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "forgot-email-error" : undefined}
            {...form.register("email")}
          />
        </FormField>
        <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-center text-sm">
          <Link href="/login" className="font-semibold text-primary-text hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
