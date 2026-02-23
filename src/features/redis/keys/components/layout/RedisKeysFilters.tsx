"use client";

import { Button, InlineSpinner, SearchInput, Select } from "@openforgelabs/rainbow-ui";
import { RedisKeyType } from "@/lib/types";

type RedisKeysFiltersProps = {
  pattern: string;
  filterType: "all" | RedisKeyType;
  isListCollapsed: boolean;
  isLoading: boolean;
  typeFilters: Array<"all" | RedisKeyType>;
  db: number | "";
  dbOptions: number[];
  dbCounts: Record<number, number | null | undefined>;
  dbCountsLoading?: Set<number>;
  typeCounts: Record<string, number>;
  onPatternChange: (value: string) => void;
  onFilterChange: (value: "all" | RedisKeyType) => void;
  onSelectDb: (db: number) => void;
  onFlushDb: () => void;
  onSearch: () => void;
  onAddKey: () => void;
  onToggleListPanel: () => void;
};

export function RedisKeysFilters({
  pattern,
  filterType,
  isListCollapsed,
  isLoading,
  typeFilters,
  db,
  dbOptions,
  dbCounts,
  dbCountsLoading,
  typeCounts,
  onPatternChange,
  onFilterChange,
  onSelectDb,
  onFlushDb,
  onSearch,
  onAddKey,
  onToggleListPanel,
}: RedisKeysFiltersProps) {
  return (
    <div className="border-b border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Button
            className="h-10 px-2"
            size="sm"
            variant="outline"
            tone="neutral"
            onClick={onToggleListPanel}
            title={isListCollapsed ? "Expand keys panel" : "Collapse keys panel"}
            aria-label={isListCollapsed ? "Expand keys panel" : "Collapse keys panel"}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isListCollapsed ? "dock_to_right" : "dock_to_left"}
            </span>
          </Button>
          <label className="flex min-w-[220px] flex-1 flex-col gap-2">
            <span className="text-xs font-semibold uppercase text-subtle">
              Pattern Search
            </span>
            <div className="flex items-center gap-2">
              <SearchInput
                aria-label="Search keys"
                className="h-10 font-mono text-foreground"
                placeholder="Search keys..."
                value={pattern}
                onChange={(event) => onPatternChange(event.target.value)}
              />
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                WILDCARD
              </span>
            </div>
          </label>
          <div className="flex min-w-[160px] flex-col gap-2">
            <span className="text-xs font-semibold uppercase text-subtle">
              Database
            </span>
            <div className="flex items-center gap-2">
              <Select
                className="h-10 w-full text-sm text-foreground"
                value={db === "" ? 0 : db}
                onChange={(event) => onSelectDb(Number(event.target.value))}
              >
                {dbOptions.map((dbOption) => (
                  <option key={dbOption} value={dbOption}>
                    DB {dbOption}
                  </option>
                ))}
              </Select>
              <Button
                className="h-10 px-3 text-[11px] uppercase"
                variant="solid"
                tone="danger"
                size="sm"
                onClick={onFlushDb}
                title={`Flush DB ${db === "" ? 0 : db}`}
              >
                Flush
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((type) => (
              <button
                key={type}
                className={`h-7 rounded px-3 text-[11px] font-bold uppercase transition-all ${
                  filterType === type
                    ? "border border-transparent bg-primary text-primary-foreground shadow-[var(--rx-shadow-xs)]"
                    : "border border-border/70 bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
                type="button"
                onClick={() => onFilterChange(type)}
              >
                <span className="mr-2">{type}</span>
                <span className="rounded bg-surface-3/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {typeCounts[type] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              className="h-7 px-3 text-[11px] uppercase"
              size="sm"
              variant="solid"
              tone="primary"
              onClick={onSearch}
            >
              <span className="material-symbols-outlined text-[14px]">
                sync
              </span>
              Scan
            </Button>
            <Button
              className="h-7 px-3 text-[11px] uppercase"
              size="sm"
              variant="solid"
              tone="accent"
              onClick={onAddKey}
            >
              <span className="material-symbols-outlined text-[14px]">
                add
              </span>
              Add Key
            </Button>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <InlineSpinner className="size-3 border-border-subtle" />
          Loading keys...
        </div>
      )}
    </div>
  );
}
