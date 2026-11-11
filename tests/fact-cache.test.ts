import { describe, it, expect } from "vitest";
import { getFreshFact } from "../src/lib/fact-cache";
const cached = {
  movie: "Arrival",
  savedAt: 1000,
  fact: {
    id: "fact1",
    movie: "Arrival",
    text: "A film fact",
    createdAt: new Date(0).toISOString(),
  },
};
describe("30-second movie-specific fact cache", () => {
  it("reuses facts before the cache expires", () =>
    expect(getFreshFact(cached, "Arrival", 30999)).toEqual(cached.fact));
  it("expires facts at exactly 30 seconds", () =>
    expect(getFreshFact(cached, "Arrival", 31000)).toBeNull());
  it("invalidates when the movie changes", () =>
    expect(getFreshFact(cached, "Interstellar", 1001)).toBeNull());
  it("does not reuse facts if system time goes backwards", () =>
    expect(getFreshFact(cached, "Arrival", 999)).toBeNull());
});
it("misses after expiration or with no cache", () => {
  expect(getFreshFact(cached, "Arrival", 31001)).toBeNull();
  expect(getFreshFact(null, "Arrival", 1000)).toBeNull();
});
