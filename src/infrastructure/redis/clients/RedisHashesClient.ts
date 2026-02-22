import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import { ApiResponse } from "@/lib/types";

export class RedisHashesClient {
  constructor(private readonly client: RedisBaseClient) {}

  getHash(
    connectionName: string,
    key: string,
    db?: number,
  ): Promise<ApiResponse<Record<string, string>>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.get<Record<string, string>>(
      `/${connectionName}/hashes/${encodeURIComponent(key)}${query}`,
    );
  }

  setHash(
    connectionName: string,
    key: string,
    entries: Record<string, string>,
    db?: number,
  ): Promise<ApiResponse<number>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<number, { entries: Record<string, string> }>(
      `/${connectionName}/hashes/${encodeURIComponent(key)}${query}`,
      { entries },
    );
  }
}
