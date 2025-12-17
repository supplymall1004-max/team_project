/**
 * @file app/api/debug/supabase/route.ts
 * @description (개발용) 현재 Next.js 서버가 어떤 Supabase 프로젝트에 연결되는지 확인하는 디버그 API
 *
 * 목적:
 * - "화면에서는 식단 생성 성공인데 DB에는 저장이 안됨" 같은 상황에서,
 *   실제로 앱이 바라보는 Supabase URL이 우리가 확인하는 프로젝트와 동일한지 검증합니다.
 *
 * 보안:
 * - URL/환경변수 존재 여부만 반환합니다.
 * - anon/service_role 키의 값은 절대 반환하지 않습니다.
 */

import { NextResponse } from "next/server";

interface DebugSupabaseResponse {
  nodeEnv: string;
  supabaseUrl: string | null;
  supabaseProjectRef: string | null;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
}

function extractProjectRef(url: string): string | null {
  try {
    const u = new URL(url);
    // https://<ref>.supabase.co 형태
    const host = u.hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const res: DebugSupabaseResponse = {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    supabaseUrl,
    supabaseProjectRef: supabaseUrl ? extractProjectRef(supabaseUrl) : null,
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  return NextResponse.json(res, { status: 200 });
}

