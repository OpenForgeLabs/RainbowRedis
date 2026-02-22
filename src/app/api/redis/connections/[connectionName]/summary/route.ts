import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import type { ApiResponse } from "@/lib/types";

type RedisSummary = {
  version?: string;
  uptimeSeconds?: number;
  connectedClients?: number;
  opsPerSec?: number;
  usedMemoryHuman?: string;
};

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string }> },
) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const { connectionName } = await params;

  if (useMocks) {
    const mock: ApiResponse<RedisSummary> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        version: "7.2.4",
        uptimeSeconds: 93211,
        connectedClients: 18,
        opsPerSec: 42800,
        usedMemoryHuman: "3.1G",
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

    const summary: ApiResponse<RedisSummary> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        version: server.redis_version,
        uptimeSeconds: toNumber(server.uptime_in_seconds),
        connectedClients: toNumber(clients.connected_clients),
        opsPerSec: toNumber(stats.instantaneous_ops_per_sec),
        usedMemoryHuman: memory.used_memory_human,
      },
    };
    return NextResponse.json(summary);
  } catch (error) {
    const response: ApiResponse<RedisSummary> = {
      isSuccess: false,
      message: "Failed to load Redis summary.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: {},
    };
    return NextResponse.json(response, { status: 500 });
  }
}
