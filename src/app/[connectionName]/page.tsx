import { RedisOverviewScreen } from "@/features/redis/overview/RedisOverviewScreen";

export default async function RedisOverviewPage({
  params,
}: {
  params: Promise<{ connectionName: string }>;
}) {
  const { connectionName } = await params;
  return <RedisOverviewScreen connectionName={connectionName} />;
}
