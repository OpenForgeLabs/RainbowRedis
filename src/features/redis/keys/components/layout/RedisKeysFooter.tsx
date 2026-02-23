"use client";

import { useRedisOverview } from "@/features/redis/overview/hooks/useRedisOverview";

type RedisKeysFooterProps = {
  connectionName: string;
};

export function RedisKeysFooter({ connectionName }: RedisKeysFooterProps) {
  const { data, isLoading } = useRedisOverview(connectionName);

  return (
    <footer className="flex items-center justify-between border-t border-border bg-background/60 px-4 py-2 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success"></span>
          {isLoading
            ? "redis_version: ..."
            : `redis_version: ${data.version ?? "-"}`}
        </span>
        <span className="uppercase tracking-widest opacity-60">
          {isLoading
            ? "Latency: ..."
            : `Latency: ${data.opsPerSec ? `${Math.round(1000 / data.opsPerSec)}ms` : "-"}`
          }
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold uppercase tracking-widest text-accent">
          UTF-8
        </span>
        <span>{isLoading ? "Line -, Col -" : "Line 1, Col 45"}</span>
      </div>
    </footer>
  );
}
