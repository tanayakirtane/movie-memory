import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiErrorBody } from "@/lib/contracts";
export function apiError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function withApiErrors(
  action: () => Promise<Response>,
): Promise<Response> {
  try {
    return await action();
  } catch {
    return apiError(
      "INTERNAL_ERROR",
      "Something went wrong. Please try again.",
      500,
    );
  }
}
