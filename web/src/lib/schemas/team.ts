import { z } from "zod";

/** The brief gives no limits for team fields, so only "not empty" is checked here. The API sends the rest. */
export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give your team a name (at least 2 letters)")
    .max(60, "Keep it under 60 characters"),
  eventId: z.string().min(1, "Choose an event"),
  myRole: z
    .string()
    .trim()
    .min(2, "Say what you will do, like Frontend")
    .max(40, "Keep it under 40 characters"),
  memberIds: z.array(z.string()),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
