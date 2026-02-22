import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string; key: string }> },
) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const { connectionName, key } = await params;
  const db = request.nextUrl.searchParams.get("db");
  const body = (await request.json()) as { newKey?: string };

  if (useMocks) {
    const mock: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Renamed (mock).",
      reasons: [],
      data: true,
    };
    return NextResponse.json(mock);
  }

  if (!body?.newKey) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "New key is required",
      reasons: ["newKey is missing"],
      data: false,
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const dbIndex = db ? Number(db) : undefined;
    await withRedisClient(connectionName, dbIndex, (client) =>
      client.rename(key, body.newKey ?? ""),
    );
    const response: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Renamed.",
      reasons: [],
      data: true,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "Failed to rename key.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
