import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse, RedisKeyInfo } from "@/lib/types";

const normalizeKeyType = (rawType: string | null | undefined) => {
  const value = (rawType ?? "").toLowerCase();
  if (value === "string") return "string";
  if (value === "hash") return "hash";
  if (value === "list") return "list";
  if (value === "set") return "set";
  if (value === "sortedset" || value === "zset") return "zset";
  if (value === "stream") return "stream";
  return "unknown";
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string; key: string }> },
) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const { connectionName, key } = await params;
  const db = request.nextUrl.searchParams.get("db");

  if (useMocks) {
    const mock: ApiResponse<RedisKeyInfo> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        key,
        type: "hash",
        ttlSeconds: 342,
      },
    };
    return NextResponse.json(mock);
  }

  try {
    const dbIndex = db ? Number(db) : undefined;
    const info = await withRedisClient(connectionName, dbIndex, async (client) => {
      const type = await client.type(key);
      const ttl = await client.ttl(key);
      return {
        key,
        type: normalizeKeyType(type),
        ttlSeconds: ttl >= 0 ? ttl : null,
      } satisfies RedisKeyInfo;
    });
    const response: ApiResponse<RedisKeyInfo> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: info,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<RedisKeyInfo> = {
      isSuccess: false,
      message: "Failed to read key info.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: { key, type: "unknown", ttlSeconds: null },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
