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
      onClose={onClose}
      title="Redis Server Info"
      description="Live stats for this Redis connection."
      footer={
        <div className="flex justify-end">
          <button
            className="rounded-md border border-border-subtle bg-control/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-control/80"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stats...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="grid gap-3 text-sm text-foreground md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-subtle">
              Version
            </p>
            <p className="mt-1 text-lg font-semibold">{data.version ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-subtle">
              Ops/Sec
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data.opsPerSec ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-subtle">
              Memory
            </p>
            <p className="mt-1 text-lg font-semibold">
              {data.usedMemoryHuman ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-subtle">
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
