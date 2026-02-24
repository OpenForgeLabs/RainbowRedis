import { ApiResponse, RedisKeyInfo } from "@/lib/types";
import { withPluginBasePath } from "@/lib/pluginPaths";
import { fetchWithShellLoader } from "@/lib/shellLoader";

export async function fetchRedisKeyInfo(
  connectionName: string,
  key: string,
  db?: number,
): Promise<ApiResponse<RedisKeyInfo>> {
  const params = new URLSearchParams();
  if (db !== undefined && db !== null) params.set("db", db.toString());
  const query = params.toString();
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${connectionName}/keys/${encodeURIComponent(
        key,
      )}/info${query ? `?${query}` : ""}`,
    ),
    { cache: "no-store" },
    "Loading key details...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to load key info",
      reasons: [response.statusText],
      data: { key, type: "unknown", ttlSeconds: null },
    };
  }

  return (await response.json()) as ApiResponse<RedisKeyInfo>;
}
