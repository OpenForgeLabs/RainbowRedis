"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { HashTableEditor } from "@/features/redis/keys/components/table/HashTableEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { Input, JsonSyntaxTextarea, SegmentedControl } from "@openforgelabs/rainbow-ui";

type HashRow = { id: string; field: string; value: string };

type HashValueEditorProps = {
  value: Record<string, string>;
};

export const HashValueEditor = forwardRef<
  RedisValueEditorHandle,
  HashValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const [rawText, setRawText] = useState(
    JSON.stringify(value ?? {}, null, 2),
  );
  const [rows, setRows] = useState<HashRow[]>(
    Object.entries(value ?? {}).map(([field, val]) => ({
      id: `${field}-${Math.random().toString(36).slice(2, 8)}`,
      field,
      value: val,
    })),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const lastEditSource = useRef<"raw" | "table" | null>(null);

  useEffect(() => {
    const nextValue = value ?? {};
    setRows(
      Object.entries(nextValue).map(([field, val]) => ({
        id: `${field}-${Math.random().toString(36).slice(2, 8)}`,
        field,
        value: val,
      })),
    );
    setRawText(JSON.stringify(nextValue, null, 2));
    setParseError(null);
  }, [value]);

  useImperativeHandle(ref, () => ({
    getValue: () =>
      rows.reduce<Record<string, string>>((acc, row) => {
        if (row.field.trim()) {
          acc[row.field] = row.value;
        }
        return acc;
      }, {}),
  }));

  useEffect(() => {
    if (lastEditSource.current === "raw") {
      return;
    }
    if (view !== "table") {
      return;
    }
    const nextRaw = JSON.stringify(
      rows.reduce<Record<string, string>>((acc, row) => {
        if (row.field.trim()) {
          acc[row.field] = row.value;
        }
        return acc;
      }, {}),
      null,
      2,
    );
    setRawText(nextRaw);
    setParseError(null);
  }, [rows, view]);

  const handleRawChange = (nextValue: string) => {
    lastEditSource.current = "raw";
    setRawText(nextValue);
    try {
      const parsed = JSON.parse(nextValue);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setRows(
          Object.entries(parsed as Record<string, string>).map(
            ([field, val]) => ({
              id: `${field}-${Math.random().toString(36).slice(2, 8)}`,
              field,
              value: val,
            }),
          ),
        );
        setParseError(null);
      } else {
        setParseError("Raw content is not a JSON object.");
      }
    } catch {
      setParseError("Invalid JSON.");
    } finally {
      lastEditSource.current = null;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Values</span>
          <SegmentedControl
            value={view}
            onChange={(next) => setView(next)}
            items={[
              { value: "raw", label: "Raw" },
              { value: "table", label: "Table" },
            ]}
          />
          {view === "table" && (
            <div className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              <span className="material-symbols-outlined text-[14px]">
                search
              </span>
              <Input
                className="w-32 border-0 bg-transparent p-0 text-[11px] text-muted-foreground focus:ring-0"
                placeholder="Filter fields..."
              />
            </div>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-subtle">
          hash
        </span>
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto">
        {view === "table" ? (
          <div className="flex flex-col gap-6">
            <div>
              <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-subtle">
                Entries
              </div>
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-border bg-background text-[10px] font-bold uppercase tracking-wider text-subtle">
                  <tr>
                    <th className="px-6 py-3 w-1/3">Field</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <HashTableEditor
                    rows={rows}
                    onChange={(index, key, value) => {
                      lastEditSource.current = "table";
                      setRows((previous) =>
                        previous.map((row, idx) =>
                          idx === index ? { ...row, [key]: value } : row,
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
                        { id: `row-${Date.now()}`, field: "", value: "" },
                      ])
                    }
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
              className="min-h-[280px] rounded-lg border border-border bg-background/40"
            />
            {parseError && (
              <p className="mt-2 text-[11px] text-danger">{parseError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

HashValueEditor.displayName = "HashValueEditor";
