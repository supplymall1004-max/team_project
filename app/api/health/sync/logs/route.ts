/**
 * @file app/api/health/sync/logs/route.ts
 * @description 건강정보 동기화 로그 조회 API
 * 
 * GET /api/health/sync/logs - 동기화 로그 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/health/sync/logs
 * 동기화 로그 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/sync/logs");

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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const syncStatus = searchParams.get("sync_status") || undefined;

    // 3. 동기화 로그 조회
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("health_data_sync_logs")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("synced_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (syncStatus) {
      query = query.eq("sync_status", syncStatus);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("❌ 동기화 로그 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch sync logs",
          message: error.message,
        },
        { status: 500 }
      );
    }

    // 4. 통계 조회
    const { count: totalCount } = await supabase
      .from("health_data_sync_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", premiumCheck.userId);

    const { count: successCount } = await supabase
      .from("health_data_sync_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", premiumCheck.userId)
      .eq("sync_status", "success");

    const { count: failedCount } = await supabase
      .from("health_data_sync_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", premiumCheck.userId)
      .eq("sync_status", "failed");

    console.log(`✅ 동기화 로그 조회 완료: ${logs?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: logs || [],
      count: logs?.length || 0,
      total_count: totalCount || 0,
      statistics: {
        total: totalCount || 0,
        success: successCount || 0,
        failed: failedCount || 0,
      },
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

