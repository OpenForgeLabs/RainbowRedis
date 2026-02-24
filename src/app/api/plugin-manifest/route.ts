import { NextResponse } from "next/server";
import type { PluginManifest } from "@openforgelabs/rainbow-contracts";

const manifest: PluginManifest = {
  id: "redis",
  name: "Redis",
  description: "Explore Redis keys, values, and server metrics.",
  connections: {
    summaryEndpoint: "api/redis/connections/{connectionName}/summary",
    openConnectionPath: "/{connectionName}/keys",
    schema: {
      title: "Add Redis Connection",
      description: "Add a Redis connection using a connection string.",
      fields: [
        {
          id: "connectionString",
          label: "Connection String",
          type: "textarea",
          placeholder: "localhost:6379,password=...,ssl=False,defaultDatabase=0",
          required: true,
        },
      ],
    },
  },
  views: [
    {
      id: "overview",
      title: "Overview",
      route: "/{connectionName}",
      icon: "database",
      type: "iframe",
    },
    {
      id: "keys",
      title: "Keys Browser",
      route: "/{connectionName}/keys",
      icon: "key",
      type: "iframe",
    },
  ],
};

export async function GET() {
  return NextResponse.json(manifest);
}
