"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { deleteRedisKey, expireRedisKey, flushRedisDatabase, renameRedisKey, updateRedisKeyValue } from "@/features/redis/keys/services/redisKeyValueService";
import { RedisKeyInfo, RedisKeyType } from "@/lib/types";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";
import { useToast } from "@openforgelabs/rainbow-ui";

type UseRedisKeyActionsParams = {
  connectionName: string;
  db: number | "";
  selectedKey: string | null;
  selectedInfo?: RedisKeyInfo;
  editorRef: RefObject<RedisValueEditorHandle | null>;
  onSelectKey: (key: string | null) => void;
  onRefreshKeys: () => void;
  onRefreshKeyValue: (key: string, type: RedisKeyType, db?: number) => void;
  onRefreshKeyInfo: (key: string, db?: number) => void;
  onRefreshKeyData: (key: string, db?: number) => Promise<void>;
};

type UseRedisKeyActionsResult = {
  isSaving: boolean;
  isRenaming: boolean;
  nameDraft: string;
  ttlDraft: string;
  hasEditorErrors: boolean;
  saveError: string | null;
  ttlError: string | null;
  localKeys: string[];
  localKeyInfo: Record<string, { type: RedisKeyType; ttlSeconds?: number | null }>;
  setIsRenaming: (value: boolean) => void;
  setNameDraft: (value: string) => void;
  setTtlDraft: (value: string) => void;
  handleAddKey: (name: string, type: RedisKeyType) => void;
  handleNewKeyTypeChange: (nextType: RedisKeyType) => void;
  handleRenameConfirm: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleDeleteKey: (confirmName: string) => Promise<void>;
  handleFlushDb: (dbIndex: number, confirmName: string) => Promise<void>;
};

