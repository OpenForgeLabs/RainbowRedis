import { BaseClient } from "@/infrastructure/baseClient";
import { ApiResponse } from "@/lib/types";

export type RedisBaseClientConfig = {
  baseUrl: string;
  useMocks?: boolean;
  basePath?: string;
};

export class RedisBaseClient {
  private readonly basePath: string;
  private readonly client: BaseClient;

  constructor({ baseUrl, useMocks, basePath = "/api/redis" }: RedisBaseClientConfig) {
    this.basePath = basePath.replace(/\/$/, "");
    this.client = new BaseClient({ baseUrl, useMocks });
  }

  get isMocked() {
    return this.client.isMocked;
  }

  get<T>(path: string): Promise<ApiResponse<T>> {
    return this.client.get<T>(`${this.basePath}${path}`);
  }

  post<T, TBody>(path: string, body: TBody): Promise<ApiResponse<T>> {
    return this.client.post<T, TBody>(`${this.basePath}${path}`, body);
  }

  put<T, TBody>(path: string, body: TBody): Promise<ApiResponse<T>> {
    return this.client.put<T, TBody>(`${this.basePath}${path}`, body);
  }

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.client.delete<T>(`${this.basePath}${path}`);
  }
}
