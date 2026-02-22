import { NextRequest, NextResponse } from "next/server";
import { withRedisClient } from "@/infrastructure/redis/redisClient";
import { ApiResponse } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionName: string; db: string }> },
) {
  const { connectionName, db } = await params;
  const dbIndex = Number(db);
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";

  if (Number.isNaN(dbIndex) || dbIndex < 0) {
    const invalid: ApiResponse<number> = {
      isSuccess: false,
      message: "Invalid database index.",
      reasons: ["Database index must be zero or greater."],
      data: 0,
    };
    return NextResponse.json(invalid, { status: 400 });
  }

  if (useMocks) {
    const mock: ApiResponse<number> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: Math.floor(Math.random() * 2000),
    };
    return NextResponse.json(mock);
  }

  try {
    const size = await withRedisClient(connectionName, dbIndex, (client) =>
      client.dbSize(),
    );
    const response: ApiResponse<number> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: size,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<number> = {
      isSuccess: false,
      message: "Failed to read database size.",
      reasons: [error instanceof Error ? error.message : "Unknown error."],
      data: 0,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
