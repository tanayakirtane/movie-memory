import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DashboardClient } from "../src/components/dashboard-client";
import { api } from "../src/lib/api";
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("../src/lib/api")>()),
  api: { fact: vi.fn(), updateMovie: vi.fn() },
}));
const user = {
  id: "alice",
  name: null,
  email: "alice@example.com",
  image: null,
  favoriteMovie: "Interstellar",
};
const fact = (movie = "Interstellar", text = "Original fact") => ({
  fact: { id: "f", movie, text, createdAt: new Date(0).toISOString() },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function edit(title: string) {
  fireEvent.click(screen.getByRole("button", { name: "Edit favorite movie" }));
  fireEvent.change(screen.getByLabelText("Edit favorite movie"), {
    target: { value: title },
  });
}
function save() {
  fireEvent.submit(
    screen.getByRole("button", { name: "Save" }).closest("form")!,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.fact).mockResolvedValue(fact());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("cancels without a write and rejects invalid input", async () => {
  render(<DashboardClient user={user} />);
  await screen.findByText("Original fact");
  edit("Inception");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(api.updateMovie).not.toHaveBeenCalled();
  edit("  ");
  save();
  expect(screen.getByRole("alert").textContent).toContain("2–120");
  expect(api.updateMovie).not.toHaveBeenCalled();
});
it("optimistically saves once and invalidates the previous movie's fact", async () => {
  const pending = deferred<{ movie: string }>();
  vi.mocked(api.updateMovie).mockReturnValue(pending.promise);
  render(<DashboardClient user={user} />);
  await screen.findByText("Original fact");
  edit("Inception");
  const form = screen.getByRole("button", { name: "Save" }).closest("form")!;
  act(() => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });
  expect(screen.getByRole("heading", { name: "Inception" })).toBeTruthy();
  expect(screen.queryByText("Original fact")).toBeNull();
  expect(api.updateMovie).toHaveBeenCalledTimes(1);
  vi.mocked(api.fact).mockResolvedValue(fact("Inception", "New fact"));
  await act(async () => pending.resolve({ movie: "Inception" }));
  await screen.findByText("New fact");
});
it("rolls back the optimistic title and shows a visible error", async () => {
  const pending = deferred<{ movie: string }>();
  vi.mocked(api.updateMovie).mockReturnValue(pending.promise);
  render(<DashboardClient user={user} />);
  await screen.findByText("Original fact");
  edit("Inception");
  save();
  await act(async () => pending.reject(new Error("failure")));
  expect(
    (screen.getByLabelText("Edit favorite movie") as HTMLInputElement).value,
  ).toBe("Interstellar");
  expect(screen.getByRole("alert").textContent).toContain("Unable to save");
});
it("discards an old response arriving after a successful edit", async () => {
  const old = deferred<ReturnType<typeof fact>>();
  vi.mocked(api.fact)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue(fact("Inception", "New fact"));
  vi.mocked(api.updateMovie).mockResolvedValue({ movie: "Inception" });
  render(<DashboardClient user={user} />);
  edit("Inception");
  save();
  await screen.findByText("New fact");
  await act(async () => old.resolve(fact()));
  expect(screen.queryByText("Original fact")).toBeNull();
  expect(screen.getByText("New fact")).toBeTruthy();
});
it("uses the cache before 30s, expires at 30s, and bypasses on explicit refresh", async () => {
  let now = 1000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  render(<DashboardClient user={user} />);
  await screen.findByText("Original fact");
  now = 30999;
  fireEvent(window, new Event("focus"));
  expect(api.fact).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Discover another fact" }),
  );
  await waitFor(() => expect(api.fact).toHaveBeenCalledTimes(2));
  await screen.findByText("Original fact");
  now = 60999;
  fireEvent(window, new Event("focus"));
  await waitFor(() => expect(api.fact).toHaveBeenCalledTimes(3));
});
it("keeps a usable cached fact when a forced refresh fails", async () => {
  render(<DashboardClient user={user} />);
  await screen.findByText("Original fact");
  vi.mocked(api.fact).mockRejectedValueOnce(new Error("offline"));
  fireEvent.click(
    screen.getByRole("button", { name: "Discover another fact" }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Could not refresh. Showing your last fact.",
  );
  fireEvent(window, new Event("focus"));
  expect(screen.getByText("Original fact")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(api.fact).toHaveBeenCalledTimes(2);
});
it("aborts the pending request on unmount", async () => {
  vi.mocked(api.fact).mockReturnValue(new Promise(() => {}));
  const view = render(<DashboardClient user={user} />);
  const signal = vi.mocked(api.fact).mock.calls[0][0];
  view.unmount();
  expect(signal?.aborted).toBe(true);
});
it("shows profile fallbacks when the remote avatar fails", async () => {
  render(
    <DashboardClient
      user={{ ...user, image: "https://lh3.googleusercontent.com/example" }}
    />,
  );
  await screen.findByText("Original fact");
  fireEvent.error(screen.getByAltText("Your Google profile"));
  expect(screen.queryByAltText("Your Google profile")).toBeNull();
  expect(screen.getByText("Movie lover")).toBeTruthy();
});
it("does not display trivia for a different saved movie", async () => {
  vi.mocked(api.fact).mockResolvedValue(fact("Inception", "Wrong movie"));
  render(<DashboardClient user={user} />);
  await screen.findByRole("alert");
  expect(screen.queryByText("Wrong movie")).toBeNull();
});
