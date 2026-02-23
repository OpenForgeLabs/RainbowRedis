"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AsyncGate, Button, ConfirmActionModal, InlineSpinner } from "@openforgelabs/rainbow-ui";
import { RedisKeyValueEditor } from "@/features/redis/keys/components/editors/RedisKeyValueEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { AddKeyModal } from "@/features/redis/keys/components/layout/AddKeyModal";
import { RedisServerInfoModal } from "@/features/redis/keys/components/layout/RedisServerInfoModal";
import { RedisKeysFooter } from "@/features/redis/keys/components/layout/RedisKeysFooter";
import { RedisKeyHeader } from "@/features/redis/keys/components/layout/RedisKeyHeader";
import { RedisKeysFilters } from "@/features/redis/keys/components/layout/RedisKeysFilters";
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

const TYPE_BADGE_STYLES: Record<string, string> = {
  string: "bg-viz-1/10 text-viz-1 border-viz-1/30",
  hash: "bg-viz-2/10 text-viz-2 border-viz-2/30",
  list: "bg-viz-3/10 text-viz-3 border-viz-3/30",
  set: "bg-viz-4/10 text-viz-4 border-viz-4/30",
  zset: "bg-viz-5/10 text-viz-5 border-viz-5/30",
  stream: "bg-viz-6/10 text-viz-6 border-viz-6/30",
  unknown: "bg-control/40 text-muted-foreground border-border",
};

const TYPE_DESCRIPTIONS: Record<RedisKeyType, string> = {
  string: "Binary-safe string values, ideal for counters or cached payloads.",
  hash: "Field-value maps that resemble objects or structured records.",
  list: "Ordered collections useful for queues and timelines.",
  set: "Unordered unique members for tags or membership tracking.",
  zset: "Sorted sets with scores for rankings and leaderboards.",
  stream: "Append-only event logs for messaging pipelines.",
  unknown: "Unsupported or custom module type.",
};

type RedisKeysScreenProps = {
  connectionName: string;
};

export function RedisKeysScreen({ connectionName }: RedisKeysScreenProps) {
  const [pattern, setPattern] = useState("");
  const [db, setDb] = useState<number | "">(0);
  const [filterType, setFilterType] = useState<"all" | RedisKeyType>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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
    loadKeysRef.current(
      {
        pattern: pattern || undefined,
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
  }, [db, pattern]);

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
    onSelectKey: setSelectedKey,
    onRefreshKeys: refreshKeys,
    onRefreshKeyValue: refreshKeyValue,
    onRefreshKeyInfo: refreshKeyInfo,
    onRefreshKeyData: refreshKeyData,
  });

  const handleSearch = () => {
    refreshKeys();
  };

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
  }, [db, pattern, refreshKeys]);

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
    const counts: Record<string, number> = { all: filteredKeys.length };
    for (const key of filteredKeys) {
      const type = combinedKeyInfoMap[key]?.type ?? "unknown";
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  }, [combinedKeyInfoMap, filteredKeys]);

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
    if (!selectedKey || !filteredKeys.includes(selectedKey)) {
      const timeout = setTimeout(() => setSelectedKey(filteredKeys[0]), 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [filteredKeys, selectedKey]);

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
    <div className="mt-3 flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface/30 pb-3 lg:pb-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2 sm:px-3 lg:px-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Redis Keys
          </h1>
          <p className="text-sm text-muted-foreground">
            Managing keys for {connectionName}.
          </p>
          <Link
            className="mt-1 inline-flex text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
            href={`/${encodeURIComponent(connectionName)}`}
          >
            View overview
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="solid"
            tone="accent"
            onClick={() => setServerInfoOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
            Server Info
          </Button>
          <Button
            variant="outline"
            tone="neutral"
            onClick={refreshKeys}
            disabled={isLoading}
          >
            {isLoading ? (
              <InlineSpinner className="size-4 border-border-subtle" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
            )}
            {isLoading ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>
      <div className="flex max-h-[calc(100dvh-90px)] min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-strong/50 bg-surface shadow-[var(--rx-shadow-xs)]">
          <RedisKeysFilters
            pattern={pattern}
            filterType={filterType}
            isLoading={isLoading}
            typeFilters={TYPE_FILTERS}
            db={db}
            dbOptions={DB_OPTIONS}
            dbCounts={dbCounts}
            dbCountsLoading={dbCountsLoading}
            typeCounts={typeCounts}
            onPatternChange={setPattern}
            onFilterChange={setFilterType}
            onSelectDb={(dbOption) => {
              setDb(dbOption);
              void loadDbCount(dbOption);
            }}
            onFlushDb={() => setFlushModalOpen(true)}
            onSearch={handleSearch}
            onAddKey={() => setAddKeyOpen(true)}
          />

          <AsyncGate
            isLoading={isLoading}
            error={error}
            empty={!isLoading && filteredKeys.length === 0}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
              <div
                className="flex min-h-0 flex-none flex-col"
                style={{ width: listPanelWidth }}
              >
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
                  onSelectKey={setSelectedKey}
                  onNextPage={nextPage}
                  onPreviousPage={previousPage}
                  typeBadgeStyles={TYPE_BADGE_STYLES}
                />
              </div>
              <button
                type="button"
                className="group hidden w-2 cursor-col-resize items-stretch bg-transparent lg:flex"
                onMouseDown={(event) => {
                  dragStateRef.current = {
                    startX: event.clientX,
                    startWidth: listPanelWidth,
                  };
                }}
                aria-label="Resize panels"
              >
                <span className="mx-auto w-0.5 bg-border/70 group-hover:bg-primary/70" />
              </button>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <RedisKeyHeader
                    selectedKey={selectedKey}
                    selectedType={selectedType}
                    selectedValue={selectedValue?.value}
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
                    typeDescription={TYPE_DESCRIPTIONS[selectedType]}
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
                      <div className="flex flex-1 items-center justify-center text-sm text-subtle">
                        Select a key to view its value.
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
