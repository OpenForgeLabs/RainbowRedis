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
      <td className="px-6 py-4" colSpan={3}>
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Ordered Items</span>
            <span className="font-mono">{rows.length} items</span>
          </div>
          <div className="flex flex-col gap-2">
            {rows.length === 0 && (
              <p className="text-xs text-subtle">No list items available.</p>
            )}
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="group flex items-center gap-3 rounded-md border border-border/70 bg-surface/40 px-3 py-2"
              >
                <span className="text-xs text-subtle">{index}</span>
                <Input
                  className="flex-1 border-0 bg-transparent p-0 font-mono text-xs text-foreground focus:ring-0"
                  value={row.value}
                  onChange={(event) => onChange(index, event.target.value)}
                />
                <button
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  type="button"
                  onClick={() => onRemove(index)}
                >
                  <span className="material-symbols-outlined text-[16px] text-subtle hover:text-danger">
                    delete
                  </span>
                </button>
              </div>
            ))}
            <button
              className="mt-2 flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-foreground transition hover:border-primary/70 hover:bg-primary/20"
              type="button"
              onClick={onAdd}
            >
              <span className="material-symbols-outlined text-[16px]">
                add_circle
              </span>
              Add new item
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
