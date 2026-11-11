// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), constructor: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    constructor(options: unknown) {
      mocks.constructor(options);
    }
    chat = { completions: { create: mocks.create } };
  },
}));
import { generateMovieFact } from "../src/lib/openai";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
it("uses the configured model on the server with bounded retries/timeouts", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-placeholder");
  vi.stubEnv("OPENAI_MODEL", "configured-model");
  mocks.create.mockResolvedValue({
    choices: [{ message: { content: "  A fact  " } }],
  });
  expect(await generateMovieFact("Interstellar")).toBe("A fact");
  expect(mocks.constructor).toHaveBeenCalledWith({
    apiKey: "test-placeholder",
    timeout: 12000,
    maxRetries: 1,
  });
  expect(mocks.create.mock.calls[0][0]).toMatchObject({
    model: "configured-model",
  });
  expect(mocks.create.mock.calls[0][0].messages[1].content).toContain(
    '"Interstellar"',
  );
});
it("rejects missing credentials without making a request", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  await expect(generateMovieFact("Interstellar")).rejects.toThrow();
  expect(mocks.create).not.toHaveBeenCalled();
});
it("rejects empty completions", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-placeholder");
  mocks.create.mockResolvedValue({ choices: [{ message: { content: " " } }] });
  await expect(generateMovieFact("Interstellar")).rejects.toThrow("Empty fact");
});
