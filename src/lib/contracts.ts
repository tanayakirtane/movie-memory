import { z } from "zod";

export const meSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
    favoriteMovie: z.string().nullable(),
  }),
});
export const movieResponseSchema = z.object({
  movie: z.string().trim().min(2).max(120),
});
export const factResponseSchema = z.object({
  fact: z.object({
    id: z.string().min(1),
    movie: z.string().min(2).max(120),
    text: z.string().trim().min(1),
    createdAt: z.iso.datetime(),
  }),
});
export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type MeResponse = z.infer<typeof meSchema>;
export type Me = MeResponse["user"];
export type MovieResponse = z.infer<typeof movieResponseSchema>;
export type FactResponse = z.infer<typeof factResponseSchema>;
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "NOT_ONBOARDED"
  | "FACT_UNAVAILABLE"
  | "INTERNAL_ERROR";
export type ApiErrorBody = { error: { code: ApiErrorCode; message: string } };
