import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import { ApiResponse, RedisZSetEntry } from "@/lib/types";

export class RedisZSetsClient {
  constructor(private readonly client: RedisBaseClient) {}

  getZSet(
    connectionName: string,
    key: string,
    db?: number,
    start = 0,
    stop = -1,
  ): Promise<ApiResponse<RedisZSetEntry[]>> {
    const params = new URLSearchParams();
    if (db !== undefined && db !== null) params.set("db", db.toString());
    params.set("start", start.toString());
    params.set("stop", stop.toString());
    params.set("withScores", "true");
    const query = params.toString();
    return this.client.get<RedisZSetEntry[]>(
      `/${connectionName}/zsets/${encodeURIComponent(key)}?${query}`,
    );
  }

  addZSet(
    connectionName: string,
    key: string,
    entries: RedisZSetEntry[],
    db?: number,
  ): Promise<ApiResponse<number>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<number, { entries: RedisZSetEntry[] }>(
      `/${connectionName}/zsets/${encodeURIComponent(key)}/add${query}`,
      { entries },
    );
  }

  removeZSet(
    connectionName: string,
    key: string,
    members: string[],
    db?: number,
  ): Promise<ApiResponse<number>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<number, { members: string[] }>(
      `/${connectionName}/zsets/${encodeURIComponent(key)}/remove${query}`,
      { members },
    );
  }
}
