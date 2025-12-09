/**
 * @file app/api/health/kcdc-premium/checkups/recommendations/route.ts
 * @description 건강검진 권장 일정 관리 API
 * 
 * GET /api/health/kcdc-premium/checkups/recommendations - 권장 일정 조회
 * POST /api/health/kcdc-premium/checkups/recommendations/sync - 권장 일정 동기화
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getCheckupRecommendations,
  syncCheckupRecommendations,
} from "@/lib/kcdc/checkup-manager";

/**
 * GET /api/health/kcdc-premium/checkups/recommendations
 * 건강검진 권장 일정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/checkups/recommendations");

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

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get("family_member_id") || undefined;
    const overdueOnly = searchParams.get("overdue_only") === "true";

    // 3. 건강검진 권장 일정 조회
    const recommendations = await getCheckupRecommendations(
      premiumCheck.userId,
      familyMemberId,
      overdueOnly
    );

    console.log(`✅ 건강검진 권장 일정 조회 완료: ${recommendations.length}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("❌ 건강검진 권장 일정 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to fetch checkup recommendations",
        message:
          error instanceof Error
            ? error.message
            : "건강검진 권장 일정 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/checkups/recommendations/sync
 * 건강검진 권장 일정 동기화
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/checkups/recommendations/sync");

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

    // 2. 요청 본문 파싱 (선택적)
    const body = await request.json().catch(() => ({}));
    const familyMemberIds = body.family_member_ids as string[] | undefined;

    // 3. 권장 일정 동기화
    const recommendations = await syncCheckupRecommendations(
      premiumCheck.userId,
      familyMemberIds
    );

    console.log(`✅ 건강검진 권장 일정 동기화 완료: ${recommendations.length}건 생성`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      message: `${recommendations.length}개의 건강검진 권장 일정이 생성되었습니다.`,
    });
  } catch (error) {
    console.error("❌ 건강검진 권장 일정 동기화 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to sync checkup recommendations",
        message:
          error instanceof Error
            ? error.message
            : "건강검진 권장 일정 동기화에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

