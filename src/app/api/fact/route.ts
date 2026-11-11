import { NextResponse } from "next/server";
import { requestUser } from "@/lib/request-user";
import { apiError, withApiErrors } from "@/lib/api-errors";
import { db } from "@/lib/db";
import { generateMovieFact } from "@/lib/openai";
import type { FactResponse } from "@/lib/contracts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withApiErrors(async () => {
    const user = await requestUser();
    if (!user) return apiError("UNAUTHORIZED", "Sign in to continue.", 401);
    if (!user.favoriteMovie)
      return apiError("NOT_ONBOARDED", "Choose a favorite movie first.", 409);
    let text: string;
    try {
      text = await generateMovieFact(user.favoriteMovie);
    } catch {
      return apiError(
        "FACT_UNAVAILABLE",
        "Could not generate trivia right now. Please try again.",
        503,
      );
    }
    // Discard trivia if the movie changed during generation.
    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { favoriteMovie: true },
    });
    if (current?.favoriteMovie !== user.favoriteMovie)
      return apiError(
        "FACT_UNAVAILABLE",
        "Your movie changed. Please retry.",
        409,
      );
    const fact = await db.movieFact.create({
      data: { userId: user.id, movie: user.favoriteMovie, text },
    });
    return NextResponse.json<FactResponse>(
      {
        fact: {
          id: fact.id,
          movie: fact.movie,
          text: fact.text,
          createdAt: fact.createdAt.toISOString(),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
