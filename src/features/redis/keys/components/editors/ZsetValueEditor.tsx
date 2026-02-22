"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ZsetTableEditor } from "@/features/redis/keys/components/table/ZsetTableEditor";
import { SegmentedControl } from "@openforgelabs/rainbow-ui";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { JsonSyntaxTextarea } from "@openforgelabs/rainbow-ui";

type ZsetRow = { id: string; member: string; score: string };

type ZsetValueEditorProps = {
  value: Array<{ member: string; score: number }>;
};

export const ZsetValueEditor = forwardRef<
  RedisValueEditorHandle,
  ZsetValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const initialRows = Array.isArray(value) ? value : [];
  const [rows, setRows] = useState<ZsetRow[]>(
    initialRows.map((entry) => ({
      id: `row-${Math.random().toString(36).slice(2, 8)}`,
      member: entry.member,
      score: String(entry.score),
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
      nextRows.map((entry) => ({
        id: `row-${Math.random().toString(36).slice(2, 8)}`,
        member: entry.member,
        score: String(entry.score),
      })),
    );
    setRawText(JSON.stringify(nextRows, null, 2));
    setParseError(null);
  }, [value]);

  useImperativeHandle(ref, () => ({
    getValue: () =>
      rows.map((row) => ({
        member: row.member,
        score: Number(row.score),
      })),
    hasErrors: () =>
      rows.some((row) => row.member.trim() === "" || Number.isNaN(Number(row.score))),
  }));

  useEffect(() => {
    if (lastEditSource.current === "raw") {
      return;
    }
    if (view !== "table") {
      return;
    }
    setRawText(
      JSON.stringify(
        rows.map((row) => ({
          member: row.member,
          score: Number(row.score),
        })),
        null,
        2,
      ),
    );
    setParseError(null);
  }, [rows, view]);

  const handleRawChange = (nextValue: string) => {
    lastEditSource.current = "raw";
    setRawText(nextValue);
    try {
      const parsed = JSON.parse(nextValue);
      if (Array.isArray(parsed)) {
        setRows(
          parsed.map((entry) => ({
            id: `row-${Math.random().toString(36).slice(2, 8)}`,
            member: String(entry?.member ?? ""),
            score:
              entry?.score === undefined || entry?.score === null
                ? "0"
                : String(entry.score),
          })),
        );
        setParseError(null);
      } else {
        setParseError("Raw content is not an array of {member, score}.");
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
          zset
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
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  <ZsetTableEditor
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
                        { id: `row-${Date.now()}`, member: "", score: "0" },
                      ])
                    }
                    empty={rows.length === 0}
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

ZsetValueEditor.displayName = "ZsetValueEditor";
