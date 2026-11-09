import { expect, test } from "@playwright/test";
import { login, STUDENT } from "./helpers";

test("accept the invite and see the team as Registered, with no certificate upload", async ({ page }) => {
  await login(page, STUDENT);
  await page.goto("/my-teams?tab=invites");
  await expect(page.getByText("Byte Benders")).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();

  // Accepting moves you to the Teams tab, where the status is Registered.
  await expect(page.getByText("Registered")).toBeVisible();
  // Attendance proof was removed: no upload button, no certificate text.
  await expect(page.getByRole("button", { name: /certificate/i })).toHaveCount(0);
  await expect(page.getByText(/certificate/i)).toHaveCount(0);
});
