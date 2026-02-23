"use client";

import { useMemo } from "react";

type JsonAwareTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minHeightClassName?: string;
  placeholder?: string;
};

const escapeHtml = (input: string) =>
  input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const highlightJson = (input: string) => {
  const escaped = escapeHtml(input);
  return escaped.replace(
    /(\"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\\"])*\"(?=\s*:)?|\"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\\"])*\"|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (match === "true" || match === "false") return `<span class="text-viz-4">${match}</span>`;
      if (match === "null") return `<span class="text-viz-5">${match}</span>`;
      if (match.startsWith('"')) return `<span class="text-viz-3">${match}</span>`;
      return `<span class="text-viz-2">${match}</span>`;
    },
  );
};

const isJsonString = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
};

export function JsonAwareTextarea({
  value,
  onChange,
  className,
  minHeightClassName = "min-h-[320px]",
  placeholder,
}: JsonAwareTextareaProps) {
  const isJson = useMemo(() => isJsonString(value), [value]);
  const highlighted = useMemo(
    () => (isJson ? highlightJson(value) : escapeHtml(value)),
    [isJson, value],
  );

  return (
    <div
      className={`relative overflow-auto rounded-md border border-border-strong/30 bg-background/40 ${minHeightClassName} ${className ?? ""}`}
    >
      <pre
        className="pointer-events-none whitespace-pre-wrap break-words px-3 py-3 font-mono text-sm leading-relaxed text-foreground"
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html: highlighted + (value.endsWith("\n") ? " " : ""),
        }}
      />
      <textarea
        className="ui-focus absolute inset-0 h-full w-full resize-none bg-transparent px-3 py-3 font-mono text-sm leading-relaxed text-transparent caret-foreground"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
