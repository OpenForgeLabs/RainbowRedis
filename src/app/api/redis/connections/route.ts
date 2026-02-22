import { NextRequest, NextResponse } from "next/server";
import {
  ApiResponse,
  RedisConnectionInfo,
  RedisConnectionUpsertRequest,
} from "@/lib/types";
const SHELL_BASE_URL = process.env.SHELL_BASE_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";

  if (useMocks) {
    const mock: ApiResponse<RedisConnectionInfo[]> = {
      isSuccess: true,
      message: "",
      reasons: [],
      data: [
        {
          name: "prod-cache",
          useTls: true,
          database: 0,
          isEditable: true,
          source: "local",
          environment: "production",
        },
        {
          name: "stg-session-cache",
          useTls: false,
          database: 1,
          isEditable: true,
          source: "local",
          environment: "staging",
        },
      ],
    };
    return NextResponse.json(mock);
  }

  const response = await fetch(`${SHELL_BASE_URL}/api/connections/redis`, {
    cache: "no-store",
  });
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        isSuccess: false,
        message: "Invalid response from shell connections API.",
        reasons: [text],
      },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const useMocks =
    request.nextUrl.searchParams.get("mock") === "true" ||
    process.env.BFF_USE_MOCKS === "true";
  const body = (await request.json()) as RedisConnectionUpsertRequest;

  if (useMocks) {
    const mock: ApiResponse<void> = {
      isSuccess: true,
      message: "Connection saved (mock).",
      reasons: [],
      data: undefined as void,
    };
    return NextResponse.json(mock);
  }

  const response = await fetch(`${SHELL_BASE_URL}/api/connections/redis`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        isSuccess: false,
        message: "Invalid response from shell connections API.",
        reasons: [text],
      },
      { status: 502 },
    );
  }
}
