/**
 * @file api/health/check/route.ts
 * @description 건강 정보 존재 여부 확인 API
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

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

    // 사용자 ID 조회
    console.log("👤 사용자 조회 중...");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    console.log("👤 사용자 조회 결과:", { userData, userError });

    if (userError || !userData) {
      console.warn("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ hasProfile: false }, { status: 200 });
    }

    console.log("✅ 사용자 ID:", userData.id);

    // 건강 정보 확인
    console.log("🏥 건강 정보 조회 중...");
    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("id, daily_calorie_goal")
      .eq("user_id", userData.id)
      .single();

    console.log("🏥 건강 정보 조회 결과:", { profile, profileError });

    const hasProfile = !profileError && !!profile;
    const hasValidCalorieGoal = hasProfile && profile.daily_calorie_goal > 0;
    console.log("📋 최종 결과 - hasProfile:", hasProfile, ", hasValidCalorieGoal:", hasValidCalorieGoal);

    console.groupEnd();
    return NextResponse.json(
      {
        hasProfile,
        hasValidCalorieGoal: hasValidCalorieGoal || false
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("health check error", error);
    return NextResponse.json(
      { error: "건강 정보 확인에 실패했습니다" },
      { status: 500 }
    );
  }
}

