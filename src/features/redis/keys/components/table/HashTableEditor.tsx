"use client";

import { Input } from "@openforgelabs/rainbow-ui";

type HashRow = { id: string; field: string; value: string };

type HashTableEditorProps = {
  rows: Array<HashRow & { originalIndex: number }>;
  onChange: (index: number, key: "field" | "value", value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
};

export function HashTableEditor({
  rows,
  onChange,
  onRemove,
  onAdd,
}: HashTableEditorProps) {
  return (
    <>
      {rows.length === 0 ? (
        <tr>
          <td className="px-4 py-4 text-xs text-subtle" colSpan={3}>
            No matching fields.
          </td>
        </tr>
      ) : null}
      {rows.map((row) => (
        <tr
          key={row.id}
          className="group transition-colors hover:bg-accent/5"
        >
          <td className="px-4 py-2">
            <Input
              size="sm"
              className="w-full border-0 bg-transparent p-0 font-mono text-xs text-accent focus:ring-0"
              value={row.field}
              onChange={(event) =>
                onChange(row.originalIndex, "field", event.target.value)
              }
            />
          </td>
          <td className="px-4 py-2">
            <Input
              size="sm"
              className="w-full border-0 bg-transparent p-0 font-mono text-xs text-foreground focus:ring-0"
              value={row.value}
              onChange={(event) =>
                onChange(row.originalIndex, "value", event.target.value)
              }
            />
          </td>
          <td className="px-2 py-2 text-center">
            <button
              className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger/10"
              type="button"
              onClick={() => onRemove(row.originalIndex)}
              aria-label="Remove field"
            >
              <span className="material-symbols-outlined text-[16px] text-subtle hover:text-danger">
                delete
              </span>
            </button>
          </td>
        </tr>
      ))}
      <tr>
        <td className="px-4 py-3" colSpan={3}>
          <button
            className="flex h-7 items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 text-[10px] font-bold uppercase tracking-wide text-accent transition-colors hover:bg-accent/20"
            type="button"
            onClick={onAdd}
          >
            <span className="material-symbols-outlined text-[14px]">
              add
            </span>
            Add Field
          </button>
        </td>
      </tr>
    </>
  );
}
