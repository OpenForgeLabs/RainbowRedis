"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type AsyncTaskStatus = "pending" | "success" | "error";

export type AsyncTask = {
  id: string;
  label: string;
  startedAt: number;
  status: AsyncTaskStatus;
  error?: string;
};

type AsyncContextValue = {
  tasks: AsyncTask[];
  activeCount: number;
  startTask: (label: string) => string;
  finishTask: (id: string, error?: string) => void;
};

const AsyncContext = createContext<AsyncContextValue | null>(null);

const createId = () => `task_${Math.random().toString(36).slice(2, 10)}`;

export function AsyncProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<AsyncTask[]>([]);

  const startTask = useCallback((label: string) => {
    const id = createId();
    const task: AsyncTask = {
      id,
      label,
      startedAt: Date.now(),
      status: "pending",
    };
    setTasks((previous) => [task, ...previous]);
    return id;
  }, []);

  const finishTask = useCallback((id: string, error?: string) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) {
          return task;
        }
        return {
          ...task,
          status: error ? "error" : "success",
          error,
        };
      }),
    );
  }, []);

  const value = useMemo(() => {
    const activeCount = tasks.filter((task) => task.status === "pending").length;
    return { tasks, activeCount, startTask, finishTask };
  }, [tasks, startTask, finishTask]);

  return <AsyncContext.Provider value={value}>{children}</AsyncContext.Provider>;
}

export function useAsyncTasks() {
  const context = useContext(AsyncContext);
  return context;
}
