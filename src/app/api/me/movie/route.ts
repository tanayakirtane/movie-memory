import { NextRequest, NextResponse } from "next/server";
import { requestUser } from "@/lib/request-user";
import { db } from "@/lib/db";
import { movieSchema } from "@/lib/movie";
import { apiError, withApiErrors } from "@/lib/api-errors";
import type { MovieResponse } from "@/lib/contracts";
export const runtime = "nodejs";
export async function PUT(request: NextRequest) {
  return withApiErrors(async () => {
    const user = await requestUser();
    if (!user) return apiError("UNAUTHORIZED", "Sign in to continue.", 401);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("INVALID_INPUT", "Send a valid JSON object.", 400);
    }
    const result = movieSchema.safeParse(body);
    if (!result.success)
      return apiError(
        "INVALID_INPUT",
        result.error.issues[0]?.message ?? "Invalid movie.",
        400,
      );
    const updated = await db.user.update({
      where: { id: user.id },
      data: { favoriteMovie: result.data.movie },
      select: { favoriteMovie: true },
    });
    return NextResponse.json<MovieResponse>(
      { movie: updated.favoriteMovie! },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
