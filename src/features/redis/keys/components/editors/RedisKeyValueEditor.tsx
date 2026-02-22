"use client";

import { forwardRef } from "react";
import { RedisKeyType, RedisStreamEntry, RedisZSetEntry } from "@/lib/types";
import { HashValueEditor } from "@/features/redis/keys/components/editors/HashValueEditor";
import { ListValueEditor } from "@/features/redis/keys/components/editors/ListValueEditor";
import { SetValueEditor } from "@/features/redis/keys/components/editors/SetValueEditor";
import { StreamValueEditor } from "@/features/redis/keys/components/editors/StreamValueEditor";
import { StringValueEditor } from "@/features/redis/keys/components/editors/StringValueEditor";
import { ZsetValueEditor } from "@/features/redis/keys/components/editors/ZsetValueEditor";
import { RedisValueEditorHandle } from "@/features/redis/keys/components/editors/RedisValueEditorTypes";

type RedisKeyValueEditorProps = {
  type: RedisKeyType;
  value: unknown;
};

export const RedisKeyValueEditor = forwardRef<
  RedisValueEditorHandle,
  RedisKeyValueEditorProps
>(({ type, value }, ref) => {
  if (type === "hash") {
    return (
      <HashValueEditor
        ref={ref}
        value={(value as Record<string, string>) ?? {}}
      />
    );
  }

  if (type === "list") {
    return (
      <ListValueEditor ref={ref} value={(value as string[]) ?? []} />
    );
  }

  if (type === "set") {
    return <SetValueEditor ref={ref} value={(value as string[]) ?? []} />;
  }

  if (type === "zset") {
    return (
      <ZsetValueEditor
        ref={ref}
        value={(value as RedisZSetEntry[]) ?? []}
      />
    );
  }

  if (type === "stream") {
    return (
      <StreamValueEditor
        ref={ref}
        value={(value as RedisStreamEntry[]) ?? []}
      />
    );
  }

  return <StringValueEditor ref={ref} value={value} />;
});

RedisKeyValueEditor.displayName = "RedisKeyValueEditor";
