"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { StringPreview } from "@/features/redis/keys/components/shared/StringPreview";
import { JsonSyntaxTextarea, SegmentedControl, Select } from "@openforgelabs/rainbow-ui";

type StringValueEditorProps = {
  value: unknown;
};

export const StringValueEditor = forwardRef<
  RedisValueEditorHandle,
  StringValueEditorProps
>(({ value }, ref) => {
  const [view, setView] = useState<"table" | "raw">("raw");
  const [contentFormat, setContentFormat] = useState<"auto" | "json" | "text">(
    "auto",
  );
  const [prettify, setPrettify] = useState(true);
  const initialPayload = useMemo(() => {
    let detectedJson = false;
    let text = "";
    if (value === null || value === undefined) {
      return { text: "", detectedJson };
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && (typeof parsed === "object" || Array.isArray(parsed))) {
          detectedJson = true;
          text = JSON.stringify(parsed, null, 2);
          return { text, detectedJson };
        }
      } catch {
        // ignore invalid JSON
      }
      text = value;
      return { text, detectedJson };
    }
    try {
      text = JSON.stringify(value, null, 2);
      return { text, detectedJson: true };
    } catch {
      text = String(value);
      return { text, detectedJson: false };
    }
  }, [value]);
  const [rawText, setRawText] = useState(initialPayload.text);

  useEffect(() => {
    setRawText(initialPayload.text);
    if (initialPayload.detectedJson) {
      setContentFormat("json");
    } else if (contentFormat === "json") {
      setContentFormat("auto");
    }
  }, [contentFormat, initialPayload]);

  useImperativeHandle(ref, () => ({
    getValue: () => rawText,
  }));

  const handlePrettify = (nextValue: boolean) => {
    if (contentFormat === "text") {
      return;
    }
    try {
      const parsed = JSON.parse(rawText);
      setRawText(JSON.stringify(parsed, null, nextValue ? 2 : undefined));
    } catch {
      // ignore invalid JSON
    }
  };

  const handleFormatChange = (format: "auto" | "json" | "text") => {
    setContentFormat(format);
    if (format === "text") {
      return;
    }
    try {
      const parsed = JSON.parse(rawText);
      setRawText(JSON.stringify(parsed, null, prettify ? 2 : undefined));
    } catch {
      // ignore invalid JSON
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
          string
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
                    <th className="px-6 py-3 w-1/3">Key</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  <StringPreview preview={rawText || "—"} />
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded border border-border-dark bg-background px-2 py-1 text-[11px] text-slate-400">
                <span className="material-symbols-outlined text-[14px]">
                  tune
                </span>
                <Select
                  className="border-0 bg-transparent p-0 text-[11px] text-slate-300 focus:ring-0"
                  value={contentFormat}
                  onChange={(event) =>
                    handleFormatChange(
                      event.target.value as "auto" | "json" | "text",
                    )
                  }
                >
                  <option value="auto">Auto</option>
                  <option value="json">JSON</option>
                  <option value="text">Text</option>
                </Select>
              </div>
              <button
                className={`rounded border px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                  prettify
                    ? "border-action/40 bg-gradient-to-r from-action to-action-strong text-white shadow-[0_8px_16px_rgba(15,23,42,0.35)]"
                    : "border-border-dark/70 text-slate-400 hover:border-action/50 hover:text-white"
                }`}
                type="button"
                onClick={() => {
                  setPrettify((prev) => {
                    const nextValue = !prev;
                    handlePrettify(nextValue);
                    return nextValue;
                  });
                }}
              >
                Prettify
              </button>
            </div>
            <JsonSyntaxTextarea
              value={rawText}
              onChange={setRawText}
              className="min-h-[280px] rounded-lg border border-border-dark bg-background/40"
            />
          </div>
        )}
      </div>
    </div>
  );
});

StringValueEditor.displayName = "StringValueEditor";
