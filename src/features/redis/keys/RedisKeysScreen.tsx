"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AsyncGate, Button, ConfirmActionModal } from "@openforgelabs/rainbow-ui";
import { RedisKeyValueEditor } from "@/features/redis/keys/components/editors/RedisKeyValueEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { AddKeyModal } from "@/features/redis/keys/components/layout/AddKeyModal";
import { RedisServerInfoModal } from "@/features/redis/keys/components/layout/RedisServerInfoModal";
import { RedisKeysFooter } from "@/features/redis/keys/components/layout/RedisKeysFooter";
import { RedisKeyHeader } from "@/features/redis/keys/components/layout/RedisKeyHeader";
import { RedisDbSidebar } from "@/features/redis/keys/components/layout/RedisDbSidebar";
import { RedisKeysList } from "@/features/redis/keys/components/layout/RedisKeysList";
import { useRedisKeyActions } from "@/features/redis/keys/hooks/useRedisKeyActions";
import { useRedisKeys } from "@/features/redis/keys/hooks/useRedisKeys";
import { fetchRedisDbSize } from "@/features/redis/keys/services/redisDbSizeService";
import { RedisKeyType } from "@/lib/types";

const DB_OPTIONS = Array.from({ length: 16 }, (_, idx) => idx);
const TYPE_FILTERS: Array<"all" | RedisKeyType> = [
  "all",
  "string",
  "hash",
  "list",
  "set",
  "zset",
  "stream",
];
const MAX_OPEN_TABS = 5;

const TYPE_BADGE_STYLES: Record<string, string> = {
  string: "bg-viz-1/10 text-viz-1 border-viz-1/30",
  hash: "bg-viz-2/10 text-viz-2 border-viz-2/30",
  list: "bg-viz-3/10 text-viz-3 border-viz-3/30",
  set: "bg-viz-4/10 text-viz-4 border-viz-4/30",
  zset: "bg-viz-5/10 text-viz-5 border-viz-5/30",
  stream: "bg-viz-6/10 text-viz-6 border-viz-6/30",
  unknown: "bg-control/40 text-muted-foreground border-border",
};

type RedisKeysScreenProps = {
  connectionName: string;
};

type KeySearchMode = "pattern" | "pattern_exhaustive" | "exact";

