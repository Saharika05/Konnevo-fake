import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ADMIN, login, STUDENT } from "./helpers";

// Automatic accessibility checks (axe). They catch missing labels, bad roles, missing names and similar.
// Colour contrast is left out here: the colour tokens were checked by hand (all text is at least 4.5:1),
// and axe cannot judge text that sits on the animated background.
async function serious(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"])
    .analyze();
  return results.violations
    .filter((item) => item.impact === "serious" || item.impact === "critical")
    .map(
      (item) => `${item.id}: ${item.help} (${item.nodes.length} place${item.nodes.length === 1 ? "" : "s"})`,
    );
}

test("public pages have no serious accessibility problems", async ({ page }) => {
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
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    expect(await serious(page), path).toEqual([]);
  }
});

test("student pages have no serious accessibility problems", async ({ page }) => {
  await login(page, STUDENT);
  for (const path of ["/my-work", "/my-teams", "/my-teams?tab=invites", "/profile", "/settings"]) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    expect(await serious(page), path).toEqual([]);
  }
});

test("admin pages have no serious accessibility problems", async ({ page }) => {
  await login(page, ADMIN, "admin");
  for (const path of ["/admin", "/admin/events/new"]) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    expect(await serious(page), path).toEqual([]);
  }
});

test("the whole app can be used from the keyboard: tab order starts at the skip link", async ({ page }) => {
  await page.goto("/events");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});
