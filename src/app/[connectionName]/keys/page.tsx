import { RedisKeysScreen } from "@/features/redis/keys/RedisKeysScreen";

export default async function RedisKeysPage({
  params,
}: {
  params: Promise<{ connectionName: string }>;
}) {
  const { connectionName } = await params;
  return <RedisKeysScreen connectionName={connectionName} />;
}
