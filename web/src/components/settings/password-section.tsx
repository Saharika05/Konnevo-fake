"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  changePasswordSchema,
  createPasswordSchema,
  type ChangePasswordValues,
  type CreatePasswordValues,
} from "@/lib/schemas/auth";
import { authService } from "@/lib/services/auth";
import { useSession } from "@/lib/session";
import { showServerError } from "@/lib/form-errors";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function field(id: string, label: string, error: string | undefined, input: React.ReactNode, hint?: string) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      {input}
    </FormField>
  );
}

/** "Create password" for people who signed in with Google or GitHub, "Change password" for everyone else. */
export function PasswordSection() {
  const { user } = useSession();
  return user?.hasPassword ? <ChangeForm /> : <CreateForm />;
}

function CreateForm() {
  const { refresh } = useSession();
  const form = useForm<CreatePasswordValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors } = form.formState;
  const mutation = useMutation({
    mutationFn: (values: CreatePasswordValues) => authService.createPassword({ password: values.password }),
    onSuccess: async () => {
      toast.success("Password created. You can now log in with your email too.");
      form.reset();
      await refresh();
    },
    onError: (error) => showServerError(error, form.setError),
  });

  return (
    <form
      noValidate
      className="max-w-md space-y-4 rounded-2xl border border-border bg-surface p-5"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <p className="text-sm text-muted">
        You log in with Google or GitHub. Add a password if you also want to log in with your email.
      </p>
      {field(
        "set-password",
        "Password",
        errors.password?.message,
        <Input
          id="set-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "set-password-error" : undefined}
          {...form.register("password")}
        />,
        "At least 8 characters.",
      )}
      {field(
        "set-confirm",
        "Confirm password",
        errors.confirm?.message,
        <Input
          id="set-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirm ? true : undefined}
          aria-describedby={errors.confirm ? "set-confirm-error" : undefined}
          {...form.register("confirm")}
        />,
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Create password"}
      </Button>
    </form>
  );
}

function ChangeForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirm: "" },
  });
  const { errors } = form.formState;
  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) =>
      authService.changePassword({ currentPassword: values.currentPassword, password: values.password }),
    onSuccess: () => {
      toast.success("Password changed");
      form.reset();
    },
    onError: (error) => {
      // The API names the field current_password, the form calls it currentPassword.
      if (error instanceof ApiError && error.fields.current_password) {
        form.setError("currentPassword", { type: "server", message: error.fields.current_password });
        if (error.fields.password)
          form.setError("password", { type: "server", message: error.fields.password });
        return;
      }
      showServerError(error, form.setError);
    },
  });

  return (
    <form
      noValidate
      className="max-w-md space-y-4 rounded-2xl border border-border bg-surface p-5"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      {field(
        "current-password",
        "Current password",
        errors.currentPassword?.message,
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.currentPassword ? true : undefined}
          aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
          {...form.register("currentPassword")}
        />,
      )}
      {field(
        "change-password",
        "New password",
        errors.password?.message,
        <Input
          id="change-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "change-password-error" : undefined}
          {...form.register("password")}
        />,
        "At least 8 characters.",
      )}
      {field(
        "change-confirm",
        "Confirm new password",
        errors.confirm?.message,
        <Input
          id="change-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirm ? true : undefined}
          aria-describedby={errors.confirm ? "change-confirm-error" : undefined}
          {...form.register("confirm")}
        />,
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
