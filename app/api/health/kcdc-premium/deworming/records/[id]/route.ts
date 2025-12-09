/**
 * @file app/api/health/kcdc-premium/deworming/records/[id]/route.ts
 * @description 구충제 복용 기록 개별 API
 * 
 * GET /api/health/kcdc-premium/deworming/records/[id] - 기록 조회
 * PUT /api/health/kcdc-premium/deworming/records/[id] - 기록 수정
 * DELETE /api/health/kcdc-premium/deworming/records/[id] - 기록 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  updateDewormingRecord,
  deleteDewormingRecord,
  type UpdateDewormingRecordParams,
} from "@/lib/kcdc/deworming-manager";

/**
 * GET /api/health/kcdc-premium/deworming/records/[id]
 * 기록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(
      "[API] GET /api/health/kcdc-premium/deworming/records/[id]"
    );
    console.log("recordId:", id);

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

    // 2. 기록 조회 (단일)
    const { getDewormingRecords } = await import(
      "@/lib/kcdc/deworming-manager"
    );
    const records = await getDewormingRecords(premiumCheck.userId);
    const record = records.find((r) => r.id === id);

    if (!record) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "기록을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    console.log("✅ 조회 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "기록 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/kcdc-premium/deworming/records/[id]
 * 기록 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(
      "[API] PUT /api/health/kcdc-premium/deworming/records/[id]"
    );
    console.log("recordId:", id);

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
      medication_name,
      dosage,
      taken_date,
      next_due_date,
      cycle_days,
      prescribed_by,
      notes,
    } = body;

    // 3. 기록 수정
    const updateParams: UpdateDewormingRecordParams = {};
    if (medication_name !== undefined)
      updateParams.medicationName = medication_name;
    if (dosage !== undefined) updateParams.dosage = dosage;
    if (taken_date !== undefined) updateParams.takenDate = taken_date;
    if (next_due_date !== undefined)
      updateParams.nextDueDate = next_due_date;
    if (cycle_days !== undefined) updateParams.cycleDays = cycle_days;
    if (prescribed_by !== undefined)
      updateParams.prescribedBy = prescribed_by;
    if (notes !== undefined) updateParams.notes = notes;

    const record = await updateDewormingRecord(
      id,
      premiumCheck.userId,
      updateParams
    );

    console.log("✅ 수정 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "기록 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/kcdc-premium/deworming/records/[id]
 * 기록 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(
      "[API] DELETE /api/health/kcdc-premium/deworming/records/[id]"
    );
    console.log("recordId:", id);

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

    // 2. 기록 삭제
    await deleteDewormingRecord(id, premiumCheck.userId);

    console.log("✅ 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "기록이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "기록 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

