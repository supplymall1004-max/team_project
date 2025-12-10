/**
 * @file app/api/health/medications/interactions/route.ts
 * @description 약물 상호작용 검사 API
 *
 * GET /api/health/medications/interactions - 현재 복용 중인 약물 상호작용 검사
 * POST /api/health/medications/interactions - 새 약물 추가 시 상호작용 검사
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  checkUserMedicationInteractions,
  checkNewMedicationInteraction,
} from "@/lib/health/medication-interaction-checker";

/**
 * GET /api/health/medications/interactions
 * 현재 복용 중인 약물 상호작용 검사
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/medications/interactions");

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

    // 3. 약물 상호작용 검사
    const result = await checkUserMedicationInteractions(
      premiumCheck.userId,
      familyMemberId || null
    );

    console.log("✅ 약물 상호작용 검사 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: result,
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
            : "약물 상호작용 검사 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/medications/interactions
 * 새 약물 추가 시 상호작용 검사
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/medications/interactions");

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

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { medication_name, family_member_id } = body;

    if (!medication_name) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "약물명은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 3. 새 약물 상호작용 검사
    const result = await checkNewMedicationInteraction(
      medication_name,
      premiumCheck.userId,
      family_member_id || null
    );

    console.log("✅ 새 약물 상호작용 검사 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: result,
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
            : "약물 상호작용 검사 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

