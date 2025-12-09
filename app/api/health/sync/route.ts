/**
 * @file app/api/health/sync/route.ts
 * @description 건강정보 수동 동기화 API
 * 
 * POST /api/health/sync - 사용자가 수동으로 동기화 실행
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { syncHealthData, type SyncParams } from "@/lib/health/health-data-sync-service";

/**
 * POST /api/health/sync
 * 건강정보 수동 동기화 실행
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/sync");

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
    const { data_source_id, sync_type, start_date, end_date, family_member_id } = body;

    // 3. 동기화 실행
    const syncParams: SyncParams = {
      userId: premiumCheck.userId,
      dataSourceId: data_source_id,
      syncType: sync_type || "manual",
      startDate: start_date,
      endDate: end_date,
      familyMemberId: family_member_id,
    };

    const result = await syncHealthData(syncParams);

    console.log(`✅ 동기화 완료: ${result.recordsSynced}건`);
    console.groupEnd();

    return NextResponse.json({
      success: result.success,
      records_synced: result.recordsSynced,
      hospital_records_count: result.hospitalRecordsCount,
      medication_records_count: result.medicationRecordsCount,
      disease_records_count: result.diseaseRecordsCount,
      checkup_records_count: result.checkupRecordsCount,
      error: result.error,
      error_details: result.errorDetails,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

