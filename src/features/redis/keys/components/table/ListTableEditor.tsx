"use client";

import { Input } from "@openforgelabs/rainbow-ui";

type ListRow = { id: string; value: string };

type ListTableEditorProps = {
  rows: ListRow[];
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
};

export function ListTableEditor({
  rows,
  onChange,
  onRemove,
  onAdd,
}: ListTableEditorProps) {
  return (
    <tr>
      <td className="px-4 py-3" colSpan={3}>
        <div className="rounded-lg border border-border/70 bg-surface/30 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Ordered items</span>
            <span className="font-mono">{rows.length} items</span>
          </div>
          <div className="flex flex-col gap-1">
            {rows.length === 0 && (
              <p className="text-xs text-subtle">No list items available.</p>
            )}
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="group flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-2 transition-colors hover:border-accent/30"
              >
                <span className="w-6 select-none text-right font-mono text-[10px] text-subtle">
                  {index}
                </span>
                <Input
                  size="sm"
                  className="flex-1 border-0 bg-transparent p-0 font-mono text-sm text-foreground focus:ring-0"
                  value={row.value}
                  onChange={(event) => onChange(index, event.target.value)}
                />
                <button
                  className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger/10"
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label="Remove item"
                >
                  <span className="material-symbols-outlined text-[16px] text-subtle hover:text-danger">
                    close
                  </span>
                </button>
              </div>
            ))}
            <button
              className="mt-3 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-subtle transition-colors hover:bg-surface-3"
              type="button"
              onClick={onAdd}
            >
              + Add item to list
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
