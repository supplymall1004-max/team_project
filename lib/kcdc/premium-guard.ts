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

    // 4. 활성 구독 조회 (모든 결제 수단 확인: 카드, 페이, 토스, 프로모션 코드 등)
    const { data: activeSubscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end, payment_method")
      .eq("user_id", supabaseUser.id)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false });

    if (subError) {
      console.error("❌ 구독 조회 실패:", subError);
    }

    // 프리미엄 만료 시간 확인
    const now = new Date();
    const premiumExpiresAt = user.premium_expires_at
      ? new Date(user.premium_expires_at)
      : null;
    
    // 만료일이 지났는지 확인 (시간대 문제 방지를 위해 UTC 기준으로 비교)
    const isPremiumExpired = premiumExpiresAt 
      ? premiumExpiresAt.getTime() <= now.getTime()
      : false;

    // 구독 만료 확인 (모든 활성 구독의 current_period_end 체크)
    let hasActiveSubscription = false;
    const expiredSubscriptionIds: string[] = [];

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      for (const sub of activeSubscriptions) {
        const periodEnd = new Date(sub.current_period_end);
        if (periodEnd.getTime() <= now.getTime()) {
          // 구독 기간이 만료됨
          expiredSubscriptionIds.push(sub.id);
          console.log(`⚠️ 구독 만료됨: ${sub.id} (결제 수단: ${sub.payment_method || 'unknown'})`);
        } else {
          hasActiveSubscription = true;
        }
      }
    }

    // 만료된 구독들을 inactive로 업데이트 (모든 결제 수단에 적용)
    if (expiredSubscriptionIds.length > 0) {
      console.log(`⚠️ 만료된 구독 ${expiredSubscriptionIds.length}개를 inactive로 업데이트 중...`);
      const { error: updateSubError } = await supabase
        .from("subscriptions")
        .update({ 
          status: "inactive",
          updated_at: now.toISOString()
        })
        .in("id", expiredSubscriptionIds);

      if (updateSubError) {
        console.error("❌ 구독 상태 업데이트 실패:", updateSubError);
      } else {
        console.log(`✅ 구독 상태 업데이트 완료 (${expiredSubscriptionIds.length}개 inactive로 변경)`);
      }
    }

    // 프리미엄 활성 여부 결정: premium_expires_at 또는 활성 구독이 있어야 함
    const isPremiumActive = user.is_premium && !isPremiumExpired && (hasActiveSubscription || !premiumExpiresAt);

    // 만료일이 지났거나 활성 구독이 없는데 is_premium이 true로 남아있으면 자동으로 false로 업데이트
    if ((isPremiumExpired || !hasActiveSubscription) && user.is_premium && premiumExpiresAt) {
      console.log("⚠️ 프리미엄 만료됨 - is_premium 플래그 및 user_subscriptions 자동 업데이트");
      
      // users 테이블 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_premium: false })
        .eq("id", supabaseUser.id);

      if (updateError) {
        console.error("❌ is_premium 플래그 업데이트 실패:", updateError);
      } else {
        console.log("✅ is_premium 플래그 업데이트 완료 (false로 변경)");
      }

      // user_subscriptions 테이블 업데이트 (free 플랜으로 변경)
      const { error: userSubError } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: supabaseUser.id,
          subscription_plan: "free",
          is_active: false,
        }, {
          onConflict: "user_id"
        });

      if (userSubError) {
        console.error("❌ user_subscriptions 업데이트 실패:", userSubError);
      } else {
        console.log("✅ user_subscriptions 업데이트 완료 (free 플랜으로 변경)");
      }
    }

    console.log("✅ 프리미엄 체크 완료:", {
      isPremium: isPremiumActive,
      expiresAt: premiumExpiresAt,
      isPremiumExpired: isPremiumExpired,
      hasActiveSubscription: hasActiveSubscription,
      expiredSubscriptions: expiredSubscriptionIds.length,
      wasPremium: user.is_premium,
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

