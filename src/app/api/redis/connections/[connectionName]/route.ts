import { NextRequest, NextResponse } from "next/server";
import { resolveConnection } from "@/infrastructure/redis/redisClient";
import {
  ApiResponse,
  RedisConnectionUpsertRequest,
} from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string }> },
) {
  const { connectionName } = await params;
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";

  if (useMocks) {
    const mock: ApiResponse<RedisConnectionUpsertRequest> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: {
        name: connectionName,
        connectionString: "",
        host: "localhost",
        port: 6379,
        password: "",
        useTls: false,
        database: 0,
      },
    };
    return NextResponse.json(mock);
  }

  try {
    const payload = await resolveConnection(connectionName);
    const sanitized = {
      ...payload,
      password: undefined,
      connectionString: undefined,
    };
    const response: ApiResponse<RedisConnectionUpsertRequest> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: sanitized,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<RedisConnectionUpsertRequest> = {
      isSuccess: false,
      message: "Failed to resolve connection.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: undefined as unknown as RedisConnectionUpsertRequest,
    };
    return NextResponse.json(response, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string }> },
) {
  const { connectionName } = await params;
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const body = (await request.json()) as RedisConnectionUpsertRequest;

  if (useMocks) {
    const mock: ApiResponse<void> = {
      isSuccess: true,
      message: "Connection updated (mock).",
      reasons: [],
      data: undefined as void,
    };
    return NextResponse.json(mock);
  }

  const response: ApiResponse<void> = {
    isSuccess: false,
    message: "Connections are managed by the shell.",
    reasons: ["Use the shell BFF to update connections."],
    data: undefined as void,
  };
  return NextResponse.json(response, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string }> },
) {
  const { connectionName } = await params;
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";

  if (useMocks) {
    const mock: ApiResponse<void> = {
      isSuccess: true,
      message: "Connection deleted (mock).",
      reasons: [],
      data: undefined as void,
    };
    return NextResponse.json(mock);
  }

  const response: ApiResponse<void> = {
    isSuccess: false,
    message: "Connections are managed by the shell.",
    reasons: ["Use the shell BFF to delete connections."],
    data: undefined as void,
  };
  return NextResponse.json(response, { status: 400 });
}
