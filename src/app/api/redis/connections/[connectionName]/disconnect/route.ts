import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

export async function POST(
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
      message: "Connection disconnected (mock).",
      reasons: [],
      data: undefined as void,
    };
    return NextResponse.json(mock);
  }

  const response: ApiResponse<void> = {
    isSuccess: true,
    message: "Connection disconnected.",
    reasons: [],
    data: undefined as void,
  };
  return NextResponse.json(response);
}
