import { useCallback, useEffect, useRef, useState } from "react";
import { useAsyncAction } from "@/lib/async/useAsyncAction";
import {
  ApiResponse,
  RedisKeyInfo,
  RedisKeyScanResult,
  RedisKeyScanResultWithInfo,
  RedisKeyType,
  RedisKeyValue,
} from "@/lib/types";
import { fetchRedisKeys, RedisKeysQuery } from "@/features/redis/keys/services/redisKeysService";
import { fetchRedisKeyInfo } from "@/features/redis/keys/services/redisKeyInfoService";
import { fetchRedisKeyValue } from "@/features/redis/keys/services/redisKeyValueService";

type RedisKeysState = {
  data: RedisKeyScanResult;
  error?: string;
};

const DEFAULT_RESULT: RedisKeyScanResult = { keys: [], cursor: 0 };

export function useRedisKeys(connectionName: string) {
  const [state, setState] = useState<RedisKeysState>({ data: DEFAULT_RESULT });
  const [params, setParams] = useState<Omit<RedisKeysQuery, "connectionName">>({
    pageSize: 100,
    cursor: 0,
  });
  const paramsRef = useRef(params);
  const [cursorHistory, setCursorHistory] = useState<number[]>([]);
  const [keyInfoMap, setKeyInfoMap] = useState<Record<string, RedisKeyInfo>>(
    {},
  );
  const keyInfoMapRef = useRef(keyInfoMap);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    keyInfoMapRef.current = keyInfoMap;
  }, [keyInfoMap]);
  const [valueMap, setValueMap] = useState<Record<string, RedisKeyValue>>({});
  const valueMapRef = useRef(valueMap);
  useEffect(() => {
    valueMapRef.current = valueMap;
  }, [valueMap]);

  const { run, isLoading, error } = useAsyncAction(fetchRedisKeys, {
    label: "Loading Redis keys",
  });

  const loadKeys = useCallback(
    async (
      next?: Partial<Omit<RedisKeysQuery, "connectionName">>,
      resetHistory = false,
    ) => {
      const merged = { ...paramsRef.current, ...next };
      setParams(merged);
      if (resetHistory) {
        setCursorHistory([]);
      }
      try {
        const response = await run({ connectionName, ...merged }) as ApiResponse<RedisKeyScanResultWithInfo>;
        if (!response.isSuccess) {
          setState({
            data: DEFAULT_RESULT,
            error: response.message || "Unable to load keys",
          });
          return;
        }
        const enriched = response.data ?? { keys: [], cursor: 0 };
        setKeyInfoMap((previous) => {
          const nextMap = { ...previous };
          enriched.keys.forEach((info) => {
            nextMap[info.key] = info;
          });
          return nextMap;
        });
        setState({
          data: {
            keys: enriched.keys.map((info) => info.key),
            cursor: enriched.cursor,
          },
          error: undefined,
        });
      } catch {
        setState({ data: DEFAULT_RESULT, error: "Unable to load keys" });
      }
    },
    [connectionName, run],
  );

  const loadKeysRef = useRef(loadKeys);
  useEffect(() => {
    loadKeysRef.current = loadKeys;
  }, [loadKeys]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadKeysRef.current(undefined, true);
    }, 0);
    return () => clearTimeout(timeout);
  }, [connectionName]);

  const loadKeyInfos = useCallback(
    async (keys: string[], db?: number) => {
      const missingKeys = keys.filter(
        (key) => !keyInfoMapRef.current[key],
      );
      if (!missingKeys.length) {
        return;
      }
      const results = await Promise.all(
        missingKeys.map((key) => fetchRedisKeyInfo(connectionName, key, db)),
      );
      setKeyInfoMap((previous) => {
        const nextMap = { ...previous };
        results.forEach((result, index) => {
          if (result.isSuccess && result.data) {
            nextMap[missingKeys[index]] = result.data;
          }
        });
        return nextMap;
      });
    },
    [connectionName],
  );

  useEffect(() => {
    if (!state.data.keys.length) {
      return;
    }
    const timeout = setTimeout(() => {
      void loadKeyInfos(state.data.keys, params.db);
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadKeyInfos, params.db, state.data.keys]);

  const loadKeyValue = useCallback(
    async (key: string, type: RedisKeyType, db?: number, force = false) => {
      if (
        !force &&
        valueMapRef.current[key] &&
        valueMapRef.current[key].type === type
      ) {
        return;
      }
      const response = await fetchRedisKeyValue(connectionName, key, type, db);
      if (response.isSuccess && response.data) {
        setValueMap((previous) => ({ ...previous, [key]: response.data }));
      }
    },
    [connectionName],
  );

  const refreshKeyValue = useCallback(
    async (key: string, type: RedisKeyType, db?: number) => {
      await loadKeyValue(key, type, db, true);
    },
    [loadKeyValue],
  );

  const refreshKeyInfo = useCallback(
    async (key: string, db?: number) => {
      const result = await fetchRedisKeyInfo(connectionName, key, db);
      if (result.isSuccess && result.data) {
        setKeyInfoMap((previous) => ({
          ...previous,
          [key]: result.data,
        }));
        return result.data;
      }
      return undefined;
    },
    [connectionName],
  );

  const refreshKeyData = useCallback(
    async (key: string, db?: number) => {
      const info = await refreshKeyInfo(key, db);
      const nextType = info?.type;
      if (!nextType) {
        return;
      }
      await loadKeyValue(key, nextType, db, true);
    },
    [loadKeyValue, refreshKeyInfo],
  );

  const nextPage = async () => {
    if (!state.data.cursor) {
      return;
    }
    setCursorHistory((previous) => [...previous, params.cursor ?? 0]);
    await loadKeys({ cursor: state.data.cursor });
  };

  const previousPage = async () => {
    if (!cursorHistory.length) {
      return;
    }
    const previousCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((previous) => previous.slice(0, -1));
    await loadKeys({ cursor: previousCursor });
  };

  const hasNextPage = state.data.cursor !== 0;
  const hasPreviousPage = cursorHistory.length > 0;

  return {
    data: state.data,
    error: state.error ?? error,
    isLoading,
    params,
    loadKeys,
    loadKeyValue,
    refreshKeyValue,
    refreshKeyInfo,
    refreshKeyData,
    keyInfoMap,
    valueMap,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  };
}
