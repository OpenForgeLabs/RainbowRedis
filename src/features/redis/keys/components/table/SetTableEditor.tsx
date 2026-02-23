"use client";

import { Input } from "@openforgelabs/rainbow-ui";

type SetRow = { id: string; value: string };

type SetTableEditorProps = {
  rows: SetRow[];
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  hasDuplicates: boolean;
};

export function SetTableEditor({
  rows,
  onChange,
  onRemove,
  onAdd,
  hasDuplicates,
}: SetTableEditorProps) {
  return (
    <tr>
      <td className="px-4 py-3" colSpan={3}>
        <div className="rounded-lg border border-border/70 bg-surface/30 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Unique members</span>
            <span className="font-mono">{rows.length} members</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rows.length === 0 && (
              <p className="text-xs text-subtle">
                No set members available.
              </p>
            )}
            {rows.map((row, index) => {
              const isDuplicate =
                row.value &&
                rows.filter((item) => item.value === row.value).length > 1;
              return (
                <div
                  key={row.id}
                  className={`group flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
                    isDuplicate
                      ? "border-danger/50 bg-danger/10 text-danger"
                      : "border-border bg-background/50 text-foreground hover:border-accent/30"
                  }`}
                >
                  <Input
                    size="sm"
                    className="w-32 border-0 bg-transparent p-0 text-xs text-inherit focus:ring-0"
                    value={row.value}
                    onChange={(event) => onChange(index, event.target.value)}
                  />
                  <button
                    className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger/10"
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label="Remove member"
                  >
                    <span className="material-symbols-outlined text-[16px] text-subtle hover:text-danger">
                      close
                    </span>
                  </button>
                </div>
              );
            })}
            <button
              className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-subtle transition-colors hover:bg-surface-3"
              type="button"
              onClick={onAdd}
            >
              + Add member
            </button>
          </div>
          {hasDuplicates && (
            <p className="mt-2 text-[11px] text-danger">
              Set members must be unique.
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}
