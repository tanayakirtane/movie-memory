// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.find } } }));
import { requestUser } from "../src/lib/request-user";
beforeEach(() => vi.resetAllMocks());
it.each([null, {}, { user: {} }, { error: "Configuration" }])(
  "rejects absent or invalid session %j",
  async (session) => {
    mocks.auth.mockResolvedValue(session);
    expect(await requestUser()).toBeNull();
    expect(mocks.find).not.toHaveBeenCalled();
  },
);
it("looks up only the session identity and selects public fields", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "alice" } });
  mocks.find.mockResolvedValue({ id: "alice" });
  await requestUser();
  expect(mocks.find).toHaveBeenCalledWith({
    where: { id: "alice" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      favoriteMovie: true,
    },
  });
});
it("rejects a deleted user's stale session", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "deleted" } });
  mocks.find.mockResolvedValue(null);
  expect(await requestUser()).toBeNull();
});
