import { expect, test } from "@playwright/test";
import { login, STUDENT } from "./helpers";

test("a student can log in and lands on events", async ({ page }) => {
  await login(page, STUDENT);
  await expect(page).toHaveURL(/\/events/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a wrong password shows a clear message", async ({ page }) => {
  await page.goto("/login?as=student");
  await page.getByLabel("Email").fill(STUDENT.email);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Wrong email or password.")).toBeVisible();
});

test("a logged-out visitor is sent to log in from a student page", async ({ page }) => {
  await page.goto("/my-teams");
  await expect(page).toHaveURL(/\/login/);
});

test("the skip link jumps to the main content @mobile", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
