"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPasswordSchema, type CreatePasswordValues } from "@/lib/schemas/auth";
import { authService } from "@/lib/services/auth";
import { landingFor, safeNext, useSession } from "@/lib/session";
import { showServerError } from "@/lib/form-errors";
import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Optional page after the first Google or GitHub login. The same action lives in Settings. */
export function CreatePasswordView() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refresh } = useSession();
  const next = safeNext(params.get("next"));

  const form = useForm<CreatePasswordValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors } = form.formState;

  function leave() {
    router.replace(user ? landingFor(user, next) : "/");
  }

  const mutation = useMutation({
    mutationFn: (values: CreatePasswordValues) => authService.createPassword({ password: values.password }),
    onSuccess: async () => {
      toast.success("Password created. You can now log in with your email too.");
      await refresh();
      leave();
    },
    onError: (error) => showServerError(error, form.setError),
  });

  return (
    <AuthShell
      title="Create a password"
      subtitle="Optional. With a password you can log in with your email as well as Google or GitHub."
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FormField
          id="new-password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "new-password-error" : undefined}
            {...form.register("password")}
          />
        </FormField>
        <FormField id="confirm-password" label="Confirm password" error={errors.confirm?.message}>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={errors.confirm ? "confirm-password-error" : undefined}
            {...form.register("confirm")}
          />
        </FormField>
        <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create password"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={leave}
          disabled={mutation.isPending}
        >
          Skip for now
        </Button>
      </form>
    </AuthShell>
  );
}
