import { describe, expect, it } from "vitest";
import {
  activeCoreHref,
  adminErrorMessage,
  canReview,
  CORE_NAV,
  duplicateGroups,
  eventsCsvFileName,
  isCoreRole,
  mergeSummary,
} from "@/lib/core/logic";
import { addAdminFormSchema } from "@/lib/core/schemas";

const college = (id: string, name: string, students = 10, clubs = 1) => ({
  id,
  name,
  nameKey: name.toLowerCase(),
  students,
  clubs,
  createdAt: "2026-01-01",
});

describe("role check", () => {
  it("only the core role may see the core section", () => {
    expect(isCoreRole("core")).toBe(true);
    expect(isCoreRole("student")).toBe(false);
    expect(isCoreRole("club_admin")).toBe(false);
    expect(isCoreRole(undefined)).toBe(false);
    expect(isCoreRole(null)).toBe(false);
  });
  it("sidebar items are in the agreed order", () => {
    expect(CORE_NAV.map((item) => item.label)).toEqual([
      "Overview",
      "Events",
      "Reports",
      "Clubs and admins",
      "Colleges",
      "Audit log",
    ]);
    expect(activeCoreHref("/core")).toBe("/core");
    expect(activeCoreHref("/core/events/ev-3")).toBe("/core/events");
  });
});

describe("CSV file name", () => {
  it("is konnevo_events_YYYY-MM-DD.csv", () => {
    expect(eventsCsvFileName(new Date(2026, 9, 5))).toBe("konnevo_events_2026-10-05.csv");
  });
});

describe("duplicate colleges", () => {
  it("flags names where one is inside the other", () => {
    const groups = duplicateGroups([
      college("1", "PES University, Bengaluru"),
      college("2", "PES"),
      college("3", "XYZ College"),
      college("4", "xyz college of engg"),
      college("5", "Tech University"),
    ]);
    expect(groups.get("1")).toBe(groups.get("2"));
    expect(groups.get("3")).toBe(groups.get("4"));
    expect(groups.get("1")).not.toBe(groups.get("3"));
    expect(groups.has("5")).toBe(false);
  });
});

describe("merge summary", () => {
  it("adds up what moves into the kept college", () => {
    const a = college("a", "A", 100, 2);
    const b = college("b", "B", 30, 1);
    const c = college("c", "C", 5, 0);
    const summary = mergeSummary([a, b, c], "a");
    expect(summary.students).toBe(35);
    expect(summary.clubs).toBe(1);
    expect(summary.keep?.id).toBe("a");
    expect(canReview([a, b], "a")).toBe(true);
    expect(canReview([a], "a")).toBe(false);
    expect(canReview([a, b], null)).toBe(false);
  });
});

describe("club admins", () => {
  it("checks the email format", () => {
    expect(addAdminFormSchema.safeParse({ clubId: "c1", email: "nope" }).success).toBe(false);
    expect(addAdminFormSchema.safeParse({ clubId: "", email: "a@b.edu" }).success).toBe(false);
    expect(addAdminFormSchema.safeParse({ clubId: "c1", email: " a@b.edu " }).success).toBe(true);
  });
  it("explains the 409 clearly", () => {
    expect(adminErrorMessage("club_has_admin", "x")).toMatch(/already has an admin/);
    expect(adminErrorMessage("other", "fallback")).toBe("fallback");
  });
});
