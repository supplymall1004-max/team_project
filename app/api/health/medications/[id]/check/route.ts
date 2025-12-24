/**
 * @file app/api/health/medications/[id]/check/route.ts
 * @description 약물 복용 체크 API
 *
 * 캐릭터창에서 약물 복용 여부를 체크/해제하는 API입니다.
 * 오늘 날짜의 medication_reminder_logs를 찾아서 상태를 업데이트합니다.
 *
 * POST: 약물 복용 체크
 * DELETE: 약물 복용 체크 해제
 *
 * @dependencies
 * - @/lib/kcdc/premium-guard: checkPremiumAccess
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/health/medication-reminder-service: confirmMedicationReminder
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { confirmMedicationReminder } from "@/lib/health/medication-reminder-service";

/**
 * POST /api/health/medications/[id]/check
 * 약물 복용 체크
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] POST /api/health/medications/[id]/check");
    const { id: medicationId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

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

    const supabase = getServiceRoleClient();

    // 2. 약물 기록 확인
    const { data: medication, error: medicationError } = await supabase
      .from("medication_records")
      .select("id, user_id, family_member_id")
      .eq("id", medicationId)
      .single();

    if (medicationError || !medication) {
      console.error("❌ 약물 기록 조회 실패:", medicationError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Medication not found",
          message: "약물 기록을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 3. 권한 확인 (본인 또는 가족 구성원의 약물인지)
    if (medication.user_id !== premiumCheck.userId) {
      console.error("❌ 권한 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "이 약물 기록에 접근할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 4. 오늘 날짜의 reminder log 찾기 또는 생성
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const { data: existingLogs, error: logsError } = await supabase
      .from("medication_reminder_logs")
      .select("id, status")
      .eq("medication_record_id", medicationId)
      .gte("scheduled_time", dateStart.toISOString())
      .lte("scheduled_time", dateEnd.toISOString())
      .limit(1);

    if (logsError) {
      console.error("❌ 알림 로그 조회 실패:", logsError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "알림 로그 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    let reminderLogId: string;

    if (existingLogs && existingLogs.length > 0) {
      // 기존 로그가 있으면 사용
      reminderLogId = existingLogs[0].id;
    } else {
      // 기존 로그가 없으면 생성 (오늘 오후 2시로 설정)
      const scheduledTime = new Date(date);
      scheduledTime.setHours(14, 0, 0, 0);

      const { data: newLog, error: createError } = await supabase
        .from("medication_reminder_logs")
        .insert({
          medication_record_id: medicationId,
          scheduled_time: scheduledTime.toISOString(),
          status: "pending",
        })
        .select("id")
        .single();

      if (createError || !newLog) {
        console.error("❌ 알림 로그 생성 실패:", createError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Internal server error",
            message: "알림 로그 생성 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      reminderLogId = newLog.id;
    }

    // 5. 약물 복용 확인
    const reminder = await confirmMedicationReminder(reminderLogId);

    console.log("✅ 약물 복용 체크 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: reminder,
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
            : "약물 복용 체크 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/medications/[id]/check
 * 약물 복용 체크 해제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] DELETE /api/health/medications/[id]/check");
    const { id: medicationId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

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

    const supabase = getServiceRoleClient();

    // 2. 약물 기록 확인
    const { data: medication, error: medicationError } = await supabase
      .from("medication_records")
      .select("id, user_id, family_member_id")
      .eq("id", medicationId)
      .single();

    if (medicationError || !medication) {
      console.error("❌ 약물 기록 조회 실패:", medicationError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Medication not found",
          message: "약물 기록을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 3. 권한 확인
    if (medication.user_id !== premiumCheck.userId) {
      console.error("❌ 권한 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "이 약물 기록에 접근할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 4. 오늘 날짜의 reminder log 찾기
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const { data: existingLogs, error: logsError } = await supabase
      .from("medication_reminder_logs")
      .select("id")
      .eq("medication_record_id", medicationId)
      .eq("status", "confirmed")
      .gte("scheduled_time", dateStart.toISOString())
      .lte("scheduled_time", dateEnd.toISOString())
      .limit(1);

    if (logsError) {
      console.error("❌ 알림 로그 조회 실패:", logsError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "알림 로그 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (!existingLogs || existingLogs.length === 0) {
      console.log("✅ 체크된 로그가 없음");
      console.groupEnd();
      return NextResponse.json({
        success: true,
        message: "체크된 로그가 없습니다.",
      });
    }

    // 5. 체크 해제 (status를 pending으로 변경)
    const { error: updateError } = await supabase
      .from("medication_reminder_logs")
      .update({
        confirmed_at: null,
        status: "pending",
      })
      .eq("id", existingLogs[0].id);

    if (updateError) {
      console.error("❌ 체크 해제 실패:", updateError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "체크 해제 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    console.log("✅ 약물 복용 체크 해제 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "체크 해제 완료",
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
            : "약물 복용 체크 해제 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

