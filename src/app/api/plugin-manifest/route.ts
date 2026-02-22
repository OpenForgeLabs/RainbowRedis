import { NextResponse } from "next/server";
import type { PluginManifest } from "@openforgelabs/rainbow-contracts";

const manifest: PluginManifest = {
  id: "redis",
  name: "Redis",
  description: "Explore Redis keys, values, and server metrics.",
  connections: {
    listEndpoint: "api/connections/redis",
    createEndpoint: "api/connections/redis",
    testEndpoint: "api/connections/redis/test",
    provider: "shell",
    pluginTestEndpoint: "api/redis/connections/test",
    summaryEndpoint: "api/redis/connections/{connectionName}/summary",
    routeTemplate: "/{connectionName}/keys",
    schema: {
      title: "Add Redis Connection",
      description:
        "Add a Redis connection using a connection string or host credentials.",
      fields: [
        {
          id: "name",
          label: "Display Name",
          type: "text",
          placeholder: "e.g. Production Redis Cache",
          required: true,
        },
        {
          id: "connectionString",
          label: "Connection String",
          type: "textarea",
          placeholder: "localhost:6379,password=...,ssl=False,defaultDatabase=0",
        },
        {
          id: "host",
          label: "Host",
          type: "text",
          placeholder: "localhost",
        },
        {
          id: "port",
          label: "Port",
          type: "number",
          defaultValue: 6379,
        },
        {
          id: "password",
          label: "Password",
          type: "password",
          placeholder: "optional",
        },
        {
          id: "useTls",
          label: "Use TLS (SSL)",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "database",
          label: "Database",
          type: "number",
          placeholder: "0",
        },
        {
          id: "environment",
          label: "Environment",
          type: "select",
          defaultValue: "development",
          options: [
            { label: "development", value: "development" },
            { label: "staging", value: "staging" },
            { label: "production", value: "production" },
          ],
        },
      ],
    },
  },
  views: [
    {
      id: "overview",
      title: "Overview",
      route: "/{connectionName}",
      icon: "insights",
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
