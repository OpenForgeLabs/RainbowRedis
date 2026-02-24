import { ApiResponse, RedisServerStats } from "@/lib/types";
import { withPluginBasePath } from "@/lib/pluginPaths";
import { fetchWithShellLoader } from "@/lib/shellLoader";

export async function fetchRedisStats(
  connectionName: string,
): Promise<ApiResponse<RedisServerStats>> {
  const response = await fetchWithShellLoader(
    withPluginBasePath(`/api/redis/connections/${connectionName}/stats`),
    {
      cache: "no-store",
    },
    "Loading Redis overview...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to load server stats",
      reasons: [response.statusText],
      data: {},
    };
  }

  return (await response.json()) as ApiResponse<RedisServerStats>;
}
