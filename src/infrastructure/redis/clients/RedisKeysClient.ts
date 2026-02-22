import { RedisBaseClient } from "@/infrastructure/redis/RedisBaseClient";
import {
  ApiResponse,
  RedisKeyInfo,
  RedisKeyScanResult,
  RedisKeyScanResultWithInfo,
} from "@/lib/types";

export type RedisKeyScanParams = {
  pattern?: string;
  pageSize?: number;
  cursor?: number;
  db?: number;
};

export class RedisKeysClient {
  constructor(private readonly client: RedisBaseClient) {}

  scanKeys(
    connectionName: string,
    params: RedisKeyScanParams,
  ): Promise<ApiResponse<RedisKeyScanResult>> {
    const query = new URLSearchParams();
    if (params.pattern) query.set("pattern", params.pattern);
    if (params.pageSize) query.set("pageSize", params.pageSize.toString());
    if (params.cursor) query.set("cursor", params.cursor.toString());
    if (params.db !== undefined && params.db !== null) {
      query.set("db", params.db.toString());
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.client.get<RedisKeyScanResult>(
      `/${connectionName}/keys${suffix}`,
    );
  }

  scanKeysWithInfo(
    connectionName: string,
    params: RedisKeyScanParams,
  ): Promise<ApiResponse<RedisKeyScanResultWithInfo>> {
    const query = new URLSearchParams();
    if (params.pattern) query.set("pattern", params.pattern);
    if (params.pageSize) query.set("pageSize", params.pageSize.toString());
    if (params.cursor) query.set("cursor", params.cursor.toString());
    if (params.db !== undefined && params.db !== null) {
      query.set("db", params.db.toString());
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.client.get<RedisKeyScanResultWithInfo>(
      `/${connectionName}/keys/enriched${suffix}`,
    );
  }

  getKeyInfo(
    connectionName: string,
    key: string,
    db?: number,
  ): Promise<ApiResponse<RedisKeyInfo>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.get<RedisKeyInfo>(
      `/${connectionName}/keys/${encodeURIComponent(key)}/info${query}`,
    );
  }

  deleteKey(
    connectionName: string,
    key: string,
    confirmName?: string,
    db?: number,
  ): Promise<ApiResponse<boolean>> {
    const query = new URLSearchParams();
    if (db !== undefined && db !== null) {
      query.set("db", db.toString());
    }
    if (confirmName) {
      query.set("confirmName", confirmName);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.client.delete<boolean>(
      `/${connectionName}/keys/${encodeURIComponent(key)}${suffix}`,
    );
  }

  flushDatabase(
    connectionName: string,
    db: number,
    confirmName: string,
  ): Promise<ApiResponse<number>> {
    const query = new URLSearchParams();
    query.set("db", db.toString());
    query.set("confirmName", confirmName);
    return this.client.post<number, Record<string, never>>(
      `/${connectionName}/keys/flush?${query.toString()}`,
      {},
    );
  }

  renameKey(
    connectionName: string,
    key: string,
    newKey: string,
    db?: number,
  ): Promise<ApiResponse<boolean>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<boolean, { newKey: string }>(
      `/${connectionName}/keys/${encodeURIComponent(key)}/rename${query}`,
      { newKey },
    );
  }

  expireKey(
    connectionName: string,
    key: string,
    ttlSeconds: number | null,
    db?: number,
  ): Promise<ApiResponse<boolean>> {
    const query =
      db !== undefined && db !== null ? `?db=${db.toString()}` : "";
    return this.client.post<boolean, { ttlSeconds: number | null }>(
      `/${connectionName}/keys/${encodeURIComponent(key)}/expire${query}`,
      { ttlSeconds },
    );
  }
}
