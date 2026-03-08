"use client";

import { useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView, placeholder as cmPlaceholder } from "@codemirror/view";
import { Button, Modal } from "@openforgelabs/rainbow-ui";

type JsonAwareTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSaveEmbeddedJson?: () => void | Promise<void>;
  className?: string;
  minHeightClassName?: string;
  placeholder?: string;
};

type EmbeddedJsonRange = {
  from: number;
  to: number;
};

const isJsonString = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
};

const normalizeEmbeddedJsonText = (content: string) => content.replace(/\u00A0/g, " ");

const isEscapedQuote = (text: string, quoteIndex: number) => {
  let backslashes = 0;
  let pointer = quoteIndex - 1;
  while (pointer >= 0 && text[pointer] === "\\") {
    backslashes += 1;
    pointer -= 1;
  }
  return backslashes % 2 === 1;
};

const findStringLiteralBounds = (text: string, position: number): EmbeddedJsonRange | null => {
  if (!text.length) return null;
  const safePosition = Math.max(0, Math.min(position, text.length - 1));
  let leftQuote = -1;
  for (let i = safePosition; i >= 0; i -= 1) {
    if (text[i] === '"' && !isEscapedQuote(text, i)) {
      leftQuote = i;
      break;
    }
  }
  if (leftQuote === -1) return null;

  let rightQuote = -1;
  for (let i = leftQuote + 1; i < text.length; i += 1) {
    if (text[i] === '"' && !isEscapedQuote(text, i)) {
      rightQuote = i;
      break;
    }
  }
  if (rightQuote === -1 || safePosition < leftQuote || safePosition > rightQuote) return null;

  return { from: leftQuote, to: rightQuote + 1 };
};

const isLikelyJsonValueString = (text: string, from: number) => {
  let pointer = from - 1;
  while (pointer >= 0 && /\s/.test(text[pointer])) {
    pointer -= 1;
  }
  if (pointer < 0) return false;
  return text[pointer] === ":" || text[pointer] === "," || text[pointer] === "[";
};

