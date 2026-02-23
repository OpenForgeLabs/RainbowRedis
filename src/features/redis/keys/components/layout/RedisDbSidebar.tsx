"use client";

type RedisDbSidebarProps = {
  connectionName: string;
  db: number | "";
  dbOptions: number[];
  dbCounts: Record<number, number | null | undefined>;
  dbCountsLoading?: Set<number>;
  onSelectDb: (db: number) => void;
  onFlushDb: () => void;
};

export function RedisDbSidebar({
  connectionName,
  db,
  dbOptions,
  dbCounts,
  dbCountsLoading,
  onSelectDb,
  onFlushDb,
}: RedisDbSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-surface-2">
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-2">
        {dbOptions.map((dbOption) => {
          const count = dbCounts[dbOption];
          const isLoading = dbCountsLoading?.has(dbOption);
          const isActive = db === dbOption;
          return (
            <button
              key={dbOption}
              className={`group relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[10px] transition-all ${
                isActive
                  ? "border border-primary/40 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              }`}
              type="button"
              onClick={() => onSelectDb(dbOption)}
              title={`DB ${dbOption}`}
            >
              <span className="text-[11px] font-bold">{dbOption}</span>
              <span className="font-mono text-[9px] opacity-70">
                {isLoading ? "..." : count ?? "-"}
              </span>
              <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded border border-border bg-surface px-2 py-1 text-[10px] text-foreground group-hover:block">
                DB {dbOption} · {isLoading ? "loading" : count ?? 0} keys
              </span>
            </button>
          );
        })}
      </div>
      <button
        className="mx-auto mb-2 mt-1 flex h-9 w-9 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 text-danger transition-all hover:bg-danger hover:text-danger-foreground"
        type="button"
        onClick={onFlushDb}
        title={`Flush DB ${db === "" ? 0 : db} (${connectionName})`}
        aria-label={`Flush DB ${db === "" ? 0 : db}`}
      >
        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
      </button>
    </aside>
  );
}
