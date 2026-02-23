"use client";

import { InlineSpinner } from "@openforgelabs/rainbow-ui";

type RedisKeysHeaderProps = {
  connectionName: string;
  isLoading: boolean;
  onRefresh: () => void;
  onServerInfo: () => void;
};

export function RedisKeysHeader({
  connectionName,
  isLoading,
  onRefresh,
  onServerInfo,
}: RedisKeysHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--rx-shadow-md)] transition hover:bg-accent/90"
          type="button"
          onClick={onServerInfo}
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          Server Info
        </button>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-[var(--rx-shadow-md)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRefresh}
          type="button"
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
        </button>
      </div>
    </div>
  );
}
