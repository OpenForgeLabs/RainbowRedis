import { useEffect, useMemo, useState } from "react";
import { Input, Modal, Select } from "@openforgelabs/rainbow-ui";
import { RedisKeyType } from "@/lib/types";

type AddKeyModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (name: string, type: RedisKeyType) => void;
  defaultType?: RedisKeyType;
};

const KEY_TYPES: RedisKeyType[] = [
  "string",
  "hash",
  "list",
  "set",
  "zset",
  "stream",
];

export function AddKeyModal({
  open,
  onCancel,
  onConfirm,
  defaultType,
}: AddKeyModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<RedisKeyType>("string");

  const trimmedName = useMemo(() => name.trim(), [name]);
  const canSubmit = trimmedName.length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setType(defaultType ?? "string");
  }, [open, defaultType]);

  const handleConfirm = () => {
    if (!canSubmit) {
      return;
    }
    onConfirm(trimmedName, type);
    setName("");
    setType(defaultType ?? "string");
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Add key"
      description="Create a new Redis key and choose its type."
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="rounded-md border border-border-subtle bg-control/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-control/80"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-[var(--rx-shadow-md)] transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            Create
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-foreground">
          Key name
          <Input
            className="rounded-md bg-background text-foreground focus:ring-2 focus:ring-[color:rgb(var(--rx-color-ring)/0.4)]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. cache:product:1"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          Key type
          <Select
            className="rounded-md bg-background text-foreground"
            value={type}
            onChange={(event) => setType(event.target.value as RedisKeyType)}
          >
            {KEY_TYPES.map((keyType) => (
              <option key={keyType} value={keyType}>
                {keyType}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </Modal>
  );
}
