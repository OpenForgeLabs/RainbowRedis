"use client";

import { Input, Select } from "@openforgelabs/rainbow-ui";
import { RedisKeyType } from "@/lib/types";

type RedisKeyHeaderProps = {
  selectedKey: string | null;
  selectedType: RedisKeyType;
  nameDraft: string;
  isRenaming: boolean;
  isSaving: boolean;
  canSave: boolean;
  ttlValue: string;
  ttlError?: string | null;
  saveError?: string | null;
  isLocalKey: boolean;
  onRenameToggle: () => void;
  onNameChange: (value: string) => void;
  onTtlChange: (value: string) => void;
  onRenameConfirm: () => void;
  onRefreshValue: () => void;
  onSave: () => void;
  onDelete: () => void;
  onTypeChange: (type: RedisKeyType) => void;
};

export function RedisKeyHeader({
  selectedKey,
  selectedType,
  nameDraft,
  isRenaming,
  isSaving,
  canSave,
  ttlValue,
  ttlError,
  saveError,
  isLocalKey,
  onRenameToggle,
  onNameChange,
  onTtlChange,
  onRenameConfirm,
  onRefreshValue,
  onSave,
  onDelete,
  onTypeChange,
}: RedisKeyHeaderProps) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2">
          <div className="group flex min-w-0 max-w-[50%] items-center gap-2">
            <div className="min-w-0 overflow-hidden">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <Input
                    className="min-w-[200px] rounded-md bg-background py-1.5 text-sm font-semibold text-foreground"
                    value={nameDraft}
                    onChange={(event) => onNameChange(event.target.value)}
                  />
                  <button
                    className="rounded-md border border-transparent bg-success px-2 py-1.5 text-success-foreground shadow-[var(--rx-shadow-xs)] transition hover:bg-success-hover"
                    type="button"
                    aria-label="Confirm rename"
                    onClick={onRenameConfirm}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                  </button>
                </div>
              ) : (
                <h3 className="truncate text-base font-bold leading-tight text-foreground">
                  {selectedKey ?? "Select a key"}
                </h3>
              )}
            </div>
            {isLocalKey && (
              <Select
                className="rounded-md bg-background px-2 py-0.5 text-[10px] uppercase text-foreground"
                value={selectedType ?? "string"}
                onChange={(event) =>
                  onTypeChange(event.target.value as RedisKeyType)
                }
              >
                <option value="string">string</option>
                <option value="hash">hash</option>
                <option value="list">list</option>
                <option value="set">set</option>
                <option value="zset">zset</option>
                <option value="stream">stream</option>
              </Select>
            )}
            {!isRenaming && (
              <button
                className="rounded p-1 text-subtle opacity-0 transition-opacity group-hover:opacity-100"
                type="button"
                aria-label="Rename key"
                onClick={onRenameToggle}
              >
                <span className="material-symbols-outlined text-[18px]">
                  edit
                </span>
              </button>
            )}
          </div>

          <div className="ml-auto flex flex-nowrap items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-2 text-foreground transition hover:border-border-strong hover:bg-surface-3"
              type="button"
              aria-label="Refresh value"
              onClick={onRefreshValue}
              title="Refresh"
            >
              <span className="material-symbols-outlined text-[16px]">
                refresh
              </span>
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground shadow-[var(--rx-shadow-md)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              aria-label={isSaving ? "Saving changes" : "Save changes"}
              disabled={isSaving || !canSave}
              onClick={onSave}
              title={isSaving ? "Saving" : "Save changes"}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSaving ? "hourglass_top" : "save"}
              </span>
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-danger text-danger-foreground shadow-[var(--rx-shadow-sm)] transition-colors hover:bg-danger-hover"
              type="button"
              aria-label="Delete key"
              onClick={onDelete}
              title="Delete"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
            </button>
            <div className="flex h-8 items-center gap-2 rounded-lg border border-border-strong/40 bg-surface-2 px-2 text-[10px] text-muted-foreground">
              <span className="material-symbols-outlined text-[16px] text-warning">
                timer
              </span>
              <span className="uppercase tracking-widest text-muted-foreground">
                TTL
              </span>
              <Input
                size="sm"
                className="!h-6 !w-12 bg-background px-1 text-center text-[10px] font-mono text-foreground"
                type="text"
                value={ttlValue}
                onChange={(event) => onTtlChange(event.target.value)}
                placeholder="-"
              />
            </div>
          </div>
        </div>

        {saveError && (
          <p className="text-right text-[11px] text-danger">{saveError}</p>
        )}

        {ttlError && (
          <p className="text-right text-[11px] text-danger">{ttlError}</p>
        )}
      </div>
    </div>
  );
}
