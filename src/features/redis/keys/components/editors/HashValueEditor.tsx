"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { HashTableEditor } from "@/features/redis/keys/components/table/HashTableEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { Input, SegmentedControl } from "@openforgelabs/rainbow-ui";
import { JsonAwareTextarea } from "@/features/redis/keys/components/shared/JsonAwareTextarea";

type HashRow = { id: string; field: string; value: string };

type HashValueEditorProps = {
  value: Record<string, string>;
};

function parseHashRaw(rawText: string): { data: Record<string, string>; error: string | null } {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { data: {}, error: "Raw content is not a JSON object." };
    }
    const data = Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [field, val]) => {
        acc[field] = String(val ?? "");
        return acc;
      },
      {},
    );
    return { data, error: null };
  } catch {
    return { data: {}, error: "Invalid JSON." };
  }
}

export const HashValueEditor = forwardRef<
  RedisValueEditorHandle,
  HashValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const [fieldQuery, setFieldQuery] = useState("");
  const [rawText, setRawText] = useState(JSON.stringify(value ?? {}, null, 2));
  useEffect(() => {
    setRawText(JSON.stringify(value ?? {}, null, 2));
    setFieldQuery("");
  }, [value]);
  const parsed = useMemo(() => parseHashRaw(rawText), [rawText]);
  const parseError = parsed.error;
  const rows = useMemo<HashRow[]>(
    () =>
      Object.entries(parsed.data).map(([field, val], index) => ({
        id: `row-${index}`,
        field,
        value: val,
      })),
    [parsed.data],
  );

  useImperativeHandle(ref, () => ({
    getValue: () => parsed.data,
  }));

  const filteredRows = rows
    .map((row, index) => ({ ...row, originalIndex: index }))
    .filter((row) =>
      fieldQuery.trim()
        ? row.field.toLowerCase().includes(fieldQuery.trim().toLowerCase())
        : true,
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface/10">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            View Mode
          </span>
          <SegmentedControl
            size="sm"
            value={view}
            onChange={(next) => setView(next)}
            items={[
              { value: "raw", label: "Editor" },
              { value: "table", label: "Fields" },
            ]}
          />
        </div>
        {view === "table" ? (
          <div className="relative w-full max-w-48">
            <span className="material-symbols-outlined pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-subtle">
              search
            </span>
            <Input
              size="sm"
              className="h-7 rounded-md bg-background/60 pl-7 text-[11px]"
              placeholder="Filter fields..."
              value={fieldQuery}
              onChange={(event) => setFieldQuery(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto">
        {view === "table" ? (
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-border bg-background/30">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-border bg-surface/30 text-[10px] font-bold uppercase tracking-wider text-subtle">
                  <tr>
                    <th className="w-1/3 px-4 py-2">Field</th>
                    <th className="px-4 py-2">Value</th>
                    <th className="w-12 px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <HashTableEditor
                    rows={filteredRows}
                    onChange={(index, key, value) => {
                      const nextRows = [...rows];
                      const current = nextRows[index];
                      if (!current) {
                        return;
                      }
                      nextRows[index] = { ...current, [key]: value };
                      const nextData = nextRows.reduce<Record<string, string>>((acc, row) => {
                        if (row.field.trim()) {
                          acc[row.field] = row.value;
                        }
                        return acc;
                      }, {});
                      setRawText(JSON.stringify(nextData, null, 2));
                    }}
                    onRemove={(index) =>
                      setRawText(
                        JSON.stringify(
                          rows
                            .filter((_, idx) => idx !== index)
                            .reduce<Record<string, string>>((acc, row) => {
                              if (row.field.trim()) {
                                acc[row.field] = row.value;
                              }
                              return acc;
                            }, {}),
                          null,
                          2,
                        ),
                      )
                    }
                    onAdd={() =>
                      setRawText(
                        JSON.stringify(
                          rows
                            .concat({
                              id: `row-${rows.length}`,
                              field: `new_field_${rows.length + 1}`,
                              value: "",
                            })
                            .reduce<Record<string, string>>((acc, row) => {
                              if (row.field.trim()) {
                                acc[row.field] = row.value;
                              }
                              return acc;
                            }, {}),
                          null,
                          2,
                        ),
                      )
                    }
                  />
                </tbody>
              </table>
            </div>
            {parseError ? (
              <p className="mt-2 text-[11px] text-danger">{parseError}</p>
            ) : null}
          </div>
        ) : (
          <div className="p-2">
            <JsonAwareTextarea
              value={rawText}
              onChange={setRawText}
              className="h-full"
              minHeightClassName="min-h-[320px]"
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
