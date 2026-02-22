import { NextRequest, NextResponse } from "next/server";
import { testConnectionPayload } from "@/infrastructure/redis/redisClient";
import { ApiResponse, RedisConnectionUpsertRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const body = (await request.json()) as RedisConnectionUpsertRequest;

  if (useMocks) {
    const mock: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Connection ok (mock).",
      reasons: [],
      data: true,
    };
    return NextResponse.json(mock);
  }

  try {
    await testConnectionPayload(body);
    const response: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Connection ok.",
      reasons: [],
      data: true,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "Failed to connect to Redis.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: false,
    };
    return NextResponse.json(response, { status: 400 });
  }
}
