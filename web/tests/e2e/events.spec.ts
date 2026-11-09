import { expect, test } from "@playwright/test";
import { login, STUDENT } from "./helpers";

test("visitors can browse events, search, and load more @mobile", async ({ page }) => {
  await page.goto("/events");
  const cards = page.locator('a[href^="/events/"]');
  await expect(cards.first()).toBeVisible();
  // 12 per page, then Load more brings the rest.
  await expect(page.getByRole("button", { name: "Load more" })).toBeVisible();
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);

  await page.getByPlaceholder("Search by name, club or topic").fill("hackfest");
  await expect(page).toHaveURL(/q=hackfest/);
  await expect(page.getByText("HackFest 2026").first()).toBeVisible();
});

test("a student can mark an event interested and undo it", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/events/hackfest-2026");
  const mark = page.getByRole("button", { name: "I am interested" });
  await mark.click();
  await expect(page.getByRole("button", { name: "You are interested" })).toBeVisible();
  await page.getByRole("button", { name: "You are interested" }).click();
  await expect(page.getByRole("button", { name: "I am interested" })).toBeVisible();
});

test("a visitor is asked to log in to say they are interested", async ({ page }) => {
  await page.goto("/events/hackfest-2026");
  await expect(page.getByRole("link", { name: "Log in to say you are interested" })).toBeVisible();
});
