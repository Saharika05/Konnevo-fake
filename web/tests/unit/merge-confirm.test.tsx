import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("nuqs", () => ({
  parseAsInteger: { withDefault: () => ({}) },
  useQueryState: () => [1, vi.fn()],
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { MergeConfirmDialog } from "@/components/core/colleges-view";
import { mergeSummary } from "@/lib/core/logic";

const row = (id: string, name: string, students: number, clubs: number) => ({
  id,
  name,
  nameKey: name.toLowerCase(),
  students,
  clubs,
  createdAt: "2026-01-01",
});

describe("Merge confirmation", () => {
  const summary = mergeSummary([row("1", "PES University, Bengaluru", 301, 2), row("2", "PES", 31, 1)], "1");

  it("warns that it cannot be undone and keeps Merge off until the person agrees", async () => {
    const onConfirm = vi.fn();
    render(
      <MergeConfirmDialog open summary={summary} pending={false} onConfirm={onConfirm} onClose={() => {}} />,
    );

    expect(screen.getByText(/merging cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByText(/moves/i)).toHaveTextContent("31");
    const merge = screen.getByRole("button", { name: "Merge colleges" });
    expect(merge).toBeDisabled();

    await userEvent.click(merge);
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("checkbox", { name: /i understand/i }));
    expect(merge).toBeEnabled();
    await userEvent.click(merge);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
