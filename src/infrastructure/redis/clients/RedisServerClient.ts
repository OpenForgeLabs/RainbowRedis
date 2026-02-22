import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import { ApiResponse, RedisServerInfo } from "@/lib/types";

export class RedisServerClient {
  constructor(private readonly client: RedisBaseClient) {}

  getInfo(connectionName: string): Promise<ApiResponse<RedisServerInfo>> {
    return this.client.get<RedisServerInfo>(`/${connectionName}/info`);
  }

  getDatabaseSize(connectionName: string, db: number): Promise<ApiResponse<number>> {
    return this.client.get<number>(`/${connectionName}/databases/${db}/size`);
  }
}
