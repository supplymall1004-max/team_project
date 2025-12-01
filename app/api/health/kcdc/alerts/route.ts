/**
 * @file app/api/health/kcdc/alerts/route.ts
 * @description KCDC 알림 조회 API
 * 
 * GET /api/health/kcdc/alerts
 * - 활성화된 KCDC 알림 목록 조회
 * - 사용자 나이에 맞는 알림 필터링
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { filterAlertsByAge } from "@/lib/kcdc/kcdc-parser";
import type { KcdcAlert } from "@/types/kcdc";

export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc/alerts");

    // 1. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get("type"); // 'flu', 'vaccination', 'disease_outbreak'
    const severity = searchParams.get("severity"); // 'info', 'warning', 'critical'
    const limit = parseInt(searchParams.get("limit") || "10");

    console.log("요청 파라미터:", { alertType, severity, limit });

    // 2. 인증 확인 (선택적)
    const { userId: clerkUserId } = await auth();
    let userAge: number | undefined;

    if (clerkUserId) {
      // PGRST301 에러를 피하기 위해 service-role 클라이언트 사용
      const serviceSupabase = getServiceRoleClient();

      // 사용자 ID 조회
      const { data: users } = await serviceSupabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .limit(1);

      const userData = users && users.length > 0 ? users[0] : null;

      if (userData) {
        // 건강 프로필에서 나이 조회
        const { data: profiles } = await serviceSupabase
          .from("user_health_profiles")
          .select("age")
          .eq("user_id", userData.id)
          .limit(1);

        const profile = profiles && profiles.length > 0 ? profiles[0] : null;

        if (profile?.age) {
          userAge = profile.age;
          console.log("사용자 나이:", userAge);
        }
      }
    }

    // 3. 공개 Supabase 클라이언트 생성 (anon key 사용)
    // KCDC 알림은 공개 데이터이므로 Clerk 인증 불필요
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 4. 알림 조회
    let query = supabase
      .from("kcdc_alerts")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);

    if (alertType) {
      query = query.eq("alert_type", alertType);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error("❌ 알림 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to fetch alerts" },
        { status: 500 }
      );
    }

    // 5. 사용자 나이에 맞는 알림 필터링
    let filteredAlerts: KcdcAlert[] = alerts || [];

    if (userAge !== undefined) {
      filteredAlerts = filterAlertsByAge(filteredAlerts, userAge);
      console.log(`필터링 결과: ${filteredAlerts.length}/${alerts?.length || 0}개`);
    }

    // 6. 만료된 알림 제외
    const now = new Date();
    filteredAlerts = filteredAlerts.filter((alert) => {
      if (!alert.expires_at) return true;
      return new Date(alert.expires_at) > now;
    });

    console.log(`✅ ${filteredAlerts.length}개 알림 반환`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      count: filteredAlerts.length,
      alerts: filteredAlerts,
    });
  } catch (error: any) {
    console.error("❌ KCDC 알림 조회 실패:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

