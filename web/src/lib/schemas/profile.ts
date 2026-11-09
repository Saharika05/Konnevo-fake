import { z } from "zod";

export const YEARS = [
  { value: "1st", label: "1st year" },
  { value: "2nd", label: "2nd year" },
  { value: "3rd", label: "3rd year" },
  { value: "4th", label: "4th year" },
  { value: "5th", label: "5th year" },
  { value: "other", label: "Other" },
] as const;

export const LOOKING_FOR = [
  { value: "teammate", label: "A teammate" },
  { value: "learning", label: "Learning" },
  { value: "networking", label: "Networking" },
] as const;

export const MAX_CUSTOM_SKILLS = 10;

export const basicSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters").max(60, "Keep it under 60 characters"),
  college: z.string().trim().min(2, "Type your college").max(120, "Keep it under 120 characters"),
  year: z.enum(["1st", "2nd", "3rd", "4th", "5th", "other"], { message: "Pick your year" }),
  lookingFor: z.array(z.enum(["teammate", "learning", "networking"])).min(1, "Pick at least one"),
  bio: z.string().trim().max(300, "Keep it under 300 characters"),
});
export type BasicValues = z.infer<typeof basicSchema>;

function isHost(value: string, host: string): boolean {
  try {
    const url = new URL(value);
    const okProtocol = url.protocol === "https:" || url.protocol === "http:";
    return okProtocol && (url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

const profileLink = (host: string, label: string) =>
  z
    .string()
    .trim()
    .max(200, "That link is too long")
    .refine(
      (value) => value === "" || isHost(value, host),
      `Enter a full ${label} link, for example https://${host}/you`,
    );

/** Any normal web address, for a portfolio or personal site. */
const websiteLink = z
  .string()
  .trim()
  .max(200, "That link is too long")
  .refine((value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
    } catch {
      return false;
    }
  }, "Enter a full link, for example https://yourname.dev");

export const linksSchema = z.object({
  github: profileLink("github.com", "GitHub"),
  linkedin: profileLink("linkedin.com", "LinkedIn"),
  portfolio: websiteLink,
  discord: z
    .string()
    .trim()
    .max(40, "Keep it under 40 characters")
    .refine((value) => value === "" || /^[\w.#-]{2,40}$/.test(value), "Use letters, numbers, dots or underscores"),
  whatsapp: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\+?[\d\s-]{7,18}$/.test(value) && value.replace(/\D/g, "").length >= 7),
      "Enter a number with country code, for example +91 98765 43210",
    ),
  about: z.string().trim().max(1000, "Keep it under 1000 characters"),
});
export type LinksValues = z.infer<typeof linksSchema>;

export const customSkillSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(40, "Keep it under 40 characters");

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
export { splitTags };

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Give the project a title").max(80, "Keep it under 80 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters")
    .max(500, "Keep it under 500 characters"),
  techTags: z
    .string()
    .refine((value) => splitTags(value).length <= 10, "Use up to 10 tags")
    .refine(
      (value) => splitTags(value).every((tag) => tag.length <= 30),
      "Each tag must be under 30 characters",
    ),
  link: z
    .string()
    .trim()
    .max(300, "That link is too long")
    .refine((value) => {
      if (value === "") return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    }, "Enter a full link starting with https://"),
});
export type ProjectValues = z.infer<typeof projectSchema>;

export const EXPERIENCE_TYPES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "internship", label: "Internship" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

const month = z.string().regex(/^\d{4}-\d{2}$/, "Pick a month");

export const experienceSchema = z
  .object({
    type: z.enum(["hackathon", "internship", "event", "other"], { message: "Pick a type" }),
    title: z.string().trim().min(2, "Use at least 2 characters").max(80, "Keep it under 80 characters"),
    organisation: z
      .string()
      .trim()
      .min(2, "Enter the organisation or event")
      .max(100, "Keep it under 100 characters"),
    startMonth: month,
    endMonth: z.string().refine((value) => value === "" || /^\d{4}-\d{2}$/.test(value), "Pick a month"),
    description: z.string().trim().max(500, "Keep it under 500 characters"),
  })
  .refine((values) => values.endMonth === "" || values.endMonth >= values.startMonth, {
    path: ["endMonth"],
    message: "The end cannot be before the start",
  });
export type ExperienceValues = z.infer<typeof experienceSchema>;
