import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/lib/services/profile";

/**
 * The onboarding steps. The brief leaves step 2 undefined, so step 2 is the
 * profile photo for now. To change the number or order of steps, change this list.
 */
export const ONBOARDING_STEPS = [
  { title: "The basics", hint: "Who are you?" },
  { title: "Your photo", hint: "Put a face to the name." },
  { title: "Skills and interests", hint: "What can you build, and what excites you?" },
  { title: "Your links", hint: "Optional. Show your work elsewhere." },
  { title: "Your work", hint: "Add a real project, if you have one." },
  { title: "Privacy", hint: "You decide who sees what." },
  { title: "Review and finish", hint: "One last look." },
] as const;

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export const PROFILE_KEY = ["profile", "me"] as const;
export const PRIVACY_KEY = ["profile", "privacy"] as const;
export const PROJECTS_KEY = ["projects", "mine"] as const;
export const EXPERIENCE_KEY = ["experience", "mine"] as const;

/** The logged-in student's profile. Shared by onboarding and the Profile page. */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: profileService.me,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
