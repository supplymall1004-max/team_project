/**
 * @file app/api/health/kcdc-premium/periodic-services/[id]/route.ts
 * @description 주기적 건강 관리 서비스 개별 API
 * 
 * GET /api/health/kcdc-premium/periodic-services/[id] - 서비스 조회
 * PUT /api/health/kcdc-premium/periodic-services/[id] - 서비스 수정
 * DELETE /api/health/kcdc-premium/periodic-services/[id] - 서비스 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  updatePeriodicService,
  deletePeriodicService,
  completePeriodicService,
  type UpdatePeriodicServiceParams,
} from "@/lib/kcdc/periodic-service-manager";

/**
 * GET /api/health/kcdc-premium/periodic-services/[id]
 * 서비스 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group("[API] GET /api/health/kcdc-premium/periodic-services/[id]");
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

    // 2. 서비스 조회 (단일)
    const { getPeriodicServices } = await import(
      "@/lib/kcdc/periodic-service-manager"
    );
    const services = await getPeriodicServices(premiumCheck.userId);
    const service = services.find((s) => s.id === id);

    if (!service) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "서비스를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    console.log("✅ 조회 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: service,
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
            : "서비스 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/kcdc-premium/periodic-services/[id]
 * 서비스 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group("[API] PUT /api/health/kcdc-premium/periodic-services/[id]");
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

    // 2. 요청 본문 파싱
    const body = await request.json();
    const {
      service_name,
      cycle_type,
      cycle_days,
      last_service_date,
      next_service_date,
      reminder_days_before,
      reminder_enabled,
      notes,
      is_active,
    } = body;

    // 3. 서비스 수정
    const updateParams: UpdatePeriodicServiceParams = {};
    if (service_name !== undefined) updateParams.serviceName = service_name;
    if (cycle_type !== undefined) updateParams.cycleType = cycle_type;
    if (cycle_days !== undefined) updateParams.cycleDays = cycle_days;
    if (last_service_date !== undefined)
      updateParams.lastServiceDate = last_service_date;
    if (next_service_date !== undefined)
      updateParams.nextServiceDate = next_service_date;
    if (reminder_days_before !== undefined)
      updateParams.reminderDaysBefore = reminder_days_before;
    if (reminder_enabled !== undefined)
      updateParams.reminderEnabled = reminder_enabled;
    if (notes !== undefined) updateParams.notes = notes;
    if (is_active !== undefined) updateParams.isActive = is_active;

    const service = await updatePeriodicService(
      id,
      premiumCheck.userId,
      updateParams
    );

    console.log("✅ 수정 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: service,
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
            : "서비스 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/kcdc-premium/periodic-services/[id]
 * 서비스 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(
      "[API] DELETE /api/health/kcdc-premium/periodic-services/[id]"
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

    // 2. 서비스 삭제
    await deletePeriodicService(id, premiumCheck.userId);

    console.log("✅ 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "서비스가 삭제되었습니다.",
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
            : "서비스 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

