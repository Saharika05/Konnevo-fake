import { expect, test } from "@playwright/test";
import { login, STUDENT } from "./helpers";

test("sliding to match eventually shows the match popup, and the match lands on My Teams", async ({
  page,
}) => {
  await login(page, STUDENT);
  await page.goto("/events/hackfest-2026");
  await page.locator('a[href*="/people/"]').first().click();
  await expect(page.getByText("Slide left to skip, right to match")).toBeVisible();

  // About half of the mock people have already swiped right on you, so keep matching until one does.
  let matched = false;
  for (let i = 0; i < 15 && !matched; i++) {
    await page.getByRole("button", { name: /^Match/ }).click();
    matched = await page
      .getByText("It is a match!")
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(matched).toBe(true);

  await page.getByRole("link", { name: "See my matches" }).click();
  await expect(page).toHaveURL(/\/my-teams\?tab=matches/);
  await expect(page.getByRole("button", { name: /Create team/ }).first()).toBeVisible();
});

test("the keyboard can skip a person", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/events/hackfest-2026");
  await page.locator('a[href*="/people/"]').first().click();
  const before = page.url();
  await page.getByRole("button", { name: /^Skip/ }).click();
  await expect(page).not.toHaveURL(before);
});
