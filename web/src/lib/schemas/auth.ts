import { z } from "zod";

const email = z.string().trim().min(1, "Enter your email").email("Enter a valid email");

/** App password: minimum 8 characters. */
const newPassword = z.string().min(8, "Use at least 8 characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const createPasswordSchema = z
  .object({ password: newPassword, confirm: z.string().min(1, "Repeat the password") })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "The passwords do not match",
  });
export type CreatePasswordValues = z.infer<typeof createPasswordSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const feedbackSchema = z.object({
  message: z.string().trim().min(3, "Please write a little more").max(1000, "Keep it under 1000 characters"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: newPassword,
    confirm: z.string().min(1, "Repeat the new password"),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "The passwords do not match",
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
