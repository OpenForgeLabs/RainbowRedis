import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import {
  ApiResponse,
  RedisKeyType,
  RedisKeyValue,
  RedisStreamEntry,
  RedisZSetEntry,
} from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string; key: string }> },
) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const { connectionName, key } = await params;
  const rawType = request.nextUrl.searchParams.get("type") ?? "unknown";
  const normalizedType = rawType.toLowerCase();
  const db = request.nextUrl.searchParams.get("db");

  if (useMocks) {
    const mock: ApiResponse<RedisKeyValue> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        type: "hash",
        value: {
          last_login: "2024-11-25T14:22:01Z",
          ip_address: "192.168.1.105",
          status: "active",
        },
      },
    };
    return NextResponse.json(mock);
  }

  try {
    const dbValue = db ? Number(db) : undefined;
    let response: ApiResponse<RedisKeyValue>;

    switch (normalizedType) {
      case "string": {
        const value = await withRedisClient(connectionName, dbValue, (client) =>
          client.get(key),
        );
        response = {
          isSuccess: true,
          message: "",
          reasons: [],
          data: { type: "string", value: value ?? null },
        };
        break;
      }
      case "hash": {
        const value = await withRedisClient(connectionName, dbValue, (client) =>
          client.hGetAll(key),
        );
        response = {
          isSuccess: true,
          message: "",
          reasons: [],
          data: { type: "hash", value: value ?? {} },
        };
        break;
      }
      case "list": {
        const value = await withRedisClient(connectionName, dbValue, (client) =>
          client.lRange(key, 0, -1),
        );
        response = {
          isSuccess: true,
          message: "",
          reasons: [],
          data: { type: "list", value: value ?? [] },
        };
        break;
      }
      case "set": {
        const value = await withRedisClient(connectionName, dbValue, (client) =>
          client.sMembers(key),
        );
        response = {
          isSuccess: true,
          message: "",
          reasons: [],
          data: { type: "set", value: value ?? [] },
        };
        break;
      }
      case "zset": {
        const value = await withRedisClient(connectionName, dbValue, (client) =>
          client.zRangeWithScores(key, 0, -1),
        );
        const mapped: RedisZSetEntry[] = (value ?? []).map((entry) => ({
          member: entry.value,
          score: entry.score,
        }));
        response = {
          isSuccess: true,
          message: "",
          reasons: [],
          data: { type: "zset", value: mapped },
        };
        break;
      }
      case "stream": {
        const value = await withRedisClient(connectionName, dbValue, (client) =>
          client.xRange(key, "-", "+", { COUNT: 200 }),
        );
        const mapped: RedisStreamEntry[] = (value ?? []).map((entry) => ({
          id: entry.id,
          values: entry.message,
        }));
        response = {
          isSuccess: true,
          message: "",
          reasons: [],
          data: { type: "stream", value: mapped },
        };
        break;
      }
      default: {
        response = {
          isSuccess: false,
          message: "Unsupported key type",
          reasons: [],
          data: { type: "unknown", value: null },
        };
        break;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<RedisKeyValue> = {
      isSuccess: false,
      message: "Failed to read key.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: { type: "unknown", value: null },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string; key: string }> },
) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const { connectionName, key } = await params;
  const db = request.nextUrl.searchParams.get("db");
  const body = (await request.json()) as {
    type: RedisKeyType;
    value: unknown;
    expirySeconds?: number;
  };

  if (useMocks) {
    const mock: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Updated (mock).",
      reasons: [],
      data: true,
    };
    return NextResponse.json(mock);
  }

  const dbValue = db ? Number(db) : undefined;

  try {
    if (body.type === "string") {
      await withRedisClient(connectionName, dbValue, async (client) => {
        if (body.expirySeconds) {
          await client.set(key, String(body.value ?? ""), {
            EX: body.expirySeconds,
          });
        } else {
          await client.set(key, String(body.value ?? ""));
        }
      });
      return NextResponse.json({
        isSuccess: true,
        message: "Updated",
        reasons: [],
        data: true,
      } satisfies ApiResponse<boolean>);
    }

    if (body.type === "hash") {
      const entries = (body.value ?? {}) as Record<string, string>;
      await withRedisClient(connectionName, dbValue, async (client) => {
        if (Object.keys(entries).length === 0) {
          await client.del(key);
        } else {
          await client.hSet(key, entries);
        }
      });
      return NextResponse.json({
        isSuccess: true,
        message: "Updated",
        reasons: [],
        data: true,
      } satisfies ApiResponse<boolean>);
    }

    if (body.type === "list") {
      const values = Array.isArray(body.value) ? body.value.map(String) : null;
      if (!values) {
        const response: ApiResponse<boolean> = {
          isSuccess: false,
          message: "Invalid list payload",
          reasons: ["Expected array of strings"],
          data: false,
        };
        return NextResponse.json(response, { status: 400 });
      }
      await withRedisClient(connectionName, dbValue, async (client) => {
        await client.del(key);
        if (values.length > 0) {
          await client.rPush(key, values);
        }
      });
      return NextResponse.json({
        isSuccess: true,
        message: values.length ? "List updated" : "List cleared",
        reasons: [],
        data: true,
      } satisfies ApiResponse<boolean>);
    }

    if (body.type === "set") {
      const members = Array.isArray(body.value)
        ? body.value.map(String)
        : null;
      if (!members) {
        const response: ApiResponse<boolean> = {
          isSuccess: false,
          message: "Invalid set payload",
          reasons: ["Expected array of strings"],
          data: false,
        };
        return NextResponse.json(response, { status: 400 });
      }
      await withRedisClient(connectionName, dbValue, async (client) => {
        await client.del(key);
        if (members.length > 0) {
          await client.sAdd(key, members);
        }
      });
      return NextResponse.json({
        isSuccess: true,
        message: members.length ? "Set updated" : "Set cleared",
        reasons: [],
        data: true,
      } satisfies ApiResponse<boolean>);
    }

    if (body.type === "zset") {
      const entries = Array.isArray(body.value) ? body.value : null;
      if (!entries) {
        const response: ApiResponse<boolean> = {
          isSuccess: false,
          message: "Invalid zset payload",
          reasons: ["Expected array of entries"],
          data: false,
        };
        return NextResponse.json(response, { status: 400 });
      }
      await withRedisClient(connectionName, dbValue, async (client) => {
        await client.del(key);
        if (entries.length > 0) {
          await client.zAdd(
            key,
            entries.map((entry) => ({
              score: Number(entry.score ?? 0),
              value: String(entry.member ?? ""),
            })),
          );
        }
      });
      return NextResponse.json({
        isSuccess: true,
        message: entries.length ? "ZSet updated" : "ZSet cleared",
        reasons: [],
        data: true,
      } satisfies ApiResponse<boolean>);
    }

    if (body.type === "stream") {
      const entries = Array.isArray(body.value) ? body.value : null;
      if (!entries) {
        const response: ApiResponse<boolean> = {
          isSuccess: false,
          message: "Invalid stream payload",
          reasons: ["Expected array of entries"],
          data: false,
        };
        return NextResponse.json(response, { status: 400 });
      }
      await withRedisClient(connectionName, dbValue, async (client) => {
        for (const entry of entries) {
          await client.xAdd(
            key,
            entry.id && String(entry.id).trim() ? String(entry.id) : "*",
            entry.values ?? {},
          );
        }
      });
      const response: ApiResponse<boolean> = {
        isSuccess: true,
        message: "Stream updated",
        reasons: [],
        data: true,
      };
      return NextResponse.json(response);
    }
  } catch (error) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "Failed to update key.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: false,
    };
    return NextResponse.json(response, { status: 500 });
  }

  const unsupported: ApiResponse<boolean> = {
    isSuccess: false,
    message: "Unsupported update for key type",
    reasons: [],
    data: false,
  };
  return NextResponse.json(unsupported);
}
