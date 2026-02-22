import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import { ApiResponse } from "@/lib/types";

export class RedisStringsClient {
  constructor(private readonly client: RedisBaseClient) {}

  getString(
    connectionName: string,
    key: string,
    db?: number,
  ): Promise<ApiResponse<string | null>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.get<string | null>(
      `/${connectionName}/strings/${encodeURIComponent(key)}${query}`,
    );
  }

  setString(
    connectionName: string,
    key: string,
    value: string,
    expirySeconds?: number,
    db?: number,
  ): Promise<ApiResponse<boolean>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<boolean, { value: string; expirySeconds?: number }>(
      `/${connectionName}/strings/${encodeURIComponent(key)}${query}`,
      { value, expirySeconds },
    );
  }
}
