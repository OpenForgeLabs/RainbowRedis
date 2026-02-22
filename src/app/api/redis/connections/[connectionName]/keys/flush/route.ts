import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string }> },
) {
  const { connectionName } = await params;
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";

  const dbParam = request.nextUrl.searchParams.get("db");
  const confirmName = request.nextUrl.searchParams.get("confirmName") ?? "";
  const db = dbParam ? Number(dbParam) : 0;

  if (useMocks) {
    const mock: ApiResponse<number> = {
      isSuccess: true,
      message: "Database flushed (mock).",
      reasons: [],
      data: 0,
    };
    return NextResponse.json(mock);
  }

  if (confirmName && confirmName !== connectionName) {
    const invalid: ApiResponse<number> = {
      isSuccess: false,
      message: "Confirmation name does not match.",
      reasons: ["confirmName must match the connection name."],
      data: 0,
    };
    return NextResponse.json(invalid, { status: 400 });
  }

  try {
    await withRedisClient(connectionName, db, (client) => client.flushDb());
    const response: ApiResponse<number> = {
      isSuccess: true,
      message: "Database flushed.",
      reasons: [],
      data: 0,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<number> = {
      isSuccess: false,
      message: "Failed to flush database.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: 0,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
