import { z } from "zod";

const EVENT_TYPES = ["hackathon", "meetup", "conference", "workshop"] as const;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

export const eventSchema = z
  .object({
    // Brief: title 100, description 2000.
    title: z.string().trim().min(2, "Give the event a title").max(100, "Keep it under 100 characters"),
    type: z.enum(EVENT_TYPES, { message: "Pick a type" }),
    mode: z.enum(["online", "offline"], { message: "Pick online or offline" }),
    startDate: date,
    endDate: z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Pick a date"),
    place: z.string().trim().min(2, "Enter the venue or the link").max(200, "Keep it under 200 characters"),
    registrationUrl: z
      .string()
      .trim()
      .min(1, "Add the registration link")
      .max(300, "That link is too long")
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      }, "Enter a full link starting with https://"),
    description: z
      .string()
      .trim()
      .min(10, "Write at least 10 characters")
      .max(2000, "Keep it under 2000 characters"),
  })
  .refine((values) => values.endDate === "" || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "The end date cannot be before the start date",
  });

export type EventFormValues = z.infer<typeof eventSchema>;
