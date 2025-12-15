/**
 * @file route.ts
 * @description 국립중앙의료원 약국 정보 조회 API 엔드포인트
 *
 * 서버 사이드에서 API 키를 보호하기 위한 프록시
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPharmacies, PharmacySearchParams } from "@/lib/health/pharmacy-api";

/**
 * POST /api/health/pharmacy/search
 *
 * 국립중앙의료원 약국 정보 조회 API
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/pharmacy/search");

    const body = await request.json();
    const params: PharmacySearchParams = body;

    console.log("약국 정보 조회 요청:", params);

    const result = await searchPharmacies(params);

    console.log("약국 정보 조회 성공:", {
      totalCount: result.totalCount,
      pharmaciesCount: result.pharmacies.length,
    });

    console.groupEnd();

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ 약국 정보 조회 오류:", error);
    
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
      console.error("에러 스택:", error.stack);
    }
    
    console.groupEnd();

    const errorMessage = error instanceof Error 
      ? error.message 
      : "약국 정보 조회에 실패했습니다.";
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
        } : undefined,
      },
      { status: 500 }
    );
  }
}