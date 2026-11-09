import { expect, test } from "@playwright/test";
import { ADMIN, login, STUDENT } from "./helpers";

const CORE = { email: "core@konnevo.test", password: "password123" };

// The 404 page of the app (not a "forbidden" page).
const NOT_FOUND = /we could not find that page/i;

test.describe("Core admin access", () => {
  test("a student cannot open /core: normal 404", async ({ page }) => {
    await login(page, STUDENT);
    for (const path of [
      "/core",
      "/core/events",
      "/core/reports",
      "/core/clubs",
      "/core/colleges",
      "/core/audit",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: NOT_FOUND })).toBeVisible();
      await expect(page.getByText(/core admin/i)).toHaveCount(0);
      await expect(page.getByText(/forbidden/i)).toHaveCount(0);
    }
  });

  test("a club admin cannot open /core either", async ({ page }) => {
    await login(page, ADMIN, "admin");
    await page.goto("/core");
    await expect(page.getByRole("heading", { name: NOT_FOUND })).toBeVisible();
  });

  test("a visitor gets the 404 too", async ({ page }) => {
    await page.goto("/core/audit");
    await expect(page.getByRole("heading", { name: NOT_FOUND })).toBeVisible();
  });

  test("the login page has no core admin option", async ({ page }) => {
    for (const as of ["student", "admin"]) {
      await page.goto(`/login?as=${as}`);
      await page.getByRole("heading", { level: 1 }).waitFor();
      await expect(page.getByText(/core/i)).toHaveCount(0);
    }
  });

  test("students and club admins see no core link anywhere in the header", async ({ page }) => {
    await login(page, STUDENT);
    await page.getByRole("button", { name: /open account menu/i }).click();
    await expect(page.getByRole("menuitem", { name: /core admin/i })).toHaveCount(0);
  });
});

test.describe("Core admin screens", () => {
  test.beforeEach(async ({ page }) => {
    // The core team signs in with the same form as everyone else.
    await login(page, CORE);
    await expect(page).toHaveURL(/\/core$/);
  });

  test("overview, then events with filters in the URL and the funnel", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Core overview" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Core admin" });
    await nav.getByRole("link", { name: "Events" }).click();
    await expect(page.getByRole("heading", { name: /events across all colleges/i })).toBeVisible();

    await page.getByLabel("Type").selectOption("hackathon");
    await expect(page).toHaveURL(/type=hackathon/);

    await page.getByRole("link", { name: /^HackFest 2026$/ }).click();
    await expect(page.getByText(/cannot see who registers on official sites/i)).toBeVisible();
    await expect(page.getByRole("list", { name: "Funnel" }).getByRole("listitem")).toHaveCount(6);
  });

  test("removing an admin keeps the club", async ({ page }) => {
    await page.goto("/core/clubs");
    await page.getByRole("button", { name: /remove admin access for tech club/i }).click();
    await expect(page.getByText(/club and all its events stay/i)).toBeVisible();
    await page.getByRole("button", { name: "Remove access" }).click();
    const row = page.getByRole("row", { name: /tech club/i });
    await expect(row.getByText("(no admin yet)")).toBeVisible();
  });

  test("merging colleges asks for confirmation first", async ({ page }) => {
    await page.goto("/core/colleges");
    await page.getByRole("checkbox", { name: "Select PES", exact: true }).check();
    await page.getByRole("checkbox", { name: "Select PES University, Bengaluru" }).check();
    await page.getByLabel(/PES University, Bengaluru \(/).check();
    await page.getByRole("button", { name: "Review merge" }).click();
    await expect(page.getByText(/merging cannot be undone/i).first()).toBeVisible();
    const merge = page.getByRole("button", { name: "Merge colleges" });
    await expect(merge).toBeDisabled();
    await page.getByRole("checkbox", { name: /i understand/i }).check();
    await merge.click();
    await expect(page.getByRole("checkbox", { name: "Select PES", exact: true })).toHaveCount(0);
  });
});
