import { expect, type Page } from "@playwright/test";

export const STUDENT = { email: "student@konnevo.test", password: "password123" };
export const ADMIN = { email: "admin@techclub.test", password: "password123" };

/** Logs in through the login form. Each test has its own browser storage, so each starts fresh. */
export async function login(page: Page, who: typeof STUDENT, as: "student" | "admin" = "student") {
  await page.goto(`/login?as=${as}`);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
