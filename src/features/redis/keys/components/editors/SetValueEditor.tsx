"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { SetTableEditor } from "@/features/redis/keys/components/table/SetTableEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { JsonSyntaxTextarea, SegmentedControl } from "@openforgelabs/rainbow-ui";

type SetRow = { id: string; value: string };

type SetValueEditorProps = {
  value: string[];
};

export const SetValueEditor = forwardRef<
  RedisValueEditorHandle,
  SetValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const initialRows = Array.isArray(value) ? value : [];
  const [rows, setRows] = useState<SetRow[]>(
    initialRows.map((item) => ({
      id: `row-${Math.random().toString(36).slice(2, 8)}`,
      value: item,
    })),
  );
  const [rawText, setRawText] = useState(
    JSON.stringify(initialRows, null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const lastEditSource = useRef<"raw" | "table" | null>(null);

  useEffect(() => {
    const nextRows = Array.isArray(value) ? value : [];
    setRows(
      nextRows.map((item) => ({
        id: `row-${Math.random().toString(36).slice(2, 8)}`,
        value: item,
      })),
    );
    setRawText(JSON.stringify(nextRows, null, 2));
    setParseError(null);
  }, [value]);

  useImperativeHandle(ref, () => ({
    getValue: () => rows.map((row) => row.value),
    hasErrors: () => hasDuplicates,
  }));

  const hasDuplicates = useMemo(() => {
    return rows.some(
      (row) =>
        row.value &&
        rows.filter((item) => item.value === row.value).length > 1,
    );
  }, [rows]);

  useEffect(() => {
    if (lastEditSource.current === "raw") {
      return;
    }
    if (view !== "table") {
      return;
    }
    setRawText(JSON.stringify(rows.map((row) => row.value), null, 2));
    setParseError(null);
  }, [rows, view]);

  const handleRawChange = (nextValue: string) => {
    lastEditSource.current = "raw";
    setRawText(nextValue);
    try {
      const parsed = JSON.parse(nextValue);
      if (Array.isArray(parsed)) {
        setRows(
          parsed.map((item) => ({
            id: `row-${Math.random().toString(36).slice(2, 8)}`,
            value: String(item),
          })),
        );
        setParseError(null);
      } else {
        setParseError("Raw content is not a JSON array.");
      }
    } catch {
      setParseError("Invalid JSON.");
    } finally {
      lastEditSource.current = null;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border-dark bg-surface-dark/50 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Values</span>
          <SegmentedControl
            value={view}
            onChange={(next) => setView(next)}
            items={[
              { value: "raw", label: "Raw" },
              { value: "table", label: "Table" },
            ]}
          />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          set
        </span>
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto">
        {view === "table" ? (
          <div className="flex flex-col gap-6">
            <div>
              <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Entries
              </div>
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-border-dark bg-background text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3 w-1/3">Member</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  <SetTableEditor
                    rows={rows}
                    onChange={(index, value) => {
                      lastEditSource.current = "table";
                      setRows((previous) =>
                        previous.map((row, idx) =>
                          idx === index ? { ...row, value } : row,
                        ),
                      );
                    }}
                    onRemove={(index) =>
                      setRows((previous) =>
                        previous.filter((_, idx) => idx !== index),
                      )
                    }
                    onAdd={() =>
                      setRows((previous) => [
                        ...previous,
                        { id: `row-${Date.now()}`, value: "" },
                      ])
                    }
                    hasDuplicates={hasDuplicates}
                  />
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <JsonSyntaxTextarea
              value={rawText}
              onChange={handleRawChange}
              className="min-h-[280px] rounded-lg border border-border-dark bg-background/40"
            />
            {parseError && (
              <p className="mt-2 text-[11px] text-rose-300">{parseError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SetValueEditor.displayName = "SetValueEditor";
