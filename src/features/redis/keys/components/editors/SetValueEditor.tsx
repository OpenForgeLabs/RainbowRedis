"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { SetTableEditor } from "@/features/redis/keys/components/table/SetTableEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { SegmentedControl } from "@openforgelabs/rainbow-ui";
import { JsonAwareTextarea } from "@/features/redis/keys/components/shared/JsonAwareTextarea";

type SetRow = { id: string; value: string };

type SetValueEditorProps = {
  value: string[];
};

export const SetValueEditor = forwardRef<
  RedisValueEditorHandle,
  SetValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const [rawText, setRawText] = useState(JSON.stringify(Array.isArray(value) ? value : [], null, 2));
  useEffect(() => {
    setRawText(JSON.stringify(Array.isArray(value) ? value : [], null, 2));
  }, [value]);
  const parsed = useMemo(() => {
    try {
      const data = JSON.parse(rawText);
      if (!Array.isArray(data)) {
        return { data: [] as string[], error: "Raw content is not a JSON array." };
      }
      return { data: data.map((item) => String(item)), error: null as string | null };
    } catch {
      return { data: [] as string[], error: "Invalid JSON." };
    }
  }, [rawText]);
  const parseError = parsed.error;
  const rows = useMemo<SetRow[]>(
    () =>
      parsed.data.map((item, index) => ({
        id: `row-${index}`,
        value: item,
      })),
    [parsed.data],
  );

  useImperativeHandle(ref, () => ({
    getValue: () => parsed.data,
    hasErrors: () => hasDuplicates,
  }));

  const hasDuplicates = useMemo(() => {
    return rows.some(
      (row) =>
        row.value &&
        rows.filter((item) => item.value === row.value).length > 1,
    );
  }, [rows]);

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
              { value: "table", label: "Members" },
            ]}
          />
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto">
        {view === "table" ? (
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-border bg-background/30">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-border bg-surface/30 text-[10px] font-bold uppercase tracking-wider text-subtle">
                  <tr>
                    <th className="w-1/3 px-4 py-2">Member</th>
                    <th className="px-4 py-2">Value</th>
                    <th className="w-12 px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <SetTableEditor
                    rows={rows}
                    onChange={(index, value) =>
                      setRawText(
                        JSON.stringify(
                          rows.map((row, idx) => (idx === index ? value : row.value)),
                          null,
                          2,
                        ),
                      )
                    }
                    onRemove={(index) =>
                      setRawText(
                        JSON.stringify(
                          rows.filter((_, idx) => idx !== index).map((row) => row.value),
                          null,
                          2,
                        ),
                      )
                    }
                    onAdd={() =>
                      setRawText(
                        JSON.stringify([...rows.map((row) => row.value), ""], null, 2),
                      )
                    }
                    hasDuplicates={hasDuplicates}
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

SetValueEditor.displayName = "SetValueEditor";
