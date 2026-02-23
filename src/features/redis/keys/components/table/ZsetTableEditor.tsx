"use client";

import { Input } from "@openforgelabs/rainbow-ui";

type ZsetRow = { id: string; member: string; score: string };

type ZsetTableEditorProps = {
  rows: ZsetRow[];
  onChange: (index: number, key: "member" | "score", value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  empty: boolean;
};

export function ZsetTableEditor({
  rows,
  onChange,
  onRemove,
  onAdd,
  empty,
}: ZsetTableEditorProps) {
  return (
    <>
      {empty && (
        <tr>
          <td className="px-6 py-4" colSpan={3}>
            <p className="text-xs text-subtle">
              No sorted set members available.
            </p>
          </td>
        </tr>
      )}
      {rows.map((entry, index) => (
        <tr
          key={entry.id}
          className="group transition-colors hover:bg-surface/60"
        >
          <td className="px-6 py-3 font-mono text-xs text-accent">
            <Input
              className="w-full border-0 bg-transparent p-0 font-mono text-xs text-accent focus:ring-0"
              value={entry.member}
              onChange={(event) =>
                onChange(index, "member", event.target.value)
              }
            />
          </td>
          <td className="px-6 py-3 text-xs text-foreground">
            <Input
              className="w-full border-0 bg-transparent p-0 text-xs text-foreground focus:ring-0"
              value={entry.score}
              onChange={(event) =>
                onChange(index, "score", event.target.value)
              }
            />
          </td>
          <td className="px-6 py-3 text-right">
            <button
              className="opacity-0 transition-opacity group-hover:opacity-100"
              type="button"
              onClick={() => onRemove(index)}
            >
              <span className="material-symbols-outlined text-[16px] text-subtle hover:text-danger">
                delete
              </span>
            </button>
          </td>
        </tr>
      ))}
      <tr>
        <td className="px-6 py-4" colSpan={3}>
          <button
            className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-foreground transition hover:border-primary/70 hover:bg-primary/20"
            type="button"
            onClick={onAdd}
          >
            <span className="material-symbols-outlined text-[16px]">
              add_circle
            </span>
            Add member
          </button>
        </td>
      </tr>
    </>
  );
}
