"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { StringPreview } from "@/features/redis/keys/components/shared/StringPreview";
import { SegmentedControl, Select } from "@openforgelabs/rainbow-ui";
import { JsonAwareTextarea } from "@/features/redis/keys/components/shared/JsonAwareTextarea";

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
              { value: "table", label: "Preview" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            className="!h-7 !w-24 rounded-md bg-background/60 text-[11px]"
            value={contentFormat}
            onChange={(event) =>
              handleFormatChange(event.target.value as "auto" | "json" | "text")
            }
            aria-label="Content format"
          >
            <option value="auto">Auto</option>
            <option value="json">JSON</option>
            <option value="text">Text</option>
          </Select>
          <button
            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              prettify
                ? "border-accent/40 bg-accent/20 text-accent"
                : "border-border text-subtle hover:border-border-strong hover:text-foreground"
            }`}
            type="button"
            onClick={() => {
              setPrettify((prev) => {
                const nextValue = !prev;
                handlePrettify(nextValue);
                return nextValue;
              });
            }}
            disabled={contentFormat === "text"}
          >
            Prettify
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto">
        {view === "table" ? (
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-border bg-background/30">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-border bg-surface/30 text-[10px] font-bold uppercase tracking-wider text-subtle">
                  <tr>
                    <th className="w-1/3 px-4 py-2">Key</th>
                    <th className="px-4 py-2">Value</th>
                    <th className="w-12 px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <StringPreview preview={rawText || "—"} />
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col p-2">
            <JsonAwareTextarea
              value={rawText}
              onChange={setRawText}
              className="h-full"
              minHeightClassName="min-h-[320px]"
            />
          </div>
        )}
      </div>
    </div>
  );
});

StringValueEditor.displayName = "StringValueEditor";
