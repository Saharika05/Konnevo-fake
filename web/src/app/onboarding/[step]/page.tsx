import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOTAL_STEPS } from "@/lib/onboarding";
import { OnboardingView } from "@/components/onboarding-view";
import { RequireRole } from "@/components/route-guard";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { step } = await params;
  const { edit } = await searchParams;
  const number = Number(step);
  if (!Number.isInteger(number) || number < 1 || number > TOTAL_STEPS) notFound();

  return (
    <RequireRole role="student" requireOnboarded={false}>
      <OnboardingView step={number} editing={edit === "1" && number < TOTAL_STEPS} />
    </RequireRole>
  );
}
