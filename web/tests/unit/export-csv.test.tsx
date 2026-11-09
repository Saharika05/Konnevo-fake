import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const exportEvents = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/superadmin", () => ({ superadminService: { exportEvents } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("nuqs", () => ({
  parseAsString: { withDefault: () => ({}) },
  parseAsInteger: { withDefault: () => ({}) },
  parseAsStringLiteral: () => ({}),
  useQueryStates: () => [{}, vi.fn()],
}));

import { ExportCsvButton } from "@/components/core/events-view";

function renderButton(filters: Record<string, string>) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ExportCsvButton filters={filters} />
    </QueryClientProvider>,
  );
}

describe("Export CSV button", () => {
  beforeEach(() => {
    exportEvents.mockReset();
    exportEvents.mockResolvedValue({ blob: new Blob(["a,b"], { type: "text/csv" }) });
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
  });

  it("exports the currently filtered list and saves konnevo_events_YYYY-MM-DD.csv", async () => {
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download);
    });

    renderButton({ type: "hackathon", q: "fest" });
    await userEvent.click(screen.getByRole("button", { name: /export csv/i }));

    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(exportEvents).toHaveBeenCalledWith({ type: "hackathon", q: "fest" });
    expect(downloads[0]).toMatch(/^konnevo_events_\d{4}-\d{2}-\d{2}\.csv$/);
    click.mockRestore();
  });

  it("is disabled while the file is being prepared", async () => {
    exportEvents.mockReturnValue(new Promise(() => {}));
    renderButton({});
    await userEvent.click(screen.getByRole("button", { name: /export csv/i }));
    expect(await screen.findByRole("button", { name: /exporting/i })).toBeDisabled();
  });
});
