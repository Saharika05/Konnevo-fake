import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return (
    <LegalPage
      title="Privacy"
      updated="October 2026"
      intro={`This is a plain-language draft of how ${APP_NAME} treats your information. The konnevo team will review and replace it before launch.`}
      sections={[
        {
          heading: "What we collect",
          body: [
            "The details you give us: your name, email, college, year, skills, interests, links, projects and experience.",
            "What you do in the app: events you mark interested, people you slide on, matches and teams.",
          ],
        },
        {
          heading: "Who can see it",
          body: [
            "Other students see only what your privacy settings allow. You can hide your college, skills, LinkedIn link and GitHub link, stop being shown for matching, or hide your profile completely.",
            "Your LinkedIn and GitHub links are shown to people only after you both match.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            `We use your details to show you events, suggest people with similar skills, and run matching and teams. ${APP_NAME} does not sell your information.`,
          ],
        },
        {
          heading: "Your choices",
          body: [
            "Change what is shown at any time in Settings. You can block people, and delete your account, which removes your profile, projects, matches and teams.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about privacy can be sent through the feedback form on the About page."],
        },
      ]}
    />
  );
}
