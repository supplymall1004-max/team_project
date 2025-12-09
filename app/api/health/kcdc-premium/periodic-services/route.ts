/**
 * @file app/api/health/kcdc-premium/periodic-services/route.ts
 * @description 주기적 건강 관리 서비스 API
 * 
 * GET /api/health/kcdc-premium/periodic-services - 서비스 목록 조회
 * POST /api/health/kcdc-premium/periodic-services - 서비스 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getPeriodicServices,
  createPeriodicService,
  getUpcomingServices,
  type CreatePeriodicServiceParams,
} from "@/lib/kcdc/periodic-service-manager";

/**
 * GET /api/health/kcdc-premium/periodic-services
 * 주기적 서비스 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/periodic-services");

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
    const familyMemberId = searchParams.get("family_member_id");
    const isActive = searchParams.get("is_active");
    const upcoming = searchParams.get("upcoming");
    const days = searchParams.get("days");

    // 3. 서비스 목록 조회
    let services;
    if (upcoming === "true") {
      // 다가오는 서비스만 조회
      const daysNum = days ? parseInt(days, 10) : 7;
      services = await getUpcomingServices(
        premiumCheck.userId,
        daysNum
      );
    } else {
      // 전체 서비스 조회
      services = await getPeriodicServices(
        premiumCheck.userId,
        familyMemberId || null,
        isActive ? isActive === "true" : undefined
      );
    }

    console.log("✅ 조회 성공:", services.length, "개");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
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
            : "주기적 서비스 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/periodic-services
 * 주기적 서비스 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/periodic-services");

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
    const {
      family_member_id,
      service_type,
      service_name,
      cycle_type,
      cycle_days,
      last_service_date,
      reminder_days_before,
      reminder_enabled,
      notes,
    } = body;

    // 3. 필수 필드 검증
    if (!service_type || !service_name || !cycle_type) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "서비스 유형, 서비스명, 주기 유형은 필수입니다.",
        },
        { status: 400 }
      );
    }

    // custom 주기인 경우 cycle_days 필수
    if (cycle_type === "custom" && !cycle_days) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "사용자 정의 주기인 경우 주기 일수는 필수입니다.",
        },
        { status: 400 }
      );
    }

    // 4. 서비스 생성
    const params: CreatePeriodicServiceParams = {
      userId: premiumCheck.userId,
      familyMemberId: family_member_id || null,
      serviceType: service_type,
      serviceName: service_name,
      cycleType: cycle_type,
      cycleDays: cycle_days || null,
      lastServiceDate: last_service_date || null,
      reminderDaysBefore: reminder_days_before,
      reminderEnabled: reminder_enabled,
      notes: notes || null,
    };

    const service = await createPeriodicService(params);

    console.log("✅ 생성 성공:", service.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        data: service,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "주기적 서비스 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

