"use client";

import { RedisKeyType, RedisKeyValue } from "@/lib/types";

type RedisKeysListProps = {
  keys: string[];
  selectedKey: string | null;
  keyInfoMap: Record<string, { type: RedisKeyType; ttlSeconds?: number | null }>;
  selectedValue?: RedisKeyValue;
  localKeys?: string[];
  resultsLabel: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  formatTtl: (ttlSeconds?: number | null) => string;
  formatSize: (value?: unknown) => string;
  onSelectKey: (key: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  typeBadgeStyles: Record<string, string>;
};

export function RedisKeysList({
  keys,
  selectedKey,
  keyInfoMap,
  selectedValue,
  localKeys = [],
  resultsLabel,
  hasNextPage,
  hasPreviousPage,
  formatTtl,
  formatSize,
  onSelectKey,
  onNextPage,
  onPreviousPage,
  typeBadgeStyles,
}: RedisKeysListProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r">
      <div className="flex items-center border-b border-border bg-surface/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-subtle">
        <div className="w-1/2">Key Name</div>
        <div className="w-1/6">Type</div>
        <div className="w-1/6 text-right">TTL</div>
        <div className="w-1/6 text-right">Size</div>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {keys.map((key) => {
          const info = keyInfoMap[key];
          const type = info?.type ?? "unknown";
          const ttl = formatTtl(info?.ttlSeconds);
          const size = key === selectedKey ? formatSize(selectedValue?.value) : "-";
          const badgeStyle = typeBadgeStyles[type] ?? typeBadgeStyles.unknown;
          const isLocal = localKeys.includes(key);
          return (
            <button
              key={key}
              className={`flex w-full items-center border-b border-border/50 px-4 py-3 text-left text-sm transition-all ${
                key === selectedKey
                  ? "border-l-2 border-l-accent bg-accent/20 text-foreground"
                  : "text-muted-foreground hover:bg-surface/60"
              }`}
              type="button"
              onClick={() => onSelectKey(key)}
            >
              <div className="w-1/2 truncate font-mono">
                {key}
                {isLocal && (
                  <span className="ml-2 rounded bg-warning/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-warning">
                    Draft
                  </span>
                )}
              </div>
              <div className="w-1/6">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeStyle}`}
                >
                  {type}
                </span>
              </div>
              <div className="w-1/6 text-right text-xs text-warning">
                {ttl}
              </div>
              <div className="w-1/6 text-right text-xs text-muted-foreground">
                {size}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>{resultsLabel}</span>
        <div className="flex items-center gap-2">
          <button
            className="rounded border border-border-subtle bg-control/60 px-2 py-1 font-semibold text-foreground transition hover:bg-control/80 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
          >
            Prev
          </button>
          <button
            className="rounded border border-border-subtle bg-control/60 px-2 py-1 font-semibold text-foreground transition hover:bg-control/80 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={onNextPage}
            disabled={!hasNextPage}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
