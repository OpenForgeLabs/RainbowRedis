import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import type { RedisKeyType } from "@/lib/types";
import { ApiResponse, RedisKeyScanResultWithInfo } from "@/lib/types";

const normalizeKeyType = (rawType: string | null | undefined): RedisKeyType => {
  const value = (rawType ?? "").toLowerCase();
  if (value === "string") return "string";
  if (value === "hash") return "hash";
  if (value === "list") return "list";
  if (value === "set") return "set";
  if (value === "sortedset" || value === "zset") return "zset";
  if (value === "stream") return "stream";
  return "unknown";
};

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;
const MAX_SCAN_ITERATIONS = 100;

const parsePageSize = (rawValue: string | null): number => {
  const parsed = rawValue ? Number(rawValue) : DEFAULT_PAGE_SIZE;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
};

const parseCursor = (rawValue: string | null): number => {
  const parsed = rawValue ? Number(rawValue) : 0;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
};

const normalizeTypeFilter = (rawType: string | null): Exclude<RedisKeyType, "unknown"> | undefined => {
  const value = normalizeKeyType(rawType);
  if (value === "unknown") {
    return undefined;
  }
  return value;
};

const parseExhaustive = (rawValue: string | null): boolean => {
  if (!rawValue) {
    return false;
  }
  return rawValue.toLowerCase() === "true";
};

const scanKeysPage = async (
  client: any,
  cursor: number,
  match: string,
  count: number,
  type?: Exclude<RedisKeyType, "unknown">,
) => {
  let currentCursor = cursor;
  const collected = new Set<string>();
  let iterations = 0;

  do {
    const result = await client.scan(currentCursor, {
      MATCH: match,
      COUNT: count,
      ...(type ? { TYPE: type } : {}),
    });
    for (const key of result.keys ?? []) {
      collected.add(key);
      if (collected.size >= count) {
        break;
      }
    }
    currentCursor = Number(result.cursor ?? 0);
    iterations += 1;
  } while (
    collected.size < count &&
    currentCursor !== 0 &&
    iterations < MAX_SCAN_ITERATIONS
  );

  return {
    keys: Array.from(collected).slice(0, count),
    cursor: currentCursor,
  };
};

const scanKeysExhaustive = async (
  client: any,
  match: string,
  count: number,
  type?: Exclude<RedisKeyType, "unknown">,
) => {
  let currentCursor = 0;
  const collected = new Set<string>();
  let iterations = 0;

  do {
    const result = await client.scan(currentCursor, {
      MATCH: match,
      COUNT: count,
      ...(type ? { TYPE: type } : {}),
    });
    for (const key of result.keys ?? []) {
      collected.add(key);
      if (collected.size >= count) {
        break;
      }
    }
    currentCursor = Number(result.cursor ?? 0);
    iterations += 1;
  } while (
    collected.size < count &&
    currentCursor !== 0 &&
    iterations < MAX_SCAN_ITERATIONS
  );

  return {
    keys: Array.from(collected).slice(0, count),
    cursor: 0,
  };
};

const getExactKey = async (
  client: any,
  exactKey: string,
  type?: Exclude<RedisKeyType, "unknown">,
) => {
  const pipeline = client.multi();
  pipeline.exists(exactKey);
  pipeline.type(exactKey);
  pipeline.ttl(exactKey);
  const responses = await pipeline.exec();
  const exists = Number(responses?.[0] ?? 0) > 0;
  if (!exists) {
    return [] as Array<{ key: string; type: RedisKeyType; ttlSeconds: number | null }>;
  }
  const keyType = normalizeKeyType(String(responses?.[1] ?? "unknown"));
  if (type && keyType !== type) {
    return [] as Array<{ key: string; type: RedisKeyType; ttlSeconds: number | null }>;
  }
  const ttl = Number(responses?.[2]);
  return [
    {
      key: exactKey,
      type: keyType,
      ttlSeconds: ttl >= 0 ? ttl : null,
    },
  ];
};

const enrichKeys = async (client: any, keys: string[]) => {
  if (!keys.length) {
    return [] as Array<{ key: string; type: RedisKeyType; ttlSeconds: number | null }>;
  }

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
  const exactKey = request.nextUrl.searchParams.get("exactKey") ?? undefined;
  const pageSize = request.nextUrl.searchParams.get("pageSize");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const db = request.nextUrl.searchParams.get("db");
  const keyType = request.nextUrl.searchParams.get("type");
  const exhaustive = parseExhaustive(request.nextUrl.searchParams.get("exhaustive"));

  try {
    const dbIndex = db ? Number(db) : undefined;
    const scanCursor = parseCursor(cursor);
    const limit = parsePageSize(pageSize);
    const normalizedPattern = pattern?.trim() ? pattern.trim() : "*";
    const normalizedExactKey = exactKey?.trim();
    const normalizedType = normalizeTypeFilter(keyType);
    const isExactSearch = Boolean(normalizedExactKey);

    const { keys, nextCursor, enriched } = await withRedisClient(
      connectionName,
      dbIndex,
      async (client) => {
        if (isExactSearch && normalizedExactKey) {
          const exact = await getExactKey(client, normalizedExactKey, normalizedType);
          return {
            keys: exact.map((item) => item.key),
            nextCursor: 0,
            enriched: exact,
          };
        }

        const result = exhaustive
          ? await scanKeysExhaustive(client, normalizedPattern, limit, normalizedType)
          : await scanKeysPage(client, scanCursor, normalizedPattern, limit, normalizedType);
        const scannedKeys = result.keys ?? [];
        const scannedCursor = Number(result.cursor ?? 0);
        const scannedEnriched = await enrichKeys(client, scannedKeys);
        return {
          keys: scannedKeys,
          nextCursor: scannedCursor,
          enriched: scannedEnriched,
        };
      },
    );

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
