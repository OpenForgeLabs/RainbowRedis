import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse, RedisServerStats } from "@/lib/types";

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
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
    const mock: ApiResponse<RedisServerStats> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        version: "7.2.4",
        uptimeSeconds: 93211,
        connectedClients: 18,
        opsPerSec: 42800,
        usedMemoryHuman: "3.1G",
        keyspace: "db0:keys=124000,expires=31000,avg_ttl=905000",
      },
    };
    return NextResponse.json(mock);
  }

  try {
    const info = await withRedisClient(connectionName, undefined, (client) =>
      client.info(),
    );
    const sections: Record<string, Record<string, string>> = {};
    let current = "default";
    for (const line of info.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("#")) {
        current = trimmed.replace(/^#\s*/, "");
        sections[current] = sections[current] ?? {};
        continue;
      }
      const [key, value] = trimmed.split(":");
      if (!key) continue;
      sections[current] = sections[current] ?? {};
      sections[current][key] = value ?? "";
    }

    const server = sections.Server ?? {};
    const stats = sections.Stats ?? {};
    const clients = sections.Clients ?? {};
    const memory = sections.Memory ?? {};
    const keyspace = sections.Keyspace ?? {};

    const statsResponse: ApiResponse<RedisServerStats> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        version: server.redis_version,
        uptimeSeconds: toNumber(server.uptime_in_seconds),
        connectedClients: toNumber(clients.connected_clients),
        opsPerSec: toNumber(stats.instantaneous_ops_per_sec),
        usedMemoryHuman: memory.used_memory_human,
        keyspace: Object.values(keyspace).join(" | "),
      },
    };

    return NextResponse.json(statsResponse);
  } catch (error) {
    const response: ApiResponse<RedisServerStats> = {
      isSuccess: false,
      message: "Failed to load Redis stats.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: {
        version: undefined,
        uptimeSeconds: undefined,
        connectedClients: undefined,
        opsPerSec: undefined,
        usedMemoryHuman: undefined,
        keyspace: undefined,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
