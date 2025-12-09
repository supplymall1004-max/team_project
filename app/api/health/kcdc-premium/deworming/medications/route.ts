/**
 * @file app/api/health/kcdc-premium/deworming/medications/route.ts
 * @description 구충제 마스터 데이터 API
 * 
 * GET /api/health/kcdc-premium/deworming/medications - 구충제 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getDewormingMedications } from "@/lib/kcdc/deworming-manager";

/**
 * GET /api/health/kcdc-premium/deworming/medications
 * 구충제 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/deworming/medications");

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
    const searchParams = request.nextUrl.searchParams;
    const ageGroup = searchParams.get("age_group");

    // 3. 구충제 목록 조회
    const medications = await getDewormingMedications(ageGroup || undefined);

    console.log("✅ 조회 성공:", medications.length, "개");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: medications,
      count: medications.length,
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "구충제 목록 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

