import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse } from "@/lib/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string; key: string }> },
) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const { connectionName, key } = await params;
  const db = request.nextUrl.searchParams.get("db");
  const confirmName = request.nextUrl.searchParams.get("confirmName");

  if (useMocks) {
    const mock: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Deleted (mock).",
      reasons: [],
      data: true,
    };
    return NextResponse.json(mock);
  }

  if (confirmName && confirmName !== key) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "Confirmation name does not match.",
      reasons: ["confirmName must match the key name."],
      data: false,
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const dbIndex = db ? Number(db) : undefined;
    await withRedisClient(connectionName, dbIndex, (client) => client.del(key));
    const response: ApiResponse<boolean> = {
      isSuccess: true,
      message: "Deleted.",
      reasons: [],
      data: true,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<boolean> = {
      isSuccess: false,
      message: "Failed to delete key.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
