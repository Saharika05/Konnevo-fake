"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import { feedbackSchema } from "@/lib/schemas/auth";
import { feedbackService } from "@/lib/services/feedback";
import { showServerError } from "@/lib/form-errors";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FeedbackValues = z.infer<typeof feedbackSchema>;

/** The feedback form. It lives only on the About page. */
export function FeedbackForm({ onDone }: { onDone?: () => void }) {
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { message: "", email: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: feedbackService.send,
    onSuccess: () => {
      toast.success("Got it. Thank you!");
      form.reset();
      onDone?.();
    },
    onError: (error) => showServerError(error, form.setError),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate({ message: values.message, email: values.email || undefined }),
      )}
      noValidate
      className="space-y-4"
    >
      <FormField id="feedback-message" label="Your message" error={errors.message?.message}>
        <Textarea
          id="feedback-message"
          placeholder="What should we build next?"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "feedback-message-error" : undefined}
          {...form.register("message")}
        />
      </FormField>
      <FormField id="feedback-email" label="Email (optional)" error={errors.email?.message}>
        <Input
          id="feedback-email"
          type="email"
          placeholder="you@college.edu"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "feedback-email-error" : undefined}
          {...form.register("email")}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending..." : "Send it"}
      </Button>
    </form>
  );
}
