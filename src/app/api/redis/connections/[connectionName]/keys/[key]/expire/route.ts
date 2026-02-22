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
  const body = (await request.json()) as { ttlSeconds?: number | null };

  if (useMocks) {
    const mock: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Expiry updated (mock).",
      reasons: [],
      data: true,
    };
    return NextResponse.json(mock);
  }

  try {
    const dbIndex = db ? Number(db) : undefined;
    await withRedisClient(connectionName, dbIndex, async (client) => {
      if (body?.ttlSeconds === null || body?.ttlSeconds === undefined) {
        await client.persist(key);
      } else {
        await client.expire(key, body.ttlSeconds);
      }
    });
    const response: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Expiry updated.",
      reasons: [],
      data: true,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "Failed to update expiry.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
