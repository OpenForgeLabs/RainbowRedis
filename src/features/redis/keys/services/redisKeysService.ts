import { ApiResponse, RedisKeyScanResultWithInfo, RedisKeyType } from "@/lib/types";
import { withPluginBasePath } from "@/lib/pluginPaths";
import { fetchWithShellLoader } from "@/lib/shellLoader";

export type RedisKeysQuery = {
  connectionName: string;
  pattern?: string;
  type?: Exclude<RedisKeyType, "unknown">;
  pageSize?: number;
  cursor?: number;
  db?: number;
};

export async function fetchRedisKeys({
  connectionName,
  pattern,
  type,
  pageSize,
  cursor,
  db,
}: RedisKeysQuery): Promise<ApiResponse<RedisKeyScanResultWithInfo>> {
  const params = new URLSearchParams();
  if (pattern) params.set("pattern", pattern);
  if (type) params.set("type", type);
  if (pageSize) params.set("pageSize", pageSize.toString());
  if (cursor) params.set("cursor", cursor.toString());
  if (db !== undefined && db !== null) params.set("db", db.toString());
  const query = params.toString();

  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys${query ? `?${query}` : ""}`,
    ),
    { cache: "no-store" },
    "Loading keys...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to load keys",
      reasons: [response.statusText],
      data: { keys: [], cursor: 0 },
    };
  }

  return (await response.json()) as ApiResponse<RedisKeyScanResultWithInfo>;
}
