"use client";

import { Input } from "@openforgelabs/rainbow-ui";

type HashRow = { id: string; field: string; value: string };

type HashTableEditorProps = {
  rows: HashRow[];
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
      {rows.map((row, index) => (
        <tr
          key={row.id}
          className="group transition-colors hover:bg-surface-dark/60"
        >
          <td className="px-6 py-3">
            <Input
              className="w-full border-0 bg-transparent p-0 font-mono text-sm text-action focus:ring-0"
              value={row.field}
              onChange={(event) =>
                onChange(index, "field", event.target.value)
              }
            />
          </td>
          <td className="px-6 py-3">
            <Input
              className="w-full border-0 bg-transparent p-0 font-mono text-sm text-slate-200 focus:ring-0"
              value={row.value}
              onChange={(event) =>
                onChange(index, "value", event.target.value)
              }
            />
          </td>
          <td className="px-6 py-3 text-right">
            <button
              className="opacity-0 transition-opacity group-hover:opacity-100"
              type="button"
              onClick={() => onRemove(index)}
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500 hover:text-rose-400">
                delete
              </span>
            </button>
          </td>
        </tr>
      ))}
      <tr>
        <td className="px-6 py-4" colSpan={3}>
          <button
            className="flex items-center gap-1 rounded-md border border-action/40 bg-action/10 px-2 py-1 text-xs font-semibold text-action transition hover:border-action/70 hover:bg-action/20"
            type="button"
            onClick={onAdd}
          >
            <span className="material-symbols-outlined text-[16px]">
              add_circle
            </span>
            Add new field
          </button>
        </td>
      </tr>
    </>
  );
}
