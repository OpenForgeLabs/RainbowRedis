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
        <tr key={entry.id} className="group transition-colors hover:bg-warning/5">
          <td className="px-4 py-2 font-mono text-xs text-foreground">
            <Input
              size="sm"
              className="w-full border-0 bg-transparent p-0 font-mono text-xs text-foreground focus:ring-0"
              value={entry.member}
              onChange={(event) =>
                onChange(index, "member", event.target.value)
              }
            />
          </td>
          <td className="px-4 py-2">
            <div className="inline-flex items-center gap-2 rounded bg-warning/10 px-2 py-1">
              <span className="text-[10px] font-bold italic text-warning">
                score:
              </span>
              <Input
                size="sm"
                className="w-20 border-0 bg-transparent p-0 text-xs font-bold text-warning focus:ring-0"
                value={entry.score}
                onChange={(event) =>
                  onChange(index, "score", event.target.value)
                }
              />
            </div>
          </td>
          <td className="px-2 py-2 text-center">
            <button
              className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger/10"
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove member"
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
            Add member
          </button>
        </td>
      </tr>
    </>
  );
}
