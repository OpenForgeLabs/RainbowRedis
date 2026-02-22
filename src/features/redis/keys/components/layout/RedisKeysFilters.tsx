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
    <div className="border-b border-border-dark p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Regex Search
            </span>
            <div className="flex items-center gap-2">
              <SearchInput
                className="h-10 font-mono text-slate-200"
                placeholder="Search keys..."
                value={pattern}
                onChange={(event) => onPatternChange(event.target.value)}
              />
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                REGEX
              </span>
            </div>
          </label>
          <div className="flex min-w-[160px] flex-col gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Database
            </span>
            <div className="flex items-center gap-2">
              <Select
                className="h-10 w-full text-sm text-slate-200"
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
                className="flex h-10 items-center rounded border border-danger/40 bg-danger/10 px-3 text-[11px] font-bold uppercase text-danger transition hover:border-danger/70 hover:bg-danger/20"
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
                    ? "border border-action/40 bg-gradient-to-r from-action to-action-strong text-white"
                    : "border border-border-dark/70 bg-background text-slate-400 hover:border-action/50 hover:text-white"
                }`}
                type="button"
                onClick={() => onFilterChange(type)}
              >
                <span className="mr-2">{type}</span>
                <span className="rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {typeCounts[type] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded bg-gradient-to-r from-action to-action-strong px-3 py-1 text-[11px] font-bold uppercase text-white shadow-[0_8px_16px_rgba(15,23,42,0.35)]"
              onClick={onSearch}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                sync
              </span>
              Scan
            </button>
            <button
              className="flex items-center gap-1 rounded bg-gradient-to-r from-navigate to-navigate-strong px-3 py-1 text-[11px] font-bold uppercase text-white shadow-[0_8px_16px_rgba(15,23,42,0.35)]"
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
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <InlineSpinner className="size-3 border-slate-300" />
          Loading keys...
        </div>
      )}
    </div>
  );
}
