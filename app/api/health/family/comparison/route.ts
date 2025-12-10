/**
 * @file app/api/health/family/comparison/route.ts
 * @description 가족 건강 비교 분석 API
 *
 * GET /api/health/family/comparison - 가족 건강 비교 데이터 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { analyzeFamilyHealth } from "@/lib/health/family-health-analyzer";

/**
 * GET /api/health/family/comparison
 * 가족 건강 비교 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/family/comparison");

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

    // 2. 가족 건강 비교 분석
    const comparison = await analyzeFamilyHealth(premiumCheck.userId);

    console.log("✅ 가족 건강 비교 데이터 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "가족 건강 비교 데이터 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

