/**
 * @file app/api/health/kcdc-premium/checkups/records/[id]/route.ts
 * @description 건강검진 기록 수정/삭제 API
 * 
 * PUT /api/health/kcdc-premium/checkups/records/[id] - 건강검진 기록 수정
 * DELETE /api/health/kcdc-premium/checkups/records/[id] - 건강검진 기록 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import {
  updateCheckupRecord,
  deleteCheckupRecord,
  type CreateCheckupRecordParams,
} from "@/lib/kcdc/checkup-manager";

/**
 * PUT /api/health/kcdc-premium/checkups/records/[id]
 * 건강검진 기록 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] PUT /api/health/kcdc-premium/checkups/records/[id]");

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
    const updates: Partial<CreateCheckupRecordParams> = {};
    if (body.checkup_type !== undefined) updates.checkupType = body.checkup_type;
    if (body.checkup_date !== undefined) updates.checkupDate = body.checkup_date;
    if (body.checkup_site !== undefined) updates.checkupSite = body.checkup_site;
    if (body.checkup_site_address !== undefined) updates.checkupSiteAddress = body.checkup_site_address;
    if (body.results !== undefined) updates.results = body.results;
    if (body.next_recommended_date !== undefined) updates.nextRecommendedDate = body.next_recommended_date;
    if (body.notes !== undefined) updates.notes = body.notes;

    // 4. 건강검진 기록 수정
    const record = await updateCheckupRecord(id, premiumCheck.userId, updates);

    console.log("✅ 건강검진 기록 수정 완료:", record.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("❌ 건강검진 기록 수정 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to update checkup record",
        message:
          error instanceof Error
            ? error.message
            : "건강검진 기록 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/kcdc-premium/checkups/records/[id]
 * 건강검진 기록 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("[API] DELETE /api/health/kcdc-premium/checkups/records/[id]");

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

    // 3. 건강검진 기록 삭제
    await deleteCheckupRecord(id, premiumCheck.userId);

    console.log("✅ 건강검진 기록 삭제 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "건강검진 기록이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 건강검진 기록 삭제 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Failed to delete checkup record",
        message:
          error instanceof Error
            ? error.message
            : "건강검진 기록 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

