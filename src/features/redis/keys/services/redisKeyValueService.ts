import { ApiResponse, RedisKeyType, RedisKeyValue } from "@/lib/types";
import { withPluginBasePath } from "@/lib/pluginPaths";
import { fetchWithShellLoader } from "@/lib/shellLoader";

export async function fetchRedisKeyValue(
  connectionName: string,
  key: string,
  type: RedisKeyType,
  db?: number,
): Promise<ApiResponse<RedisKeyValue>> {
  const params = new URLSearchParams();
  params.set("type", type);
  if (db !== undefined && db !== null) params.set("db", db.toString());
  const query = params.toString();
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/${encodeURIComponent(
        key,
      )}/value?${query}`,
    ),
    { cache: "no-store" },
    "Loading key value...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to load key value",
      reasons: [response.statusText],
      data: { type: "unknown", value: null },
    };
  }

  return (await response.json()) as ApiResponse<RedisKeyValue>;
}

export async function updateRedisKeyValue(
  connectionName: string,
  key: string,
  type: RedisKeyType,
  value: unknown,
  db?: number,
  expirySeconds?: number,
): Promise<ApiResponse<boolean>> {
  const params = new URLSearchParams();
  if (db !== undefined && db !== null) params.set("db", db.toString());
  const query = params.toString();
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/${encodeURIComponent(
        key,
      )}/value${query ? `?${query}` : ""}`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value, expirySeconds }),
    },
    "Updating key value...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to update key",
      reasons: [response.statusText],
      data: false,
    };
  }

  return (await response.json()) as ApiResponse<boolean>;
}

export async function deleteRedisKey(
  connectionName: string,
  key: string,
  confirmName?: string,
  db?: number,
): Promise<ApiResponse<boolean>> {
  const params = new URLSearchParams();
  if (db !== undefined && db !== null) params.set("db", db.toString());
  if (confirmName) params.set("confirmName", confirmName);
  const query = params.toString();
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/${encodeURIComponent(
        key,
      )}${query ? `?${query}` : ""}`,
    ),
    { method: "DELETE" },
    "Deleting key...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to delete key",
      reasons: [response.statusText],
      data: false,
    };
  }

  return (await response.json()) as ApiResponse<boolean>;
}

export async function renameRedisKey(
  connectionName: string,
  key: string,
  newKey: string,
  db?: number,
): Promise<ApiResponse<boolean>> {
  const params = new URLSearchParams();
  if (db !== undefined && db !== null) params.set("db", db.toString());
  const query = params.toString();
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/${encodeURIComponent(
        key,
      )}/rename${query ? `?${query}` : ""}`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newKey }),
    },
    "Renaming key...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to rename key",
      reasons: [response.statusText],
      data: false,
    };
  }

  return (await response.json()) as ApiResponse<boolean>;
}

export async function expireRedisKey(
  connectionName: string,
  key: string,
  ttlSeconds: number | null,
  db?: number,
): Promise<ApiResponse<boolean>> {
  const params = new URLSearchParams();
  if (db !== undefined && db !== null) params.set("db", db.toString());
  const query = params.toString();
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/${encodeURIComponent(
        key,
      )}/expire${query ? `?${query}` : ""}`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ttlSeconds }),
    },
    "Updating key TTL...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to update TTL",
      reasons: [response.statusText],
      data: false,
    };
  }

  return (await response.json()) as ApiResponse<boolean>;
}

export async function flushRedisDatabase(
  connectionName: string,
  db: number,
  confirmName: string,
): Promise<ApiResponse<number>> {
  const params = new URLSearchParams();
  params.set("db", db.toString());
  params.set("confirmName", confirmName);
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/flush?${params.toString()}`,
    ),
    { method: "POST" },
    "Flushing database...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to flush database",
      reasons: [response.statusText],
      data: 0,
    };
  }

  return (await response.json()) as ApiResponse<number>;
}