export function useRedisKeyActions({
  connectionName,
  db,
  selectedKey,
  selectedInfo,
  editorRef,
  onSelectKey,
  onRefreshKeys,
  onRefreshKeyValue,
  onRefreshKeyInfo,
  onRefreshKeyData,
}: UseRedisKeyActionsParams): UseRedisKeyActionsResult {
  const { pushToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [ttlDraft, setTtlDraft] = useState("");
  const [hasEditorErrors, setHasEditorErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ttlError, setTtlError] = useState<string | null>(null);
  const [localKeys, setLocalKeys] = useState<string[]>([]);
  const [localKeyInfo, setLocalKeyInfo] = useState<
    Record<string, { type: RedisKeyType; ttlSeconds?: number | null }>
  >({});

  useEffect(() => {
    if (!selectedKey) {
      setNameDraft("");
      setTtlDraft("");
      setIsRenaming(false);
      setHasEditorErrors(false);
      setSaveError(null);
      setTtlError(null);
      return;
    }
    setNameDraft(selectedKey);
    if (selectedInfo?.ttlSeconds !== undefined && selectedInfo?.ttlSeconds !== null) {
      setTtlDraft(String(selectedInfo.ttlSeconds));
    } else {
      setTtlDraft("");
    }
    setIsRenaming(false);
    setSaveError(null);
    setTtlError(null);
  }, [selectedKey, selectedInfo?.ttlSeconds]);

  useEffect(() => {
    setLocalKeys([]);
    setLocalKeyInfo({});
  }, [connectionName, db]);

  useEffect(() => {
    if (!editorRef.current?.hasErrors) {
      setHasEditorErrors(false);
      return;
    }
    const interval = setInterval(() => {
      setHasEditorErrors(Boolean(editorRef.current?.hasErrors?.()));
    }, 200);
    return () => clearInterval(interval);
  }, [editorRef, selectedKey]);

  useEffect(() => {
    if (!selectedKey) {
      return;
    }
    if (!localKeyInfo[selectedKey] && selectedInfo) {
      return;
    }
    if (!localKeyInfo[selectedKey] && !selectedInfo) {
      setLocalKeyInfo((previous) => ({
        ...previous,
        [selectedKey]: { type: "string", ttlSeconds: null },
      }));
    }
  }, [selectedKey, localKeyInfo, selectedInfo]);

  const handleAddKey = (name: string, type: RedisKeyType) => {
    const newKey = name.trim();
    if (!newKey) {
      return;
    }
    setLocalKeys((previous) => [newKey, ...previous]);
    setLocalKeyInfo((previous) => ({
      ...previous,
      [newKey]: { type, ttlSeconds: null },
    }));
    onSelectKey(newKey);
    setNameDraft(newKey);
    setIsRenaming(false);
  };

  const handleNewKeyTypeChange = (nextType: RedisKeyType) => {
    if (!selectedKey) {
      return;
    }
    setLocalKeyInfo((previous) => ({
      ...previous,
      [selectedKey]: { ...previous[selectedKey], type: nextType },
    }));
  };

  const handleRenameConfirm = async () => {
    if (!selectedKey) {
      return;
    }
    const targetKey = nameDraft.trim();
    if (!targetKey || targetKey === selectedKey) {
      setIsRenaming(false);
      return;
    }
    setSaveError(null);
    const renameResult = await renameRedisKey(
      connectionName,
      selectedKey,
      targetKey,
      db === "" ? undefined : db,
    );
    if (!renameResult.isSuccess) {
      const message =
        renameResult.reasons?.[0] ?? renameResult.message ?? "Rename failed.";
      setSaveError(message);
      pushToast({
        title: "Rename failed",
        message,
        variant: "error",
      });
      return;
    }
    setIsRenaming(false);
    onSelectKey(targetKey);
    setNameDraft(targetKey);
    onRefreshKeys();
    pushToast({
      title: "Key renamed",
      message: `Renamed to "${targetKey}".`,
      variant: "success",
    });
  };

  const handleSave = async () => {
    if (!selectedKey) {
      return;
    }
    const selectedType =
      selectedInfo?.type ?? localKeyInfo[selectedKey]?.type;
    if (!selectedType) {
      return;
    }
    if (selectedType === "unknown" || !editorRef.current) {
      return;
    }
    const ttlText = ttlDraft.trim();
    const parsedTtl =
      ttlText === "" ? null : Number(ttlText);
    if (ttlText !== "") {
      const numericTtl = Number(ttlText);
      if (Number.isNaN(numericTtl) || numericTtl < 0) {
        setTtlError("TTL must be a positive number.");
        return;
      }
    }
    setTtlError(null);
    if (editorRef.current.hasErrors?.()) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const targetKey = selectedKey;
      const nextValue = editorRef.current.getValue();
      if (selectedType === "stream") {
        const entries = Array.isArray(nextValue) ? nextValue : [];
        if (!entries.length) {
          setSaveError("Add at least one entry to create the stream.");
          return;
        }
      }
      const expirySeconds =
        Number.isNaN(parsedTtl) || parsedTtl === null ? undefined : parsedTtl;
      const setResult = await updateRedisKeyValue(
        connectionName,
        targetKey,
        selectedType,
        nextValue,
        db === "" ? undefined : db,
        expirySeconds,
      );
      if (!setResult.isSuccess) {
        const message =
          setResult.reasons?.[0] ?? setResult.message ?? "Save failed.";
        setSaveError(message);
        pushToast({
          title: "Save failed",
          message,
          variant: "error",
        });
        return;
      }
      if (setResult.isSuccess) {
        const currentTtl =
          selectedInfo?.ttlSeconds === undefined ||
          selectedInfo?.ttlSeconds === null
            ? null
            : selectedInfo.ttlSeconds;
        if (!Number.isNaN(parsedTtl) && parsedTtl !== currentTtl) {
          const expireResult = await expireRedisKey(
            connectionName,
            targetKey,
            parsedTtl,
            db === "" ? undefined : db,
          );
          if (!expireResult.isSuccess) {
            const message =
              expireResult.reasons?.[0] ??
              expireResult.message ??
              "TTL update failed.";
            setSaveError(message);
            pushToast({
              title: "TTL update failed",
              message,
              variant: "error",
            });
            return;
          }
        }
      }
      setIsRenaming(false);
      setLocalKeys((previous) => previous.filter((key) => key !== targetKey));
      setLocalKeyInfo((previous) => {
        if (!previous[targetKey]) {
          return previous;
        }
        const next = { ...previous };
        delete next[targetKey];
        return next;
      });
      onRefreshKeys();
      await onRefreshKeyData(targetKey, db === "" ? undefined : db);
      pushToast({
        title: "Key saved",
        message: `"${targetKey}" updated successfully.`,
        variant: "success",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (confirmName: string) => {
    if (!selectedKey) {
      return;
    }
    const response = await deleteRedisKey(
      connectionName,
      selectedKey,
      confirmName,
      db === "" ? undefined : db,
    );
    if (!response.isSuccess) {
      pushToast({
        title: "Delete failed",
        message: response.message || "Failed to delete key.",
        variant: "error",
      });
      return;
    }
    onSelectKey(null);
    onRefreshKeys();
    pushToast({
      title: "Key deleted",
      message: `"${selectedKey}" was removed.`,
      variant: "success",
    });
  };

  const handleFlushDb = async (dbIndex: number, confirmName: string) => {
    if (dbIndex < 0) {
      return;
    }
    const response = await flushRedisDatabase(connectionName, dbIndex, confirmName);
    if (!response.isSuccess) {
      pushToast({
        title: "Flush failed",
        message: response.message || "Failed to flush database.",
        variant: "error",
      });
      return;
    }
    onSelectKey(null);
    onRefreshKeys();
    pushToast({
      title: "Database flushed",
      message: `DB ${dbIndex} was cleared.`,
      variant: "success",
    });
  };

  return {
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
  };
}