export function JsonAwareTextarea({
  value,
  onChange,
  onSaveEmbeddedJson,
  className,
  minHeightClassName = "min-h-[320px]",
  placeholder,
}: JsonAwareTextareaProps) {
  const editorViewRef = useRef<EditorView | null>(null);
  const [embeddedRange, setEmbeddedRange] = useState<EmbeddedJsonRange | null>(null);
  const [embeddedText, setEmbeddedText] = useState("");
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);

  const jsonHighlight = useMemo(
    () =>
      HighlightStyle.define([
        { tag: tags.propertyName, color: "rgb(var(--rx-color-accent))" },
        { tag: tags.string, color: "rgb(var(--rx-color-info))" },
        { tag: tags.number, color: "rgb(var(--rx-color-primary))" },
        { tag: [tags.bool, tags.null], color: "rgb(var(--rx-color-warning))" },
        { tag: [tags.brace, tags.bracket, tags.punctuation], color: "rgb(var(--rx-color-text-muted))" },
      ]),
    [],
  );

  const extensions = useMemo(() => {
    const result = [
      EditorView.lineWrapping,
      syntaxHighlighting(jsonHighlight),
      EditorView.domEventHandlers({
        click: (event, view) => {
          const position = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (position == null) return false;

          const fullText = view.state.doc.toString();
          const bounds = findStringLiteralBounds(fullText, position);
          if (!bounds || !isLikelyJsonValueString(fullText, bounds.from)) return false;

          const literal = fullText.slice(bounds.from, bounds.to);
          let decodedString = "";
          try {
            decodedString = JSON.parse(literal);
          } catch {
            return false;
          }
          if (typeof decodedString !== "string") return false;

          let parsedEmbedded: unknown;
          try {
            parsedEmbedded = JSON.parse(normalizeEmbeddedJsonText(decodedString));
          } catch {
            return false;
          }
          if (!parsedEmbedded || typeof parsedEmbedded !== "object") return false;

          setEmbeddedRange(bounds);
          setEmbeddedText(JSON.stringify(parsedEmbedded, null, 2));
          setEmbeddedError(null);
          return false;
        },
      }),
    ];
    if (placeholder) {
      result.push(cmPlaceholder(placeholder));
    }
    if (isJsonString(value)) {
      result.push(json());
    }
    return result;
  }, [jsonHighlight, placeholder, value]);

  const theme = useMemo(
    () =>
      EditorView.theme({
        "&": {
          height: "100%",
          maxHeight: "100%",
          color: "rgb(var(--rx-color-foreground))",
          backgroundColor: "transparent",
        },
        "&.cm-editor.cm-focused": {
          outline: "none",
        },
        ".cm-scroller": {
          height: "100%",
          overflow: "auto",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
          lineHeight: "1.55",
        },
        ".cm-content": {
          minHeight: "100%",
          padding: "12px",
          fontSize: "0.875rem",
        },
        ".cm-gutters": {
          display: "none",
        },
        ".cm-cursor": {
          borderLeftColor: "rgb(var(--rx-color-foreground))",
        },
        ".cm-activeLine": {
          backgroundColor: "transparent",
        },
        ".cm-selectionBackground, ::selection": {
          backgroundColor: "rgb(var(--rx-color-primary) / 0.18) !important",
        },
        ".cm-panels": {
          borderTop: "1px solid rgb(var(--rx-color-border))",
          backgroundColor: "rgb(var(--rx-color-surface-2) / 1)",
          color: "rgb(var(--rx-color-text) / 1)",
        },
        ".cm-panels-bottom": {
          borderTop: "1px solid rgb(var(--rx-color-border))",
        },
        ".cm-panels-top": {
          borderBottom: "1px solid rgb(var(--rx-color-border))",
        },
        ".cm-search": {
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          color: "rgb(var(--rx-color-text) / 1)",
        },
        ".cm-search label": {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          fontSize: "0.75rem",
          color: "rgb(var(--rx-color-text-muted) / 1)",
        },
        ".cm-search input": {
          height: "1.85rem",
          borderRadius: "0.5rem",
          border: "1px solid rgb(var(--rx-color-border))",
          backgroundColor: "rgb(var(--rx-color-control) / 1)",
          color: "rgb(var(--rx-color-text) / 1)",
          padding: "0 0.5rem",
          outline: "none",
        },
        ".cm-search input:focus": {
          borderColor: "rgb(var(--rx-color-primary) / 1)",
          boxShadow: "0 0 0 2px rgb(var(--rx-color-ring) / 0.3)",
        },
        ".cm-search button": {
          height: "1.85rem",
          borderRadius: "0.5rem",
          border: "1px solid rgb(var(--rx-color-border))",
          backgroundColor: "rgb(var(--rx-color-control) / 1)",
          color: "rgb(var(--rx-color-text) / 1)",
          padding: "0 0.6rem",
          fontSize: "0.75rem",
          fontWeight: "600",
          cursor: "pointer",
        },
        ".cm-search button:hover": {
          borderColor: "rgb(var(--rx-color-border-strong) / 1)",
          backgroundColor: "rgb(var(--rx-color-control) / 0.85)",
        },
        ".cm-search button:disabled": {
          opacity: "0.55",
          cursor: "not-allowed",
        },
        ".cm-search input[type='checkbox']": {
          accentColor: "rgb(var(--rx-color-primary) / 1)",
        },
        ".cm-search .cm-button": {
          color: "rgb(var(--rx-color-primary) / 1)",
        },
        ".cm-searchMatch": {
          backgroundColor: "rgb(var(--rx-color-warning) / 0.25)",
          outline: "1px solid rgb(var(--rx-color-warning) / 0.35)",
        },
        ".cm-searchMatch.cm-searchMatch-selected": {
          backgroundColor: "rgb(var(--rx-color-primary) / 0.28)",
          outline: "1px solid rgb(var(--rx-color-primary) / 0.45)",
        },
      }),
    [],
  );

  return (
    <>
      <div
        className={`relative min-h-0 overflow-hidden rounded-md border border-border-strong/30 bg-background/40 ${minHeightClassName} ${className ?? ""}`}
      >
        <CodeMirror
          className="absolute inset-0 [&_.cm-editor]:h-full [&_.cm-editor]:max-h-full [&_.cm-scroller]:max-h-full [&_.cm-scroller]:overflow-y-auto [&_.cm-scroller]:overflow-x-hidden"
          value={value}
          height="100%"
          maxHeight="100%"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
          theme={theme}
          extensions={extensions}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
          onChange={onChange}
        />
      </div>

      <Modal
        open={Boolean(embeddedRange)}
        onClose={() => {
          setEmbeddedRange(null);
          setEmbeddedError(null);
        }}
        title="Edit Embedded JSON"
        description="Update the embedded JSON. It will be saved back as an escaped JSON string."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              tone="neutral"
              onClick={() => {
                setEmbeddedRange(null);
                setEmbeddedError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              tone="primary"
              onClick={() => {
                if (!embeddedRange || !editorViewRef.current) return;
                try {
                  const parsedEmbedded = JSON.parse(normalizeEmbeddedJsonText(embeddedText));
                  const escapedJsonLiteral = JSON.stringify(JSON.stringify(parsedEmbedded, null, 2));
                  editorViewRef.current.dispatch({
                    changes: {
                      from: embeddedRange.from,
                      to: embeddedRange.to,
                      insert: escapedJsonLiteral,
                    },
                  });
                  setEmbeddedRange(null);
                  setEmbeddedError(null);
                  setTimeout(() => {
                    void onSaveEmbeddedJson?.();
                  }, 0);
                } catch {
                  setEmbeddedError("Invalid JSON. Fix the content before saving.");
                }
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="flex h-[55vh] min-h-[320px] flex-col gap-2">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-background/50">
            <CodeMirror
              className="absolute inset-0 [&_.cm-editor]:h-full [&_.cm-editor]:max-h-full [&_.cm-scroller]:max-h-full [&_.cm-scroller]:overflow-y-auto [&_.cm-scroller]:overflow-x-hidden"
              value={embeddedText}
              height="100%"
              maxHeight="100%"
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
              }}
              theme={theme}
              extensions={[EditorView.lineWrapping, syntaxHighlighting(jsonHighlight), json()]}
              onChange={setEmbeddedText}
            />
          </div>
          {embeddedError ? <p className="text-xs text-danger">{embeddedError}</p> : null}
        </div>
      </Modal>
    </>
  );
}
