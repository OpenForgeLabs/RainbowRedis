"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { ZsetTableEditor } from "@/features/redis/keys/components/table/ZsetTableEditor";
import { SegmentedControl } from "@openforgelabs/rainbow-ui";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { JsonAwareTextarea } from "@/features/redis/keys/components/shared/JsonAwareTextarea";

type ZsetRow = { id: string; member: string; score: string };

type ZsetValueEditorProps = {
  value: Array<{ member: string; score: number }>;
};

export const ZsetValueEditor = forwardRef<
  RedisValueEditorHandle,
  ZsetValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const [rawText, setRawText] = useState(
    JSON.stringify(Array.isArray(value) ? value : [], null, 2),
  );
  useEffect(() => {
    setRawText(JSON.stringify(Array.isArray(value) ? value : [], null, 2));
  }, [value]);
  const parsed = useMemo(() => {
    try {
      const data = JSON.parse(rawText);
      if (!Array.isArray(data)) {
        return {
          data: [] as Array<{ member: string; score: string }>,
          error: "Raw content is not an array of {member, score}.",
        };
      }
      return {
        data: data.map((entry) => ({
          member: String(entry?.member ?? ""),
          score:
            entry?.score === undefined || entry?.score === null
              ? "0"
              : String(entry.score),
        })),
        error: null as string | null,
      };
    } catch {
      return {
        data: [] as Array<{ member: string; score: string }>,
        error: "Invalid JSON.",
      };
    }
  }, [rawText]);
  const parseError = parsed.error;
  const rows = useMemo<ZsetRow[]>(
    () =>
      parsed.data.map((entry, index) => ({
        id: `row-${index}`,
        member: entry.member,
        score: entry.score,
      })),
    [parsed.data],
  );

  useImperativeHandle(ref, () => ({
    getValue: () =>
      parsed.data.map((row) => ({
        member: row.member,
        score: Number(row.score),
      })),
    hasErrors: () =>
      parsed.data.some(
        (row) => row.member.trim() === "" || Number.isNaN(Number(row.score)),
      ),
  }));

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
              { value: "table", label: "Scores" },
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
                    <th className="w-1/2 px-4 py-2">Member</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="w-12 px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <ZsetTableEditor
                    rows={rows}
                    onChange={(index, key, value) =>
                      setRawText(
                        JSON.stringify(
                          rows.map((row, idx) =>
                            idx === index
                              ? { member: key === "member" ? value : row.member, score: key === "score" ? value : row.score }
                              : { member: row.member, score: row.score },
                          ),
                          null,
                          2,
                        ),
                      )
                    }
                    onRemove={(index) =>
                      setRawText(
                        JSON.stringify(
                          rows
                            .filter((_, idx) => idx !== index)
                            .map((row) => ({ member: row.member, score: row.score })),
                          null,
                          2,
                        ),
                      )
                    }
                    onAdd={() =>
                      setRawText(
                        JSON.stringify(
                          [...rows.map((row) => ({ member: row.member, score: row.score })), { member: "", score: "0" }],
                          null,
                          2,
                        ),
                      )
                    }
                    empty={rows.length === 0}
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

ZsetValueEditor.displayName = "ZsetValueEditor";
