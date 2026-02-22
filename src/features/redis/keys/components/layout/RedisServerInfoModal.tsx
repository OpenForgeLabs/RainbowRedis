"use client";

import { Modal } from "@openforgelabs/rainbow-ui";
import { useRedisOverview } from "@/features/redis/overview/hooks/useRedisOverview";

type RedisServerInfoModalProps = {
  open: boolean;
  connectionName: string;
  onClose: () => void;
};

export function RedisServerInfoModal({
  open,
  connectionName,
  onClose,
}: RedisServerInfoModalProps) {
  const { data, isLoading, error } = useRedisOverview(connectionName);

  return (
    <Modal
      open={open}
      title="Redis Server Info"
      description="Live stats for this Redis connection."
      footer={
        <div className="flex justify-end">
          <button
            className="rounded-md border border-action/30 bg-action/10 px-4 py-2 text-sm font-semibold text-action transition hover:border-action/60 hover:bg-action/20"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-sm text-slate-400">Loading stats...</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : (
        <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-2">
          <div className="rounded-lg border border-border-dark bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Version
            </p>
            <p className="mt-1 text-lg font-semibold">{data.version ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-border-dark bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Ops/Sec
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data.opsPerSec ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border border-border-dark bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Memory
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data.usedMemoryHuman ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border border-border-dark bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Clients
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data.connectedClients ?? "-"}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
