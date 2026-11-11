// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("@/lib/request-user", () => ({ requestUser: mocks.user }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { update: mocks.update, findUnique: mocks.find },
    movieFact: { create: mocks.create },
  },
}));
vi.mock("@/lib/openai", () => ({ generateMovieFact: mocks.generate }));
import { GET as me } from "../src/app/api/me/route";
import { PUT as movie } from "../src/app/api/me/movie/route";
import { GET as fact } from "../src/app/api/fact/route";
const user = {
  id: "alice",
  name: null,
  email: "alice@example.com",
  image: null,
  favoriteMovie: "Interstellar",
};
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/me/movie", {
    method: "PUT",
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue(user);
});
describe("authenticated route contracts", () => {
  it.each([me, fact, () => movie(request({ movie: "Inception" }))])(
    "rejects unsigned requests",
    async (handler) => {
      mocks.user.mockResolvedValue(null);
      const response = await handler();
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: { code: "UNAUTHORIZED" },
      });
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.generate).not.toHaveBeenCalled();
    },
  );
  it("returns only the current user without caching", async () => {
    const response = await me();
    expect(await response.json()).toEqual({ user });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it.each([
    null,
    {},
    { movie: 2 },
    { movie: " " },
    { movie: "A" },
    { movie: "x".repeat(121) },
  ])("rejects invalid input %j before writing", async (body) => {
    expect((await movie(request(body))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    expect(
      (
        await movie(
          new NextRequest("http://localhost/api/me/movie", {
            method: "PUT",
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("trims input and ignores an attacker-supplied user ID", async () => {
    mocks.update.mockResolvedValue({ favoriteMovie: "Inception" });
    expect(
      await (
        await movie(request({ movie: "  Inception  ", userId: "bob" }))
      ).json(),
    ).toEqual({ movie: "Inception" });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "alice" },
      data: { favoriteMovie: "Inception" },
      select: { favoriteMovie: true },
    });
  });
  it.each([me, fact, () => movie(request({ movie: "Inception" }))])(
    "normalizes authentication/database lookup errors",
    async (handler) => {
      mocks.user.mockRejectedValue(new Error("private connection details"));
      const response = await handler();
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      });
    },
  );
  it("normalizes write failures", async () => {
    mocks.update.mockRejectedValue(new Error("private"));
    expect((await movie(request({ movie: "Inception" }))).status).toBe(500);
  });
  it("requires onboarding before spending tokens", async () => {
    mocks.user.mockResolvedValue({ ...user, favoriteMovie: null });
    expect((await fact()).status).toBe(409);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("generates and persists for the session's user and saved movie", async () => {
    mocks.generate.mockResolvedValue("A movie fact");
    mocks.find.mockResolvedValue({ favoriteMovie: "Interstellar" });
    mocks.create.mockResolvedValue({
      id: "f",
      movie: "Interstellar",
      text: "A movie fact",
      createdAt: new Date(0),
    });
    const response = await fact();
    expect(response.status).toBe(200);
    expect(mocks.generate).toHaveBeenCalledWith("Interstellar");
    expect(mocks.create).toHaveBeenCalledWith({
      data: { userId: "alice", movie: "Interstellar", text: "A movie fact" },
    });
    expect(await response.json()).toEqual({
      fact: {
        id: "f",
        movie: "Interstellar",
        text: "A movie fact",
        createdAt: new Date(0).toISOString(),
      },
    });
  });
  it("discards generation if the saved movie changed", async () => {
    mocks.generate.mockResolvedValue("Old fact");
    mocks.find.mockResolvedValue({ favoriteMovie: "Inception" });
    expect((await fact()).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each(["timeout", "401", "quota", "empty completion"])(
    "handles generation failure: %s",
    async (reason) => {
      mocks.generate.mockRejectedValue(new Error(reason));
      const response = await fact();
      expect(response.status).toBe(503);
      expect(mocks.create).not.toHaveBeenCalled();
      expect(await response.json()).toMatchObject({
        error: { code: "FACT_UNAVAILABLE" },
      });
    },
  );
  it("handles fact persistence failure", async () => {
    mocks.generate.mockResolvedValue("Fact");
    mocks.find.mockResolvedValue({ favoriteMovie: "Interstellar" });
    mocks.create.mockRejectedValue(new Error("private"));
    const response = await fact();
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: { code: "INTERNAL_ERROR" },
    });
  });
});
