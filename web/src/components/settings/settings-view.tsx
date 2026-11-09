"use client";

import * as React from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { AccountSection } from "@/components/settings/account-section";
import { BlockedSection } from "@/components/settings/blocked-section";
import { PasswordSection } from "@/components/settings/password-section";
import { PrivacySection } from "@/components/settings/privacy-section";
import { useSession } from "@/lib/session";

const SECTIONS = ["privacy", "password", "blocked", "account"] as const;

export function SettingsView() {
  const { user } = useSession();
  const [section, setSection] = useQueryState(
    "section",
    parseAsStringLiteral(SECTIONS).withDefault("privacy"),
  );

  const labels: Record<(typeof SECTIONS)[number], string> = {
    privacy: "Privacy",
    password: user?.hasPassword ? "Change password" : "Create password",
    blocked: "Blocked people",
    account: "Account",
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Settings</h1>
      <p className="mt-1 text-muted">Control who sees you and how you log in.</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={section === item ? "page" : undefined}
              onClick={() => void setSection(item)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold whitespace-nowrap transition-colors",
                section === item ? "bg-surface text-foreground shadow" : "text-muted hover:text-foreground",
              )}
            >
              {labels[item]}
            </button>
          ))}
        </nav>

        <section aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="mb-4 text-xl font-extrabold tracking-tight">
            {labels[section]}
          </h2>
          {section === "privacy" && <PrivacySection />}
          {section === "password" && <PasswordSection />}
          {section === "blocked" && <BlockedSection />}
          {section === "account" && <AccountSection />}
        </section>
      </div>
    </div>
  );
}
