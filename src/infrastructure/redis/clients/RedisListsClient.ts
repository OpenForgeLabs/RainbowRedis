import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import { ApiResponse } from "@/lib/types";

export class RedisListsClient {
  constructor(private readonly client: RedisBaseClient) {}

  getList(
    connectionName: string,
    key: string,
    db?: number,
    start = 0,
    stop = -1,
  ): Promise<ApiResponse<string[]>> {
    const params = new URLSearchParams();
    if (db !== undefined && db !== null) params.set("db", db.toString());
    params.set("start", start.toString());
    params.set("stop", stop.toString());
    const query = params.toString();
    return this.client.get<string[]>(
      `/${connectionName}/lists/${encodeURIComponent(key)}?${query}`,
    );
  }

  pushList(
    connectionName: string,
    key: string,
    values: string[],
    leftPush: boolean,
    db?: number,
  ): Promise<ApiResponse<number>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<number, { values: string[]; leftPush: boolean }>(
      `/${connectionName}/lists/${encodeURIComponent(key)}/push${query}`,
      { values, leftPush },
    );
  }

  trimList(
    connectionName: string,
    key: string,
    start: number,
    stop: number,
    db?: number,
  ): Promise<ApiResponse<boolean>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<boolean, { start: number; stop: number }>(
      `/${connectionName}/lists/${encodeURIComponent(key)}/trim${query}`,
      { start, stop },
    );
  }
}
