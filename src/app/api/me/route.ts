import { requestUser } from "@/lib/request-user";
import { apiError, withApiErrors } from "@/lib/api-errors";
import type { MeResponse } from "@/lib/contracts";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return withApiErrors(async () => {
    const user = await requestUser();
    if (!user) return apiError("UNAUTHORIZED", "Sign in to continue.", 401);
    return NextResponse.json<MeResponse>(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
