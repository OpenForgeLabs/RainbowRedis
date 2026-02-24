import { ApiResponse } from "@/lib/types";
import { withPluginBasePath } from "@/lib/pluginPaths";
import { fetchWithShellLoader } from "@/lib/shellLoader";

export async function fetchRedisDbSize(
  connectionName: string,
  db: number,
): Promise<ApiResponse<number>> {
  const response = await fetchWithShellLoader(
    withPluginBasePath(
      `/api/redis/connections/${encodeURIComponent(connectionName)}/databases/${db}/size`,
    ),
    undefined,
    "Loading database size...",
  );

  if (!response.ok) {
    return {
      isSuccess: false,
      message: "Failed to get database size.",
      reasons: [response.statusText],
      data: 0,
    };
  }

  return (await response.json()) as ApiResponse<number>;
}
