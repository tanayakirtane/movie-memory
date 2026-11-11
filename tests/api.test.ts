import { describe, it, expect, vi, afterEach } from "vitest";
import { apiRequest, ApiClientError } from "../src/lib/api";
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
describe("typed API error normalization", () => {
  it("converts a 401 into a structured error", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "Sign in to continue." },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      );
    await expect(apiRequest("/api/me")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Sign in to continue.",
    });
  });
  it("handles server 500 even when the body is not JSON", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("broken", { status: 500 }));
    await expect(apiRequest("/api/fact")).rejects.toMatchObject({
      status: 500,
      code: "UNKNOWN_ERROR",
    });
  });
  it("normalizes an offline fetch error", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiRequest("/api/me")).rejects.toBeInstanceOf(ApiClientError);
    await expect(apiRequest("/api/me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});

it("rejects structurally invalid successful responses", async () => {
  const { api } = await import("../src/lib/api");
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ fact: { movie: "Interstellar" } })),
    );
  await expect(api.fact()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});
it("normalizes malformed error fields", async () => {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ error: { message: {}, code: [] } }), {
        status: 500,
      }),
    );
  await expect(apiRequest("/api/me")).rejects.toMatchObject({
    message: "Request failed (500).",
    code: "UNKNOWN_ERROR",
  });
});
it("rejects malformed success JSON", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{"));
  await expect(apiRequest("/api/me")).rejects.toMatchObject({
    code: "INVALID_RESPONSE",
  });
});
