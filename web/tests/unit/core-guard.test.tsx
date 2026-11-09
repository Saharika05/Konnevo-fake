import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const session = vi.hoisted(() => ({ value: { user: null as null | { role: string }, isLoading: false } }));

vi.mock("@/lib/session", () => ({ useSession: () => session.value }));
vi.mock("next/navigation", () => ({
  // The real notFound() throws; the page then shows the 404. Here a throw is enough to prove it was called.
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import { CoreGuard } from "@/components/core/core-guard";

function renderAs(user: null | { role: string }, isLoading = false) {
  session.value = { user, isLoading };
  return () => render(<CoreGuard>secret core page</CoreGuard>);
}

describe("CoreGuard", () => {
  it("shows the page to a core user", () => {
    renderAs({ role: "core" })();
    expect(screen.getByText("secret core page")).toBeInTheDocument();
  });

  it.each([["student"], ["club_admin"]])("gives a %s the 404, never the page", (role) => {
    const run = renderAs({ role });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(run).toThrow("NEXT_NOT_FOUND");
  });

  it("gives a visitor the 404 as well", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(renderAs(null)).toThrow("NEXT_NOT_FOUND");
  });

  it("waits while the session loads instead of flashing a 404", () => {
    renderAs(null, true)();
    expect(screen.queryByText("secret core page")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
