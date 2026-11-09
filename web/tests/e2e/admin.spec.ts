import { expect, test } from "@playwright/test";
import { ADMIN, login, STUDENT } from "./helpers";

test("a club admin publishes an event and sees it on the site", async ({ page }) => {
  await login(page, ADMIN, "admin");
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/events/new");
  await page.getByLabel("Title").fill("Robo Rumble");
  await page.getByLabel("Type").selectOption("meetup");
  await page.getByLabel("Mode").selectOption("offline");
  await page.getByLabel("Start date").fill("2030-01-10");
  await page.getByLabel("Place").fill("Main Hall");
  await page.getByLabel("Registration link").fill("https://example.com/register");
  await page.getByLabel(/Description/).fill("Build and battle robots all day long.");
  await page.getByRole("button", { name: "Publish event" }).click();

  // Published at once: we land on the event page.
  await expect(page.getByRole("heading", { name: "Robo Rumble" })).toBeVisible();
  await page.goto("/events?q=robo");
  await expect(page.getByText("Robo Rumble").first()).toBeVisible();
});

test("the form shows what is wrong", async ({ page }) => {
  await login(page, ADMIN, "admin");
  await page.goto("/admin/events/new");
  await page.getByRole("button", { name: "Publish event" }).click();
  await expect(page.getByText("Give the event a title")).toBeVisible();
});

test("an admin has no proofs page and no Register button on events", async ({ page }) => {
  await login(page, ADMIN, "admin");
  await page.goto("/admin/proofs");
  await expect(page.getByRole("heading", { name: /we could not find that page/i })).toBeVisible();
  await page.goto("/events");
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await expect(page.getByRole("link", { name: /^Register/ })).toHaveCount(0);
});

test("a student cannot open the admin pages", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/admin");
  await expect(page.getByText("You do not have access to this page")).toBeVisible();
});

test("settings: a privacy switch saves", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/settings");
  const sw = page.getByRole("switch", { name: "Show my college" });
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(page.getByRole("switch", { name: "Show my college" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});
