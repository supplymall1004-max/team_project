/**
 * @file app/api/health/data-sources/callback/route.ts
 * @description 데이터 소스 연결 콜백 처리 API
 * 
 * GET /api/health/data-sources/callback - 인증 완료 후 콜백 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

/**
 * GET /api/health/data-sources/callback
 * 데이터 소스 연결 콜백 처리
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/data-sources/callback");

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("❌ 인증 오류:", error);
      console.groupEnd();
      return redirect(`/health/data-sources?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      console.error("❌ 필수 파라미터 누락");
      console.groupEnd();
      return redirect("/health/data-sources?error=missing_parameters");
    }

    // state에서 사용자 ID와 소스 타입 추출
    const [userId, timestamp, sourceType] = state.split("_");

    console.log("✅ 인증 코드 수신:", { code, userId, sourceType });
    console.groupEnd();

    // 인증 코드를 사용하여 연결 완료 페이지로 리다이렉트
    // 실제 연결은 클라이언트에서 POST /api/health/data-sources/connect 호출
    return redirect(
      `/health/data-sources/connect?code=${code}&state=${state}&source_type=${sourceType}`
    );
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return redirect(`/health/data-sources?error=server_error`);
  }
}

