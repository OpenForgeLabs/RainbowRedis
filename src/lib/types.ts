export type ApiResponse<T> = {
  isSuccess: boolean;
  message: string;
  reasons: string[];
  data: T;
};

export type RedisConnectionUpsertRequest = {
  name: string;
  connectionString: string;
  host?: string;
  port?: number;
  password?: string | null;
  useTls?: boolean;
  database?: number | null;
  environment?: "production" | "staging" | "development";
};

export type RedisConnectionInfo = {
  name: string;
  useTls: boolean;
  database?: number | null;
  isEditable: boolean;
  source: string;
  environment?: "production" | "staging" | "development";
};

export type RedisConnectionHealth = {
  connected: boolean;
  warning?: string | null;
};

export type RedisKeyScanResult = {
  keys: string[];
  cursor: number;
};

export type RedisKeyScanResultWithInfo = {
  keys: RedisKeyInfo[];
  cursor: number;
};

export type RedisKeyType =
  | "string"
  | "hash"
  | "list"
  | "set"
  | "zset"
  | "stream"
  | "unknown";

export type RedisKeyInfo = {
  key: string;
  type: RedisKeyType;
  ttlSeconds?: number | null;
};

export type RedisZSetEntry = {
  member: string;
  score: number;
};

export type RedisStreamEntry = {
  id: string;
  values: Record<string, string>;
};

export type RedisKeyValue =
  | { type: "string"; value: string | null }
  | { type: "hash"; value: Record<string, string> }
  | { type: "list"; value: string[] }
  | { type: "set"; value: string[] }
  | { type: "zset"; value: RedisZSetEntry[] }
  | { type: "stream"; value: RedisStreamEntry[] }
  | { type: "unknown"; value: unknown };

export type RedisServerInfo = {
  sections: Record<string, Record<string, string>>;
};

export type RedisServerStats = {
  version?: string;
  uptimeSeconds?: number;
  connectedClients?: number;
  opsPerSec?: number;
  usedMemoryHuman?: string;
  keyspace?: string;
};
