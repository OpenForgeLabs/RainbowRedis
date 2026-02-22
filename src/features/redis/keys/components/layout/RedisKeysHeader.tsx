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
          className="flex items-center gap-2 rounded-lg border-transparent bg-gradient-to-r from-navigate to-navigate-strong px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(15,23,42,0.35)] transition hover:from-navigate-strong hover:to-action"
          type="button"
          onClick={onServerInfo}
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          Server Info
        </button>
        <button
          className="flex items-center gap-2 rounded-lg border-transparent bg-gradient-to-r from-action to-action-strong px-3 py-2 text-sm font-medium text-white shadow-[0_10px_18px_rgba(15,23,42,0.35)] transition hover:from-action-strong hover:to-confirm disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRefresh}
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
    </div>
  );
}
