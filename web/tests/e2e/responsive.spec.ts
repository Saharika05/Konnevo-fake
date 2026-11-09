import { expect, test, type Page } from "@playwright/test";
import { login, STUDENT } from "./helpers";

// These run on a phone-sized screen (the "phone" project runs everything tagged @mobile).

/** True when the page scrolls sideways, which means something is wider than the screen. */
async function scrollsSideways(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

test("public pages fit a phone screen @mobile", async ({ page }) => {
  for (const path of [
    "/",
    "/events",
    "/events/hackfest-2026",
    "/about",
    "/privacy",
    "/terms",
    "/login?as=student",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(await scrollsSideways(page), `${path} scrolls sideways`).toBe(false);
  }
});

test("student pages fit a phone screen @mobile", async ({ page }) => {
  await login(page, STUDENT);
  for (const path of ["/events", "/my-work", "/my-teams", "/my-teams?tab=invites", "/profile", "/settings"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(await scrollsSideways(page), `${path} scrolls sideways`).toBe(false);
  }
});

test("the phone menu opens and leads to My Teams @mobile", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/events");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: /My Teams/ }).click();
  await expect(page).toHaveURL(/\/my-teams/);
});

test("the match slider has working buttons on a phone @mobile", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/events/hackfest-2026");
  await page.locator('a[href*="/people/"]').first().click();
  await expect(page.getByRole("button", { name: /^Skip/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Match/ })).toBeVisible();
  expect(await scrollsSideways(page)).toBe(false);
});
