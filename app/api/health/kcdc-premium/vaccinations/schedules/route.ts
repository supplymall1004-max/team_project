/**
 * @file app/api/health/kcdc-premium/vaccinations/schedules/route.ts
 * @description 예방접종 일정 관리 API
 * 
 * GET /api/health/kcdc-premium/vaccinations/schedules - 예방접종 일정 조회
 * POST /api/health/kcdc-premium/vaccinations/schedules/sync - KCDC 일정 동기화
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  getVaccinationSchedules,
  syncKcdcVaccinationSchedules,
  updateVaccinationScheduleStatus,
  type VaccinationScheduleStatus,
} from "@/lib/kcdc/vaccination-manager";

/**
 * GET /api/health/kcdc-premium/vaccinations/schedules
 * 예방접종 일정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/vaccinations/schedules");

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
    const status = searchParams.get("status") as VaccinationScheduleStatus | null;

    // 3. 예방접종 일정 조회
    const schedules = await getVaccinationSchedules(
      premiumCheck.userId,
      familyMemberId,
      status || undefined
    );

    console.log(`✅ 예방접종 일정 조회 완료: ${schedules.length}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedules,
      count: schedules.length,
    });
  } catch (error) {
    console.error("❌ 예방접종 일정 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to fetch vaccination schedules",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 일정 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/kcdc-premium/vaccinations/schedules/sync
 * KCDC 예방접종 일정 동기화
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc-premium/vaccinations/schedules/sync");

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

    // 3. KCDC 일정 동기화
    const schedules = await syncKcdcVaccinationSchedules(
      premiumCheck.userId,
      familyMemberIds
    );

    console.log(`✅ 예방접종 일정 동기화 완료: ${schedules.length}건 생성`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedules,
      count: schedules.length,
      message: `${schedules.length}개의 예방접종 일정이 생성되었습니다.`,
    });
  } catch (error) {
    console.error("❌ 예방접종 일정 동기화 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to sync vaccination schedules",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 일정 동기화에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/health/kcdc-premium/vaccinations/schedules
 * 예방접종 일정 상태 업데이트
 */
export async function PATCH(request: NextRequest) {
  try {
    console.group("[API] PATCH /api/health/kcdc-premium/vaccinations/schedules");

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
    const { schedule_id, status } = body;

    if (!schedule_id || !status) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "일정 ID와 상태는 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 3. 일정 상태 업데이트
    const schedule = await updateVaccinationScheduleStatus(
      schedule_id,
      premiumCheck.userId,
      status as VaccinationScheduleStatus
    );

    console.log("✅ 예방접종 일정 상태 업데이트 완료:", schedule.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("❌ 예방접종 일정 상태 업데이트 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to update vaccination schedule status",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 일정 상태 업데이트에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

