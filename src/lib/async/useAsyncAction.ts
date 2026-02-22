"use client";

import { useCallback, useState } from "react";
import { useAsyncTasks } from "@/lib/async/AsyncContext";

type AsyncActionOptions = {
  label?: string;
};

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: AsyncActionOptions,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const asyncTasks = useAsyncTasks();

  const run = useCallback(
    async (...args: TArgs) => {
      setIsLoading(true);
      setError(undefined);
      const taskId = asyncTasks?.startTask(options?.label ?? "Processing");
      try {
        const result = await action(...args);
        if (taskId) {
          asyncTasks?.finishTask(taskId);
        }
        setIsLoading(false);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (taskId) {
          asyncTasks?.finishTask(taskId, message);
        }
        setError(message);
        setIsLoading(false);
        throw err;
      }
    },
    [action, asyncTasks, options?.label],
  );

  return { run, isLoading, error };
}
