import { z } from "zod";

export const movieSchema = z.object({
  movie: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(120, "Use 120 characters or fewer."),
});
export type MovieInput = z.infer<typeof movieSchema>;
