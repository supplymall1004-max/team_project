/**
 * @file app/api/health/kcdc/refresh/route.ts
 * @description KCDC 데이터 동기화 API
 * 
 * POST /api/health/kcdc/refresh
 * - KCDC API에서 최신 데이터를 가져와 DB에 저장
 * - Supabase Edge Function 크론 잡에서 호출
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchKcdcData, parseKcdcResponseToAlerts } from "@/lib/kcdc/kcdc-parser";

export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/kcdc/refresh");

    // 1. 인증 확인 (크론 잡 전용 시크릿 키)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("❌ CRON_SECRET 환경 변수 미설정");
      console.groupEnd();
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ 인증 실패: 잘못된 CRON_SECRET");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. KCDC API에서 데이터 가져오기
    console.log("🏥 KCDC 데이터 가져오기 시작...");
    const kcdcResponse = await fetchKcdcData();

    // 3. 데이터 파싱
    const alerts = parseKcdcResponseToAlerts(kcdcResponse);
    console.log(`📊 파싱 결과: ${alerts.length}개 알림`);

    // 4. 데이터베이스에 저장 (Service Role 사용)
    const supabase = getServiceRoleClient();

    // 4-1. 기존 알림 비활성화 (같은 타입의 알림은 최신 것만 유지)
    const alertTypes = Array.from(new Set(alerts.map((a) => a.alert_type)));
    for (const type of alertTypes) {
      await supabase
        .from("kcdc_alerts")
        .update({ is_active: false })
        .eq("alert_type", type)
        .eq("is_active", true);
    }

    // 4-2. 새 알림 삽입
    const now = new Date().toISOString();
    const recordsToInsert = alerts.map((alert) => ({
      ...alert,
      fetched_at: now,
    }));

    const { data: insertedAlerts, error: insertError } = await supabase
      .from("kcdc_alerts")
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.error("❌ 알림 저장 실패:", insertError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to save alerts", details: insertError },
        { status: 500 }
      );
    }

    console.log(`✅ ${insertedAlerts?.length || 0}개 알림 저장 완료`);

    // 4-3. 만료된 알림 자동 비활성화
    const { data: deactivatedCount } = await supabase.rpc(
      "deactivate_expired_kcdc_alerts"
    );

    console.log(`🧹 ${deactivatedCount || 0}개 만료 알림 비활성화`);

    console.log("✅ KCDC 데이터 동기화 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      fetched: alerts.length,
      inserted: insertedAlerts?.length || 0,
      deactivated: deactivatedCount || 0,
      timestamp: now,
    });
  } catch (error: any) {
    console.error("❌ KCDC 데이터 동기화 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET 메서드: 동기화 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // 마지막 동기화 시간 조회
    const { data: latestAlert } = await supabase
      .from("kcdc_alerts")
      .select("fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    // 활성화된 알림 개수
    const { count: activeCount } = await supabase
      .from("kcdc_alerts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    return NextResponse.json({
      lastSyncedAt: latestAlert?.fetched_at || null,
      activeAlertsCount: activeCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}










