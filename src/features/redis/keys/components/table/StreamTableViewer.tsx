"use client";

import { RedisStreamEntry } from "@/lib/types";

type StreamTableViewerProps = {
  entries: RedisStreamEntry[] | unknown;
};

export function StreamTableViewer({ entries }: StreamTableViewerProps) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return (
    <>
      {safeEntries.length === 0 && (
        <tr>
          <td className="px-6 py-4" colSpan={3}>
            <p className="text-xs text-slate-500">
              No stream entries available.
            </p>
          </td>
        </tr>
      )}
      {safeEntries.map((entry) => (
        <tr
          key={entry.id}
          className="transition-colors hover:bg-surface-dark/60"
        >
          <td className="px-6 py-3 font-mono text-xs text-action">
            {entry.id}
          </td>
          <td className="px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(entry.values).map(([field, value]) => (
                <span
                  key={`${entry.id}-${field}`}
                  className="rounded border border-border-dark bg-surface-dark/50 px-2 py-0.5 text-[10px] text-slate-200"
                >
                  <span className="text-slate-400">{field}:</span>{" "}
                  {String(value)}
                </span>
              ))}
            </div>
          </td>
          <td className="px-6 py-3"></td>
        </tr>
      ))}
    </>
  );
}
