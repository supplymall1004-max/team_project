/**
 * @file app/api/health/dashboard/summary/route.ts
 * @description 통합 건강 대시보드 데이터 집계 API
 *
 * GET /api/health/dashboard/summary - 대시보드 데이터 조회
 *
 * 반환 데이터:
 * - 가족 구성원별 건강 요약
 * - 건강 알림 (예방접종, 건강검진, 약물 복용, 독감 경보)
 * - 건강 트렌드 데이터
 * - 전체 건강 점수
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { aggregateDashboardData } from "@/lib/health/dashboard-aggregator";

/**
 * GET /api/health/dashboard/summary
 * 통합 건강 대시보드 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/dashboard/summary");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 대시보드 데이터 집계
    const summary = await aggregateDashboardData(premiumCheck.userId);

    console.log("✅ 대시보드 데이터 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "대시보드 데이터 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

