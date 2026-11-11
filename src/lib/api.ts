import {
  apiErrorSchema,
  factResponseSchema,
  meSchema,
  movieResponseSchema,
} from "@/lib/contracts";
import type { z } from "zod";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  schema?: z.ZodType<T>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: new Headers(init?.headers),
    });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiClientError(
      "Network error. Check your connection.",
      0,
      "NETWORK_ERROR",
    );
  }
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(
      await response.json().catch(() => null),
    );
    const body = parsed.success ? parsed.data : null;
    throw new ApiClientError(
      body?.error?.message || `Request failed (${response.status}).`,
      response.status,
      body?.error?.code || "UNKNOWN_ERROR",
    );
  }
  try {
    const body: unknown = await response.json();
    return schema ? schema.parse(body) : (body as T);
  } catch {
    throw new ApiClientError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
}

export const api = {
  me: () => apiRequest("/api/me", undefined, meSchema),
  updateMovie: (movie: string) =>
    apiRequest(
      "/api/me/movie",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie }),
      },
      movieResponseSchema,
    ),
  fact: (signal?: AbortSignal) =>
    apiRequest("/api/fact", { signal }, factResponseSchema),
};
