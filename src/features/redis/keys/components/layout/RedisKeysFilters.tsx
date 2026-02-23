"use client";

import { InlineSpinner, SearchInput, Select } from "@openforgelabs/rainbow-ui";
import { RedisKeyType } from "@/lib/types";

type RedisKeysFiltersProps = {
  pattern: string;
  filterType: "all" | RedisKeyType;
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
};

export function RedisKeysFilters({
  pattern,
  filterType,
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
}: RedisKeysFiltersProps) {
  return (
    <div className="border-b border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-2">
            <span className="text-xs font-semibold uppercase text-subtle">
              Regex Search
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
                REGEX
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
              <button
                className="flex h-10 items-center rounded border border-transparent bg-danger px-3 text-[11px] font-bold uppercase text-danger-foreground shadow-[var(--rx-shadow-sm)] transition hover:bg-danger-hover"
                type="button"
                onClick={onFlushDb}
                title={`Flush DB ${db === "" ? 0 : db}`}
              >
                Flush
              </button>
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
            <button
              className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-[11px] font-bold uppercase text-primary-foreground shadow-[var(--rx-shadow-sm)] transition hover:bg-primary/90"
              onClick={onSearch}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                sync
              </span>
              Scan
            </button>
            <button
              className="flex items-center gap-1 rounded bg-accent px-3 py-1 text-[11px] font-bold uppercase text-accent-foreground shadow-[var(--rx-shadow-sm)] transition hover:bg-accent/90"
              type="button"
              onClick={onAddKey}
            >
              <span className="material-symbols-outlined text-[14px]">
                add
              </span>
              Add Key
            </button>
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
