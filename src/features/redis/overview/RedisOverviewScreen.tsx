"use client";

import { AsyncGate, Button, Card, InlineSpinner, MetricStat } from "@openforgelabs/rainbow-ui";
import { useRedisOverview } from "@/features/redis/overview/hooks/useRedisOverview";

type RedisOverviewScreenProps = {
  connectionName: string;
};

export function RedisOverviewScreen({ connectionName }: RedisOverviewScreenProps) {
  const { data, error, isLoading, refresh } = useRedisOverview(connectionName);

  return (
    <div className="flex-1 overflow-y-auto bg-surface/30 px-6 pb-6 lg:px-8 lg:pb-8">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-3">
        <Button
          variant="solid"
          tone="accent"
          onClick={refresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <InlineSpinner className="size-4 border-border-subtle" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
          )}
          {isLoading ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Redis Overview</h2>
          <p className="text-sm text-muted-foreground">
            Server stats and quick navigation for {connectionName}.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="solid"
            tone="primary"
            onClick={() => {
              window.location.href = `/${encodeURIComponent(connectionName)}/keys`;
            }}
          >
            Open Keys Browser
          </Button>
        </div>
      </div>

      <AsyncGate isLoading={isLoading} error={error} empty={false}>
        <Card className="bg-surface-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricStat
              label="Redis Version"
              value={data.version ?? "-"}
            />
            <MetricStat
              label="Uptime (s)"
              value={data.uptimeSeconds ?? "-"}
            />
            <MetricStat
              label="Connected Clients"
              value={data.connectedClients ?? "-"}
            />
            <MetricStat
              label="Ops / Sec"
              value={data.opsPerSec ?? "-"}
            />
            <MetricStat
              label="Used Memory"
              value={data.usedMemoryHuman ?? "-"}
            />
            <MetricStat
              label="Keyspace"
              value={data.keyspace ?? "-"}
            />
          </div>
        </Card>
      </AsyncGate>
    </div>
  );
}
