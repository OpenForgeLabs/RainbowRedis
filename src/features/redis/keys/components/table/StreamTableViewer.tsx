"use client";

import { RedisStreamEntry } from "@/lib/types";

type StreamTableViewerProps = {
  entries: RedisStreamEntry[] | unknown;
};

export function StreamTableViewer({ entries }: StreamTableViewerProps) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return (
    <div className="flex flex-col gap-3 p-4">
      {safeEntries.length === 0 ? (
        <p className="text-xs text-subtle">No stream entries available.</p>
      ) : null}
      {safeEntries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl border border-border bg-surface/40 p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
              {entry.id}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-subtle">
              Event Entry
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(entry.values).map(([field, value]) => (
              <div
                key={`${entry.id}-${field}`}
                className="flex items-center overflow-hidden rounded border border-border bg-background text-[11px]"
              >
                <span className="border-r border-border bg-surface-3 px-2 py-1 text-subtle">
                  {field}
                </span>
                <span className="px-2 py-1 text-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
