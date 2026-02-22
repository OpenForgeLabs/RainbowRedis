import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse, RedisKeyScanResultWithInfo } from "@/lib/types";

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
  { params }: { params: Promise<{ connectionName: string }> },
) {
  const { connectionName } = await params;
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";

  if (useMocks) {
    const mock: ApiResponse<RedisKeyScanResultWithInfo> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        keys: [
          { key: "session:8452", type: "hash", ttlSeconds: 342 },
          { key: "orders:stream", type: "stream", ttlSeconds: null },
          { key: "cache:product:1", type: "string", ttlSeconds: 120 },
          { key: "cache:product:2", type: "string", ttlSeconds: 95 },
          { key: "feature-flags", type: "hash", ttlSeconds: null },
        ],
        cursor: 0,
      },
    };
    return NextResponse.json(mock);
  }

  const pattern = request.nextUrl.searchParams.get("pattern") ?? undefined;
  const pageSize = request.nextUrl.searchParams.get("pageSize");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const db = request.nextUrl.searchParams.get("db");

  try {
    const dbIndex = db ? Number(db) : undefined;
    const scanCursor = cursor ? Number(cursor) : 0;
    const count = pageSize ? Number(pageSize) : undefined;

    const result = await withRedisClient(connectionName, dbIndex, (client) =>
      client.scan(scanCursor, {
        MATCH: pattern,
        COUNT: count,
      }),
    );
    const keys = result.keys ?? [];
    const nextCursor = Number(result.cursor ?? 0);

    const enriched = await withRedisClient(connectionName, dbIndex, async (client) => {
      const pipeline = client.multi();
      keys.forEach((key) => {
        pipeline.type(key);
        pipeline.ttl(key);
      });
      const responses = await pipeline.exec();
      return keys.map((key, index) => {
        const type = String(responses?.[index * 2] ?? "unknown");
        const ttl = Number(responses?.[index * 2 + 1]);
        return {
          key,
          type: normalizeKeyType(type),
          ttlSeconds: ttl >= 0 ? ttl : null,
        };
      });
    });

    const response: ApiResponse<RedisKeyScanResultWithInfo> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        keys: enriched,
        cursor: nextCursor,
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<RedisKeyScanResultWithInfo> = {
      isSuccess: false,
      message: "Failed to scan keys.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: { keys: [], cursor: 0 },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
