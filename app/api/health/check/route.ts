/**
 * @file api/health/check/route.ts
 * @description 건강 정보 존재 여부 확인 API
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

export async function GET() {
  console.groupCollapsed("[HealthCheck] 건강 정보 확인");
  try {
    const { userId } = await auth();
    console.log("🔐 Clerk User ID:", userId);

    if (!userId) {
      console.warn("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ hasProfile: false }, { status: 200 });
    }

    const supabase = getServiceRoleClient();
    console.log("🔑 Service Role 클라이언트 생성됨");

    // 사용자 ID 조회 (없으면 자동 생성) - 다른 API들과 동일한 방식
    console.log("👤 사용자 확인/동기화 중...");
    const ensuredUser = await ensureSupabaseUser();
    console.log("👤 ensureSupabaseUser 결과:", ensuredUser);

    if (!ensuredUser) {
      console.warn("❌ 사용자를 찾을 수 없음 (동기화 실패)");
      console.groupEnd();
      return NextResponse.json({ hasProfile: false }, { status: 200 });
    }

    console.log("✅ 사용자 ID:", ensuredUser.id);

    // 건강 정보 확인
    console.log("🏥 건강 정보 조회 중...");
    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("id, daily_calorie_goal")
      .eq("user_id", ensuredUser.id)
      .single();

    console.log("🏥 건강 정보 조회 결과:", { profile, profileError });

    const hasProfile = !profileError && !!profile;
    const hasValidCalorieGoal = hasProfile && profile.daily_calorie_goal > 0;
    console.log(
      "📋 최종 결과 - hasProfile:",
      hasProfile,
      ", hasValidCalorieGoal:",
      hasValidCalorieGoal,
    );

    console.groupEnd();
    return NextResponse.json(
      {
        hasProfile,
        hasValidCalorieGoal: hasValidCalorieGoal || false,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("health check error", error);
    return NextResponse.json(
      { error: "건강 정보 확인에 실패했습니다" },
      { status: 500 },
    );
  }
}
