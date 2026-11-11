import type { FactResponse } from "@/lib/contracts";
export type CachedFact = {
  movie: string;
  savedAt: number;
  fact: FactResponse["fact"];
};
export const FACT_CACHE_MS = 30_000;
export function getFreshFact(
  cache: CachedFact | null,
  movie: string,
  now: number,
): FactResponse["fact"] | null {
  if (!cache || cache.movie !== movie) return null;
  if (now < cache.savedAt || now - cache.savedAt >= FACT_CACHE_MS) return null;
  return cache.fact;
}
