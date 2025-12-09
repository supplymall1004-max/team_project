/**
 * @file app/api/health/kcdc-premium/vaccinations/[id]/route.ts
 * @description 예방접종 기록 수정/삭제 API
 * 
 * PUT /api/health/kcdc-premium/vaccinations/[id] - 예방접종 기록 수정
 * DELETE /api/health/kcdc-premium/vaccinations/[id] - 예방접종 기록 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  updateVaccinationRecord,
  deleteVaccinationRecord,
  type CreateVaccinationRecordParams,
} from "@/lib/kcdc/vaccination-manager";

/**
 * PUT /api/health/kcdc-premium/vaccinations/[id]
 * 예방접종 기록 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] PUT /api/health/kcdc-premium/vaccinations/[id]");

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

    // 2. 파라미터 파싱
    const { id } = await params;

    // 3. 요청 본문 파싱
    const body = await request.json();
    const updates: Partial<CreateVaccinationRecordParams> = {};
    if (body.vaccine_name !== undefined) updates.vaccineName = body.vaccine_name;
    if (body.vaccine_code !== undefined) updates.vaccineCode = body.vaccine_code;
    if (body.target_age_group !== undefined) updates.targetAgeGroup = body.target_age_group;
    if (body.scheduled_date !== undefined) updates.scheduledDate = body.scheduled_date;
    if (body.completed_date !== undefined) updates.completedDate = body.completed_date;
    if (body.dose_number !== undefined) updates.doseNumber = body.dose_number;
    if (body.total_doses !== undefined) updates.totalDoses = body.total_doses;
    if (body.vaccination_site !== undefined) updates.vaccinationSite = body.vaccination_site;
    if (body.vaccination_site_address !== undefined) updates.vaccinationSiteAddress = body.vaccination_site_address;
    if (body.reminder_enabled !== undefined) updates.reminderEnabled = body.reminder_enabled;
    if (body.reminder_days_before !== undefined) updates.reminderDaysBefore = body.reminder_days_before;
    if (body.notes !== undefined) updates.notes = body.notes;

    // 4. 예방접종 기록 수정
    const record = await updateVaccinationRecord(
      id,
      premiumCheck.userId,
      updates
    );

    console.log("✅ 예방접종 기록 수정 완료:", record.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("❌ 예방접종 기록 수정 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to update vaccination record",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 기록 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/kcdc-premium/vaccinations/[id]
 * 예방접종 기록 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] DELETE /api/health/kcdc-premium/vaccinations/[id]");

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

    // 2. 파라미터 파싱
    const { id } = await params;

    // 3. 예방접종 기록 삭제
    await deleteVaccinationRecord(id, premiumCheck.userId);

    console.log("✅ 예방접종 기록 삭제 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "예방접종 기록이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 예방접종 기록 삭제 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to delete vaccination record",
        message:
          error instanceof Error
            ? error.message
            : "예방접종 기록 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