export function RedisKeysScreen({ connectionName }: RedisKeysScreenProps) {
  const [pattern, setPattern] = useState("");
  const [patternDraft, setPatternDraft] = useState("");
  const [exactKey, setExactKey] = useState("");
  const [exactKeyDraft, setExactKeyDraft] = useState("");
  const [searchMode, setSearchMode] = useState<KeySearchMode>("pattern");
  const [db, setDb] = useState<number | "">(0);
  const [filterType, setFilterType] = useState<"all" | RedisKeyType>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [dbCounts, setDbCounts] = useState<
    Record<number, number | null | undefined>
  >({});
  const [dbCountsLoading, setDbCountsLoading] = useState<Set<number>>(
    () => new Set(),
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [flushModalOpen, setFlushModalOpen] = useState(false);
  const [serverInfoOpen, setServerInfoOpen] = useState(false);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [listPanelWidth, setListPanelWidth] = useState(380);
  const editorRef = useRef<RedisValueEditorHandle>(null);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const ensureTabWithLimit = useCallback((tabs: string[], key: string) => {
    if (tabs.includes(key)) {
      return tabs;
    }
    const nextTabs = [...tabs, key];
    if (nextTabs.length <= MAX_OPEN_TABS) {
      return nextTabs;
    }
    return nextTabs.slice(nextTabs.length - MAX_OPEN_TABS);
  }, []);

  const {
    data,
    error,
    isLoading,
    loadKeys,
    keyInfoMap,
    valueMap,
    loadKeyValue,
    refreshKeyValue,
    refreshKeyInfo,
    refreshKeyData,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  } = useRedisKeys(connectionName);

  const loadKeysRef = useRef(loadKeys);
  useEffect(() => {
    loadKeysRef.current = loadKeys;
  }, [loadKeys]);
  const refreshKeys = useCallback(() => {
    const normalizedPattern = pattern.trim();
    const normalizedExactKey = exactKey.trim();
    const isExactSearch = searchMode === "exact";
    const exhaustiveSearch = searchMode === "pattern_exhaustive";
    loadKeysRef.current(
      {
        pattern: isExactSearch ? undefined : (normalizedPattern || undefined),
        exactKey: isExactSearch ? (normalizedExactKey || undefined) : undefined,
        exhaustive: !isExactSearch && exhaustiveSearch ? true : undefined,
        type:
          filterType === "all" || filterType === "unknown"
            ? undefined
            : filterType,
        db: db === "" ? undefined : db,
        cursor: 0,
      },
      true,
    );
    if (db !== "") {
      setDbCounts((previous) => ({
        ...previous,
        [db]: undefined,
      }));
    }
  }, [db, filterType, pattern, exactKey, searchMode]);

  const selectKey = useCallback((nextKey: string | null) => {
    setSelectedKey(nextKey);
    if (!nextKey) {
      return;
    }
    setOpenTabs((previous) => ensureTabWithLimit(previous, nextKey));
  }, [ensureTabWithLimit]);

  const selectedInfoFromBackend = selectedKey
    ? keyInfoMap[selectedKey]
    : undefined;

  const {
    isSaving,
    isRenaming,
    nameDraft,
    ttlDraft,
    hasEditorErrors,
    saveError,
    ttlError,
    localKeys,
    localKeyInfo,
    setIsRenaming,
    setNameDraft,
    setTtlDraft,
    handleAddKey,
    handleNewKeyTypeChange,
    handleRenameConfirm,
    handleSave,
    handleDeleteKey,
    handleFlushDb,
  } = useRedisKeyActions({
    connectionName,
    db,
    selectedKey,
    selectedInfo: selectedInfoFromBackend,
    editorRef,
    onSelectKey: selectKey,
    onRefreshKeys: refreshKeys,
    onRefreshKeyValue: refreshKeyValue,
    onRefreshKeyInfo: refreshKeyInfo,
    onRefreshKeyData: refreshKeyData,
  });

  const handleSearch = useCallback(() => {
    const normalizedPatternDraft = patternDraft.trim();
    const normalizedPatternApplied = pattern.trim();
    const normalizedExactDraft = exactKeyDraft.trim();
    const normalizedExactApplied = exactKey.trim();

    if (searchMode === "exact") {
      if (normalizedExactDraft === normalizedExactApplied) {
        refreshKeys();
        return;
      }
      setExactKey(exactKeyDraft);
      return;
    }

    if (normalizedPatternDraft === normalizedPatternApplied) {
      refreshKeys();
      return;
    }
    setPattern(patternDraft);
  }, [exactKey, exactKeyDraft, pattern, patternDraft, refreshKeys, searchMode]);

  const loadDbCount = useCallback(
    async (dbIndex: number, force = false) => {
      if (!force && dbCounts[dbIndex] !== undefined) {
        return;
      }
      setDbCountsLoading((previous) => {
        const next = new Set(previous);
        next.add(dbIndex);
        return next;
      });
      try {
        const response = await fetchRedisDbSize(connectionName, dbIndex);
        setDbCounts((previous) => ({
          ...previous,
          [dbIndex]: response.isSuccess ? response.data ?? 0 : null,
        }));
      } finally {
        setDbCountsLoading((previous) => {
          const next = new Set(previous);
          next.delete(dbIndex);
          return next;
        });
      }
    },
    [connectionName, dbCounts],
  );

  useEffect(() => {
    if (db === "") {
      return;
    }
    refreshKeys();
  }, [db, pattern, filterType, refreshKeys]);

  useEffect(() => {
    setDbCounts({});
    setDbCountsLoading(new Set());
  }, [connectionName]);

  useEffect(() => {
    if (db === "") {
      return;
    }
    if (dbCounts[db] === undefined) {
      void loadDbCount(db, true);
    }
  }, [db, dbCounts, loadDbCount]);

  const combinedKeyInfoMap = useMemo(
    () => ({ ...keyInfoMap, ...localKeyInfo }),
    [keyInfoMap, localKeyInfo],
  );

  const allKeys = useMemo(() => {
    const merged = [...localKeys, ...data.keys];
    return Array.from(new Set(merged));
  }, [localKeys, data.keys]);

  const filteredKeys = useMemo(() => {
    if (filterType === "all") {
      return allKeys;
    }
    return allKeys.filter(
      (key) => combinedKeyInfoMap[key]?.type === filterType,
    );
  }, [allKeys, filterType, combinedKeyInfoMap]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allKeys.length };
    for (const key of allKeys) {
      const type = combinedKeyInfoMap[key]?.type ?? "unknown";
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  }, [allKeys, combinedKeyInfoMap]);

  const isLocalKey = useMemo(() => {
    if (!selectedKey) {
      return false;
    }
    return localKeys.includes(selectedKey);
  }, [selectedKey, localKeys]);

  useEffect(() => {
    if (!filteredKeys.length) {
      const timeout = setTimeout(() => setSelectedKey(null), 0);
      return () => clearTimeout(timeout);
    }
    if (selectedKey && !filteredKeys.includes(selectedKey)) {
      const timeout = setTimeout(() => setSelectedKey(null), 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [filteredKeys, selectedKey]);

  useEffect(() => {
    if (!selectedKey) {
      return;
    }
    setOpenTabs((previous) => ensureTabWithLimit(previous, selectedKey));
  }, [selectedKey, ensureTabWithLimit]);

  useEffect(() => {
    if (!selectedKey) {
      return;
    }
    const info = combinedKeyInfoMap[selectedKey];
    if (!info) {
      return;
    }
    loadKeyValue(selectedKey, info.type, db === "" ? undefined : db);
  }, [selectedKey, combinedKeyInfoMap, db, loadKeyValue]);

  const selectedInfoRaw = selectedKey
    ? combinedKeyInfoMap[selectedKey]
    : undefined;
  const selectedInfo = selectedKey && selectedInfoRaw
    ? { key: selectedKey, ...selectedInfoRaw }
    : undefined;
  const selectedValue = selectedKey ? valueMap[selectedKey] : undefined;

  const resultsLabel = useMemo(() => {
    if (isLoading) return "Loading keys...";
    return `${filteredKeys.length} keys`;
  }, [filteredKeys.length, isLoading]);

  const formatTtl = (ttlSeconds?: number | null) => {
    if (ttlSeconds === null || ttlSeconds === undefined) {
      return "Persist";
    }
    return `${ttlSeconds}s`;
  };

  const formatSize = (value?: unknown) => {
    if (!value) {
      return "-";
    }
    if (typeof value === "string") {
      return `${value.length} B`;
    }
    if (Array.isArray(value)) {
      return `${value.length} items`;
    }
    if (typeof value === "object") {
      return `${Object.keys(value as Record<string, unknown>).length} fields`;
    }
    return "-";
  };

  const selectedType = selectedInfo?.type ?? "unknown";
  const visibleTabs = useMemo(
    () => openTabs.filter((tabKey) => tabKey && (combinedKeyInfoMap[tabKey] || tabKey === selectedKey)),
    [openTabs, combinedKeyInfoMap, selectedKey],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current) {
        return;
      }
      const delta = event.clientX - dragStateRef.current.startX;
      const nextWidth = dragStateRef.current.startWidth + delta;
      setListPanelWidth(Math.max(280, Math.min(600, nextWidth)));
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface/30">
      <div className="flex items-center justify-end gap-2 px-2 py-2 sm:px-3 lg:px-4">
        <Button size="sm" variant="solid" tone="primary" onClick={handleSearch} disabled={isLoading}>
          <span className="material-symbols-outlined text-[14px]">sync</span>
          {isLoading ? "Scanning" : "Scan"}
        </Button>
        <Button size="sm" variant="solid" tone="accent" onClick={() => setAddKeyOpen(true)}>
          <span className="material-symbols-outlined text-[14px]">add</span>
          New Key
        </Button>
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          onClick={() => setServerInfoOpen(true)}
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
          Server Info
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2 pb-2 sm:px-3 lg:px-4 lg:pb-4">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-strong/50 bg-surface shadow-[var(--rx-shadow-xs)]">
          <AsyncGate
            isLoading={isLoading}
            error={error}
            empty={false}
          >
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex w-14 flex-col border-r border-border bg-surface-2">
                <RedisDbSidebar
                  connectionName={connectionName}
                  db={db}
                  dbOptions={DB_OPTIONS}
                  dbCounts={dbCounts}
                  dbCountsLoading={dbCountsLoading}
                  onSelectDb={(dbOption) => {
                    setDb(dbOption);
                    void loadDbCount(dbOption);
                  }}
                  onFlushDb={() => setFlushModalOpen(true)}
                />
              </div>

              {!isListCollapsed ? (
                <div
                  className="relative flex min-h-0 flex-none flex-col border-r border-border bg-surface-2/30"
                  style={{ width: listPanelWidth }}
                >
                  <div className="border-b border-border px-3 py-2">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <input
                          className="h-8 w-full rounded-[var(--rx-radius-md)] border border-border bg-control pl-2 pr-28 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                          placeholder={searchMode === "exact" ? "Exact key name..." : "Search keys (wildcard)..."}
                          value={searchMode === "exact" ? exactKeyDraft : patternDraft}
                          onChange={(event) => {
                            if (searchMode === "exact") {
                              setExactKeyDraft(event.target.value);
                              return;
                            }
                            setPatternDraft(event.target.value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleSearch();
                            }
                          }}
                        />
                        <select
                          className="absolute right-1 top-1/2 h-5 w-24 -translate-y-1/2 rounded-[var(--rx-radius-sm)] border border-border bg-surface px-1.5 text-[9px] font-semibold uppercase tracking-wide text-foreground focus:border-ring focus:outline-none"
                          value={searchMode}
                          onChange={(event) =>
                            setSearchMode(event.target.value as KeySearchMode)
                          }
                          aria-label="Search mode"
                        >
                          <option value="pattern">Pattern</option>
                          <option value="pattern_exhaustive">Pattern (Exhaustive)</option>
                          <option value="exact">Exact key</option>
                        </select>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        tone="neutral"
                        className="h-8 px-2"
                        onClick={handleSearch}
                        disabled={isLoading}
                        title="Search"
                        aria-label="Search"
                      >
                        <span className="material-symbols-outlined text-[16px]">search</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="custom-scrollbar flex items-center gap-1 overflow-x-auto pb-1">
                        {TYPE_FILTERS.map((type) => (
                          <button
                            key={type}
                            className={`rounded px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                              filterType === type
                                ? "border border-transparent bg-primary text-primary-foreground"
                                : "border border-border/70 bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                            }`}
                            type="button"
                            onClick={() => setFilterType(type)}
                          >
                            {type}
                            <span
                              className={`ml-1 text-[9px] ${
                                filterType === type
                                  ? "text-primary-foreground/90"
                                  : "text-foreground"
                              }`}
                            >
                              {typeCounts[type] ?? 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <RedisKeysList
                    keys={filteredKeys}
                    selectedKey={selectedKey}
                    keyInfoMap={combinedKeyInfoMap}
                    selectedValue={selectedValue}
                    localKeys={localKeys}
                    resultsLabel={resultsLabel}
                    hasNextPage={hasNextPage}
                    hasPreviousPage={hasPreviousPage}
                    formatTtl={formatTtl}
                    formatSize={formatSize}
                    onSelectKey={selectKey}
                    onNextPage={nextPage}
                    onPreviousPage={previousPage}
                    typeBadgeStyles={TYPE_BADGE_STYLES}
                  />
                </div>
              ) : (
                <div className="hidden w-4 border-r border-border bg-surface-2 lg:flex" />
              )}

              <div
                className={`group relative hidden w-2 items-stretch bg-transparent lg:flex ${isListCollapsed ? "cursor-default" : "cursor-ew-resize"}`}
                onMouseDown={(event) => {
                  if (isListCollapsed) {
                    return;
                  }
                  dragStateRef.current = {
                    startX: event.clientX,
                    startWidth: listPanelWidth,
                  };
                }}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize panels"
              >
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  <span
                    role="button"
                    tabIndex={0}
                    className="ui-focus pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-md border border-border-subtle/70 bg-surface text-subtle shadow-[var(--rx-shadow-xs)] transition hover:border-border hover:bg-surface-2 hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsListCollapsed((previous) => !previous);
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setIsListCollapsed((previous) => !previous);
                      }
                    }}
                    title={isListCollapsed ? "Expand keys panel" : "Collapse keys panel"}
                    aria-label={isListCollapsed ? "Expand keys panel" : "Collapse keys panel"}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isListCollapsed ? "chevron_right" : "chevron_left"}
                    </span>
                  </span>
                </span>
                <span className="mx-auto w-0.5 bg-border/70 group-hover:bg-primary/70" />
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="flex h-10 items-center border-b border-border bg-surface-2">
                    <div className="custom-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto">
                      {visibleTabs.length ? (
                        visibleTabs.map((tabKey) => {
                          const tabType = combinedKeyInfoMap[tabKey]?.type ?? "unknown";
                          const active = tabKey === selectedKey;
                          return (
                            <div
                              key={tabKey}
                              className={`group flex h-full w-40 flex-none cursor-pointer items-center gap-2 border-r border-border px-3 ${
                                active ? "bg-surface border-t-2 border-t-primary" : "bg-surface-2"
                              }`}
                              role="button"
                              tabIndex={0}
                              onClick={() => selectKey(tabKey)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  selectKey(tabKey);
                                }
                              }}
                            >
                              <button
                                type="button"
                                className={`min-w-0 flex-1 truncate text-left text-xs font-mono ${
                                  active ? "text-foreground" : "text-muted-foreground"
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectKey(tabKey);
                                }}
                              >
                                {tabKey}
                              </button>
                              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${TYPE_BADGE_STYLES[tabType] ?? TYPE_BADGE_STYLES.unknown}`}>
                                {tabType}
                              </span>
                              <button
                                type="button"
                                className="rounded p-0.5 text-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-3 hover:text-foreground"
                                aria-label={`Close tab ${tabKey}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenTabs((previous) => previous.filter((item) => item !== tabKey));
                                  if (selectedKey === tabKey) {
                                    const remainingTabs = visibleTabs.filter((item) => item !== tabKey);
                                    selectKey(remainingTabs[remainingTabs.length - 1] ?? null);
                                  }
                                }}
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 text-xs text-muted-foreground">No key tabs open</div>
                      )}
                    </div>
                    {visibleTabs.length ? (
                      <button
                        type="button"
                        className="ui-focus mr-2 inline-flex h-7 flex-none items-center gap-1 rounded-[var(--rx-radius-sm)] border border-border-subtle/70 px-2 text-[11px] font-medium text-muted-foreground transition hover:border-border hover:bg-surface hover:text-foreground"
                        onClick={() => {
                          setOpenTabs([]);
                          setSelectedKey(null);
                        }}
                        aria-label="Close all tabs"
                        title="Close all tabs"
                      >
                        <span className="material-symbols-outlined text-[13px]">close</span>
                        Close all
                      </button>
                    ) : null}
                  </div>

                  <RedisKeyHeader
                    selectedKey={selectedKey}
                    selectedType={selectedType}
                    nameDraft={nameDraft}
                    isRenaming={isRenaming}
                    isSaving={isSaving}
                    canSave={
                      !!selectedInfo &&
                      selectedInfo.type !== "unknown" &&
                      !hasEditorErrors
                    }
                    ttlValue={ttlDraft}
                    ttlError={ttlError}
                    saveError={saveError}
                    isLocalKey={isLocalKey}
                    onRenameToggle={() => setIsRenaming(true)}
                    onRenameConfirm={handleRenameConfirm}
                    onNameChange={setNameDraft}
                    onTtlChange={setTtlDraft}
                    onRefreshValue={() => {
                      if (selectedKey && selectedInfo) {
                        refreshKeyValue(
                          selectedKey,
                          selectedInfo.type,
                          db === "" ? undefined : db,
                        );
                      }
                    }}
                    onSave={handleSave}
                    onDelete={() => setDeleteModalOpen(true)}
                    onTypeChange={handleNewKeyTypeChange}
                  />

                  <div className="flex min-h-0 flex-1 overflow-auto">
                    {selectedInfo ? (
                      <RedisKeyValueEditor
                        key={`${selectedKey ?? "key"}-${selectedType}`}
                        ref={editorRef}
                        type={selectedType}
                        value={selectedValue?.value}
                      />
                    ) : (
                      <div className="flex flex-1 items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className="material-symbols-outlined text-[28px] text-subtle">key</span>
                          <p className="text-sm text-subtle">Select a key to see its content.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <RedisKeysFooter connectionName={connectionName} />
              </div>
            </div>
          </AsyncGate>
        </main>
      </div>

      <ConfirmActionModal
        open={deleteModalOpen}
        title="Delete key"
        description={
          selectedKey
            ? `This will permanently delete the key "${selectedKey}".`
            : "This will permanently delete the selected key."
        }
        confirmLabel="Delete key"
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          if (selectedKey) {
            await handleDeleteKey(selectedKey);
          }
          setDeleteModalOpen(false);
        }}
      />

      <ConfirmActionModal
        open={flushModalOpen}
        title="Flush database"
        description="This will permanently delete all keys in the selected database."
        confirmLabel="Flush DB"
        onCancel={() => setFlushModalOpen(false)}
        onConfirm={async () => {
          const dbIndex = db === "" ? 0 : db;
          await handleFlushDb(dbIndex, String(dbIndex));
          setFlushModalOpen(false);
        }}
      />

      <RedisServerInfoModal
        open={serverInfoOpen}
        connectionName={connectionName}
        onClose={() => setServerInfoOpen(false)}
      />
      <AddKeyModal
        open={addKeyOpen}
        onCancel={() => setAddKeyOpen(false)}
        defaultType={filterType === "all" ? undefined : filterType}
        onConfirm={(name, type) => {
          handleAddKey(name, type);
          setAddKeyOpen(false);
        }}
      />
    </div>
  );
}
