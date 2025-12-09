/**
 * @file app/api/health/kcdc-premium/periodic-services/[id]/complete/route.ts
 * @description 주기적 서비스 완료 처리 API
 * 
 * POST /api/health/kcdc-premium/periodic-services/[id]/complete - 서비스 완료 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { completePeriodicService } from "@/lib/kcdc/periodic-service-manager";

/**
 * POST /api/health/kcdc-premium/periodic-services/[id]/complete
 * 서비스 완료 처리
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(
      "[API] POST /api/health/kcdc-premium/periodic-services/[id]/complete"
    );
    console.log("serviceId:", id);

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

    // 2. 요청 본문 파싱 (완료일, 선택사항)
    const body = await request.json().catch(() => ({}));
    const { completed_date } = body;

    // 3. 서비스 완료 처리
    const service = await completePeriodicService(
      id,
      premiumCheck.userId,
      completed_date
    );

    console.log("✅ 완료 처리 성공");
    console.log("다음 일정:", service.next_service_date);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: service,
      message: "서비스가 완료 처리되었습니다.",
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
            : "서비스 완료 처리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

