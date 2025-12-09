/**
 * @file lib/kcdc/premium-guard.ts
 * @description 프리미엄 기능 접근 제어 헬퍼 함수
 */

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * 프리미엄 체크 결과
 */
export interface PremiumCheckResult {
  isPremium: boolean;
  userId: string | null;
  error?: string;
}

/**
 * 프리미엄 사용자 여부 확인
 * 
 * @returns 프리미엄 체크 결과
 */
export async function checkPremiumAccess(): Promise<PremiumCheckResult> {
  console.group("[PremiumGuard] 프리미엄 접근 확인");

  try {
    // 1. 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.log("❌ 인증 실패");
      console.groupEnd();
      return {
        isPremium: false,
        userId: null,
        error: "로그인이 필요합니다.",
      };
    }

    // 2. Supabase 사용자 확인
    const supabaseUser = await ensureSupabaseUser();
    if (!supabaseUser) {
      console.error("❌ 사용자 조회 실패");
      console.groupEnd();
      return {
        isPremium: false,
        userId: null,
        error: "사용자 정보를 찾을 수 없습니다.",
      };
    }

    // 3. 프리미엄 여부 확인
    const supabase = getServiceRoleClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("is_premium, premium_expires_at")
      .eq("id", supabaseUser.id)
      .single();

    if (error) {
      console.error("❌ 사용자 정보 조회 실패:", error);
      console.groupEnd();
      return {
        isPremium: false,
        userId: supabaseUser.id,
        error: "사용자 정보 조회에 실패했습니다.",
      };
    }

    // 프리미엄 만료 시간 확인
    const now = new Date();
    const premiumExpiresAt = user.premium_expires_at
      ? new Date(user.premium_expires_at)
      : null;
    const isPremiumActive =
      user.is_premium && (!premiumExpiresAt || premiumExpiresAt > now);

    console.log("✅ 프리미엄 체크 완료:", {
      isPremium: isPremiumActive,
      expiresAt: premiumExpiresAt,
    });
    console.groupEnd();

    return {
      isPremium: isPremiumActive,
      userId: supabaseUser.id,
    };
  } catch (error) {
    console.error("❌ 프리미엄 체크 오류:", error);
    console.groupEnd();
    return {
      isPremium: false,
      userId: null,
      error:
        error instanceof Error ? error.message : "프리미엄 체크 중 오류가 발생했습니다.",
    };
  }
}

