import { ApiResponse } from "@/lib/types";
import { startShellLoader, stopShellLoader } from "@/lib/shellLoader";

export type BaseClientConfig = {
  baseUrl: string;
  useMocks?: boolean;
  basePath?: string;
};

export class BaseClient {
  private readonly baseUrl: string;
  private readonly useMocks: boolean;
  private readonly basePath: string;

  constructor({ baseUrl, useMocks, basePath = "" }: BaseClientConfig) {
    this.baseUrl = baseUrl.trim().replace(/\/$/, "");
    this.useMocks = Boolean(useMocks);
    this.basePath = basePath ? `/${basePath.replace(/^\/|\/$/g, "")}` : "";
  }

  get isMocked() {
    return this.useMocks;
  }

  async request<T>(
    path: string,
    init: RequestInit,
  ): Promise<ApiResponse<T>> {
    const shouldLog = process.env.BFF_LOG_REQUESTS !== "false";
    const method = init.method ?? "GET";
    const url = `${this.baseUrl}${this.basePath}${path}`;
    const startedAt = Date.now();
    const loaderToken = startShellLoader(this.resolveLoaderMessage(method, path));
    const truncate = (value: string, max = 2000) =>
      value.length > max ? `${value.slice(0, max)}…` : value;
    try {
      if (shouldLog) {
        console.log(`[BFF] → ${method} ${url}`);
        if (init.body) {
          console.log(
            `[BFF] → ${method} ${url} body: ${truncate(String(init.body))}`,
          );
        }
      }
      const response = await fetch(url, {
        ...init,
        cache: "no-store",
      });
      const rawText = await response.text();
      const elapsed = Date.now() - startedAt;

      if (!response.ok) {
        if (shouldLog) {
          console.error(
            `[BFF] ✖ ${method} ${url} ${response.status} ${response.statusText} (${elapsed}ms)`,
          );
          if (rawText) {
            console.error(
              `[BFF] ✖ ${method} ${url} response: ${truncate(rawText)}`,
            );
          }
        }
        return {
          isSuccess: false,
          message: "Request failed",
          reasons: [response.statusText],
          data: undefined as T,
        };
      }

      if (shouldLog) {
        console.log(
          `[BFF] ✓ ${method} ${url} ${response.status} (${elapsed}ms)`,
        );
      }

      if (!rawText) {
        return {
          isSuccess: false,
          message: "Empty response",
          reasons: ["Empty response body"],
          data: undefined as T,
        };
      }

      try {
        return JSON.parse(rawText) as ApiResponse<T>;
      } catch (parseError) {
        if (shouldLog) {
          console.error(
            `[BFF] ✖ ${method} ${url} invalid JSON response`,
            parseError,
          );
        }
        return {
          isSuccess: false,
          message: "Invalid JSON response",
          reasons: [
            parseError instanceof Error ? parseError.message : "Invalid JSON",
          ],
          data: undefined as T,
        };
      }
    } catch (error) {
      if (shouldLog) {
        console.error(
          `[BFF] ✖ ${method} ${url} ${Date.now() - startedAt}ms`,
          error,
        );
      }
      return {
        isSuccess: false,
        message: "Request failed",
        reasons: [error instanceof Error ? error.message : "Unknown error"],
        data: undefined as T,
      };
    } finally {
      stopShellLoader(loaderToken);
    }
  }

  private resolveLoaderMessage(method: string, path: string): string {
    const normalizedPath = path.toLowerCase();
    const normalizedMethod = method.toUpperCase();

    if (normalizedPath.includes("/keys")) {
      if (normalizedMethod === "GET") return "Loading keys...";
      if (normalizedPath.includes("/flush")) return "Flushing database...";
      return "Updating key data...";
    }

    if (normalizedPath.includes("/summary") || normalizedPath.includes("/stats")) {
      return "Loading Redis overview...";
    }

    if (normalizedPath.includes("/connections/test")) {
      return "Testing connection...";
    }

    if (normalizedPath.includes("/connections")) {
      return normalizedMethod === "GET" ? "Loading connections..." : "Saving connection...";
    }

    return "Loading data...";
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T, TBody>(path: string, body: TBody): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async put<T, TBody>(path: string, body: TBody): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
