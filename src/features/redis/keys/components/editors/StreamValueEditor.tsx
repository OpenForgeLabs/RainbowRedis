"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { RedisStreamEntry } from "@/lib/types";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { StreamTableViewer } from "@/features/redis/keys/components/table/StreamTableViewer";
import { Input, JsonSyntaxTextarea } from "@openforgelabs/rainbow-ui";

type StreamValueEditorProps = {
  value: RedisStreamEntry[];
};

type PendingStreamEntry = {
  id?: string;
  values: Record<string, string>;
};

export const StreamValueEditor = forwardRef<
  RedisValueEditorHandle,
  StreamValueEditorProps
>(({ value }, ref) => {
  const safeEntries = Array.isArray(value) ? value : [];
  const [pendingEntries, setPendingEntries] = useState<PendingStreamEntry[]>([]);
  const [entryId, setEntryId] = useState("");
  const [entryFields, setEntryFields] = useState("{\n  \n}");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);

  useEffect(() => {
    setPendingEntries([]);
    setEntryId("");
    setEntryFields("{\n  \n}");
    setParseError(null);
  }, [value]);

  const pendingDisplayEntries = useMemo(
    () =>
      pendingEntries.map((entry, index) => ({
        id: entry.id && entry.id.trim() ? entry.id.trim() : `pending-${index + 1}`,
        values: entry.values,
      })),
    [pendingEntries],
  );

  useImperativeHandle(ref, () => ({
    getValue: () =>
      pendingEntries.map((entry) => ({
        id: entry.id?.trim() ?? "",
        values: entry.values,
      })),
    hasErrors: () => Boolean(parseError) || pendingEntries.length === 0,
  }));

  const handleAddEntry = () => {
    try {
      const parsed = JSON.parse(entryFields);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setParseError("Entry fields must be a JSON object.");
        return;
      }
      setPendingEntries((previous) => [
        ...previous,
        { id: entryId.trim(), values: parsed as Record<string, string> },
      ]);
      setEntryId("");
      setEntryFields("{\n  \n}");
      setParseError(null);
    } catch {
      setParseError("Entry fields must be valid JSON.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Entries</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-subtle">
          stream
        </span>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="min-h-0 flex-1">
            <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-subtle">
              Existing entries
            </div>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-border bg-background text-[10px] font-bold uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-6 py-3 w-1/3">Entry ID</th>
                  <th className="px-6 py-3">Fields</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <StreamTableViewer entries={safeEntries} />
              </tbody>
            </table>
          </div>
          <div>
            <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-subtle">
              Pending entries
            </div>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-border bg-background text-[10px] font-bold uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-6 py-3 w-1/3">Entry ID</th>
                  <th className="px-6 py-3">Fields</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingDisplayEntries.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4" colSpan={3}>
                      <p className="text-xs text-subtle">
                        No pending entries.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingDisplayEntries.map((entry, index) => (
                    <tr
                      key={`pending-${entry.id}-${index}`}
                      className="transition-colors hover:bg-surface/60"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-warning">
                        {entry.id}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(entry.values).map(
                            ([field, value]) => (
                              <span
                                key={`${entry.id}-${field}`}
                                className="rounded border border-border bg-surface/50 px-2 py-0.5 text-[10px] text-foreground"
                              >
                                <span className="text-muted-foreground">
                                  {field}:
                                </span>{" "}
                                {String(value)}
                              </span>
                            ),
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          className="rounded border border-danger/40 bg-danger/10 px-2 py-1 text-[10px] uppercase text-danger transition hover:border-danger/70 hover:bg-danger/20"
                          type="button"
                          onClick={() =>
                            setPendingEntries((previous) =>
                              previous.filter((_, idx) => idx !== index),
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-surface/40">
        <button
          className="flex w-full items-center justify-between px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground"
          type="button"
          onClick={() => setIsAddEntryOpen((previous) => !previous)}
        >
          <span className="flex items-center gap-2">
            Add entry
            <span className="rounded bg-surface-3 px-2 py-0.5 text-[10px] text-muted-foreground">
              pending
            </span>
          </span>
          <span className="material-symbols-outlined text-[18px]">
            {isAddEntryOpen ? "expand_more" : "chevron_right"}
          </span>
        </button>
        {isAddEntryOpen ? (
          <div className="px-6 pb-4">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Entry ID (optional)
                <Input
                  className="rounded-md bg-background text-sm text-foreground"
                  value={entryId}
                  onChange={(event) => setEntryId(event.target.value)}
                  placeholder="Leave empty for auto id"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Fields (JSON)
                <JsonSyntaxTextarea
                  value={entryFields}
                  onChange={setEntryFields}
                  className="min-h-[120px] rounded-lg border border-border bg-background/40"
                />
              </label>
              {parseError && (
                <p className="text-[11px] text-danger">{parseError}</p>
              )}
              <div className="flex justify-end">
                <button
                  className="rounded-md bg-success px-4 py-2 text-xs font-semibold text-success-foreground shadow-[var(--rx-shadow-md)] transition hover:bg-success/90"
                  type="button"
                  onClick={handleAddEntry}
                >
                  Add entry to batch
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

StreamValueEditor.displayName = "StreamValueEditor";
