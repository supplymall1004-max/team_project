/**
 * @file route.ts
 * @description 의료기관 검색 메인 API 엔드포인트
 *
 * 의료기관 검색을 위한 메인 엔드포인트입니다.
 * 실제 검색은 /search 엔드포인트로 리다이렉트됩니다.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/health/medical-facilities
 *
 * 의료기관 검색 메인 엔드포인트
 * /search 엔드포인트로 리다이렉트합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchUrl = new URL("/api/health/medical-facilities/search", request.url);
  
  // 모든 쿼리 파라미터를 전달
  searchParams.forEach((value, key) => {
    searchUrl.searchParams.set(key, value);
  });

  // /search 엔드포인트로 리다이렉트
  return NextResponse.redirect(searchUrl);
}

