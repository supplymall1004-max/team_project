/**
 * @file actions/health/check.ts
 * @description 건강 정보 존재 여부 확인 Server Action
 *
 * 건강 프로필이 존재하는지, 유효한 칼로리 목표가 설정되어 있는지 확인합니다.
 * 기존 /api/health/check API Route를 Server Actions로 마이그레이션했습니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * 건강 정보 확인 결과
 */
export interface HealthCheckResult {
  hasProfile: boolean;
  hasValidCalorieGoal: boolean;
}

/**
 * 건강 정보 존재 여부 확인
 *
 * @returns 건강 프로필 존재 여부 및 유효한 칼로리 목표 설정 여부
 */
export async function checkHealthProfile(): Promise<HealthCheckResult> {
  console.groupCollapsed("[checkHealthProfile] 건강 정보 확인");
  try {
    const { userId } = await auth();
    console.log("🔐 Clerk User ID:", userId);

    if (!userId) {
      console.warn("❌ 인증 실패");
      console.groupEnd();
      return { hasProfile: false, hasValidCalorieGoal: false };
    }

    const supabase = getServiceRoleClient();
    console.log("🔑 Service Role 클라이언트 생성됨");

    // 사용자 ID 조회 (없으면 자동 생성)
    console.log("👤 사용자 확인/동기화 중...");
    const ensuredUser = await ensureSupabaseUser();
    console.log("👤 ensureSupabaseUser 결과:", ensuredUser);

    if (!ensuredUser) {
      console.warn("❌ 사용자를 찾을 수 없음 (동기화 실패)");
      console.groupEnd();
      return { hasProfile: false, hasValidCalorieGoal: false };
    }

    console.log("✅ 사용자 ID:", ensuredUser.id);

    // 건강 정보 확인
    console.log("🏥 건강 정보 조회 중...");
    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("id, daily_calorie_goal")
      .eq("user_id", ensuredUser.id)
      .maybeSingle();

    console.log("🏥 건강 정보 조회 결과:", { profile, profileError });

    const hasProfile = !profileError && !!profile;
    const hasValidCalorieGoal =
      hasProfile && profile.daily_calorie_goal > 0;
    console.log(
      "📋 최종 결과 - hasProfile:",
      hasProfile,
      ", hasValidCalorieGoal:",
      hasValidCalorieGoal,
    );

    console.groupEnd();
    return {
      hasProfile,
      hasValidCalorieGoal: hasValidCalorieGoal || false,
    };
  } catch (error) {
    console.error("❌ [checkHealthProfile] 오류:", error);
    console.groupEnd();
    return { hasProfile: false, hasValidCalorieGoal: false };
  }
}
