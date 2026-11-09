import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Terms" };

export default function Page() {
  return (
    <LegalPage
      title="Terms"
      updated="October 2026"
      intro={`These are the draft rules for using ${APP_NAME}. The konnevo team will review and replace them before launch.`}
      sections={[
        {
          heading: "Who can use it",
          body: [
            "Students can join and use matching, teams and My Work. Club admins are added by the konnevo team and can post and manage their own club's events.",
          ],
        },
        {
          heading: "Be honest",
          body: [
            "Add real projects and real experience only. Misleading content can be reported and removed, and accounts that keep posting it can be closed.",
          ],
        },
        {
          heading: "Be kind",
          body: [
            "Treat other students with respect. Do not harass, spam or impersonate anyone. You can block or report people who do.",
          ],
        },
        {
          heading: "Events and teams",
          body: [
            `${APP_NAME} lists events posted by clubs. We do not run them, and registration happens on the event's own link. Teams are made by students, and ${APP_NAME} is not responsible for how a team works together.`,
          ],
        },
        {
          heading: "Closing your account",
          body: ["You can delete your account in Settings at any time."],
        },
      ]}
    />
  );
}
