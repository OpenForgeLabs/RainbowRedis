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
    <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border-strong/50 bg-surface-2 p-4 shadow-[var(--rx-shadow-xs)] lg:h-full lg:w-64">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-subtle">
          Redis Instance
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-success"></span>
          <span className="truncate">{connectionName}</span>
        </div>
      </div>
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2">
        {dbOptions.map((dbOption) => {
          const count = dbCounts[dbOption];
          const isLoading = dbCountsLoading?.has(dbOption);
          const isActive = db === dbOption;
          return (
            <button
              key={dbOption}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                isActive
                  ? "border border-primary/40 bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              }`}
              type="button"
              onClick={() => onSelectDb(dbOption)}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  database
                </span>
                DB {dbOption}
              </div>
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono">
                {isLoading ? "..." : count ?? "-"}
              </span>
            </button>
          );
        })}
      </div>
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 py-2 text-xs font-bold text-danger transition-all hover:bg-danger hover:text-danger-foreground"
        type="button"
        onClick={onFlushDb}
      >
        <span className="material-symbols-outlined text-[18px]">
          delete_forever
        </span>
        Flush DB {db === "" ? 0 : db}
      </button>
    </aside>
  );
}
