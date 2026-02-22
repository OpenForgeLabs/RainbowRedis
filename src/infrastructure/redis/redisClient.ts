import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { resolveConnection as resolveSharedConnection } from "@openforgelabs/rainbow-connections";
import type { RedisConnectionUpsertRequest } from "@/lib/types";

type RedisConnectionPayload = RedisConnectionUpsertRequest;

export const resolveConnection = async (
  connectionName: string,
): Promise<RedisConnectionPayload> => {
  const data = await resolveSharedConnection("redis", connectionName);
  if (!data) {
    throw new Error("Unable to resolve connection details.");
  }
  return data as RedisConnectionPayload;
};

const parseConnectionString = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("redis://") || trimmed.startsWith("rediss://")) {
    return { url: trimmed };
  }

  const [hostPart, ...params] = trimmed.split(",");
  let host = hostPart;
  let port = 6379;
  if (hostPart.includes(":")) {
    const [hostValue, portValue] = hostPart.split(":");
    host = hostValue;
    const parsed = Number(portValue);
    if (!Number.isNaN(parsed)) {
      port = parsed;
    }
  }

  let password: string | undefined;
  let useTls = false;
  let database: number | undefined;

  for (const param of params) {
    const [key, value] = param.split("=");
    if (!key) continue;
    const normalized = key.trim().toLowerCase();
    const rawValue = value?.trim() ?? "";
    if (normalized === "password") {
      password = rawValue;
    }
    if (normalized === "ssl") {
      useTls = rawValue.toLowerCase() === "true";
    }
    if (normalized === "defaultdatabase") {
      const parsed = Number(rawValue);
      if (!Number.isNaN(parsed)) {
        database = parsed;
      }
    }
  }

  return { host, port, password, useTls, database };
};

const buildClient = (payload: RedisConnectionPayload) => {
  const connectionString = payload.connectionString?.trim();
  if (connectionString) {
    const parsed = parseConnectionString(connectionString);
    if ("url" in parsed) {
      return createClient({ url: parsed.url });
    }
    return createClient({
      socket: {
        host: parsed.host,
        port: parsed.port,
        tls: parsed.useTls,
      },
      password: parsed.password,
      database: parsed.database,
    });
  }

  return createClient({
    socket: {
      host: payload.host,
      port: payload.port,
      tls: payload.useTls,
    },
    password: payload.password ?? undefined,
    database: payload.database ?? undefined,
  });
};

export const withRedisClient = async <T>(
  connectionName: string,
  db: number | undefined,
  handler: (client: RedisClientType) => Promise<T>,
) => {
  const payload = await resolveConnection(connectionName);
  const client = buildClient(payload);
  await client.connect();
  try {
    if (typeof db === "number" && !Number.isNaN(db)) {
      await client.select(db);
    }
    return await handler(client);
  } finally {
    await client.quit();
  }
};

export const testConnectionPayload = async (payload: RedisConnectionPayload) => {
  const client = buildClient(payload);
  await client.connect();
  try {
    await client.ping();
  } finally {
    await client.quit();
  }
};
