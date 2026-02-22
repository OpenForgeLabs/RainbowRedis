"use client";

import Link from "next/link";
import { AsyncGate, InlineSpinner, MetricStat } from "@openforgelabs/rainbow-ui";
import { useRedisOverview } from "@/features/redis/overview/hooks/useRedisOverview";

type RedisOverviewScreenProps = {
  connectionName: string;
};

export function RedisOverviewScreen({ connectionName }: RedisOverviewScreenProps) {
  const { data, error, isLoading, refresh } = useRedisOverview(connectionName);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 px-6 pb-6 lg:px-8 lg:pb-8">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-3">
        <button
          className="flex items-center gap-2 rounded-lg border border-action/30 bg-action/10 px-3 py-1.5 text-sm font-medium text-action transition-colors hover:border-action/60 hover:bg-action/20 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={refresh}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? (
            <InlineSpinner className="size-4 border-slate-300" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
          )}
          {isLoading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Redis Overview</h2>
          <p className="text-sm text-slate-400">
            Server stats and quick navigation for {connectionName}.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            className="rounded-lg border border-navigate/40 bg-navigate/10 px-4 py-2 text-sm font-semibold text-navigate transition-colors hover:border-navigate/70 hover:bg-navigate/20"
            href={`/${encodeURIComponent(connectionName)}/keys`}
          >
            Open Keys Browser
          </Link>
        </div>
      </div>

      <AsyncGate isLoading={isLoading} error={error} empty={false}>
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
      </AsyncGate>
    </div>
  );
}
