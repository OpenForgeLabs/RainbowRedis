import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import { ApiResponse } from "@/lib/types";

export class RedisSetsClient {
  constructor(private readonly client: RedisBaseClient) {}

  getSet(
    connectionName: string,
    key: string,
    db?: number,
  ): Promise<ApiResponse<string[]>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.get<string[]>(
      `/${connectionName}/sets/${encodeURIComponent(key)}${query}`,
    );
  }

  addSet(
    connectionName: string,
    key: string,
    members: string[],
    db?: number,
  ): Promise<ApiResponse<number>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<number, { members: string[] }>(
      `/${connectionName}/sets/${encodeURIComponent(key)}/add${query}`,
      { members },
    );
  }

  removeSet(
    connectionName: string,
    key: string,
    members: string[],
    db?: number,
  ): Promise<ApiResponse<number>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<number, { members: string[] }>(
      `/${connectionName}/sets/${encodeURIComponent(key)}/remove${query}`,
      { members },
    );
  }
}
