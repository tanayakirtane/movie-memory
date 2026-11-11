import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  update: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("../src/lib/api")>()),
  api: { updateMovie: mocks.update },
}));
import { OnboardingForm } from "../src/components/onboarding-form";
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it("submits once and navigates only after persistence succeeds", async () => {
  let resolve!: (value: { movie: string }) => void;
  mocks.update.mockReturnValue(
    new Promise((a) => {
      resolve = a;
    }),
  );
  render(<OnboardingForm />);
  fireEvent.change(screen.getByLabelText("Your favorite movie"), {
    target: { value: "Interstellar" },
  });
  const form = screen.getByRole("button").closest("form")!;
  act(() => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.replace).not.toHaveBeenCalled();
  await act(async () => resolve({ movie: "Interstellar" }));
  expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
it("shows a failed save and lets the user retry", async () => {
  mocks.update
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ movie: "Interstellar" });
  render(<OnboardingForm />);
  fireEvent.change(screen.getByLabelText("Your favorite movie"), {
    target: { value: "Interstellar" },
  });
  fireEvent.submit(screen.getByRole("button").closest("form")!);
  await screen.findByRole("alert");
  expect(mocks.replace).not.toHaveBeenCalled();
  await act(async () =>
    fireEvent.submit(screen.getByRole("button").closest("form")!),
  );
  expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
});
