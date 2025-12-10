'use server';

/**
 * @file get-subscription.ts
 * @description 구독 정보 조회 Server Action
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface SubscriptionInfo {
  id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'paused';
  planType: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  pricePerMonth: number;
  totalPaid: number;
  nextBillingDate: string | null;
  paymentMethod: string;
  lastFourDigits: string;
  cancelledAt: string | null;
  isTestMode: boolean;
}

export interface GetSubscriptionResponse {
  success: boolean;
  isPremium: boolean;
  subscription: SubscriptionInfo | null;
  premiumExpiresAt: string | null;
  error?: string;
}

/**
 * 현재 사용자의 구독 정보 조회
 * 
 * 실제 구독 정보를 데이터베이스에서 조회하여 프리미엄 여부를 확인합니다.
 */
export async function getCurrentSubscription(): Promise<GetSubscriptionResponse> {
  console.group('[GetSubscription] 구독 정보 조회');

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return {
        success: false,
        isPremium: false,
        subscription: null,
        premiumExpiresAt: null,
        error: '로그인이 필요합니다.',
      };
    }

    // 2. 사용자 정보 조회 (없으면 자동 생성)
    const supabaseUser = await ensureSupabaseUser();
    
    if (!supabaseUser) {
      console.error('❌ 사용자 조회 실패: 사용자를 찾을 수 없거나 생성할 수 없습니다.');
      console.groupEnd();
      return {
        success: false,
        isPremium: false,
        subscription: null,
        premiumExpiresAt: null,
        error: '사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    console.log('✅ 사용자 확인 완료:', supabaseUser.id);

    // 사용자 상세 정보 조회 (프리미엄 정보 포함)
    // Service Role 클라이언트 사용 (RLS 우회, 안정적인 조회)
    const serviceSupabase = getServiceRoleClient();
    const { data: user, error: userError } = await serviceSupabase
      .from('users')
      .select('id, is_premium, premium_expires_at')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (userError) {
      console.error('❌ 사용자 상세 정보 조회 실패:', userError);
      console.groupEnd();
      return {
        success: false,
        isPremium: false,
        subscription: null,
        premiumExpiresAt: null,
        error: '사용자 정보를 조회하는 중 오류가 발생했습니다.',
      };
    }

    // 사용자가 없으면 기본값 사용
    const userData = user || {
      id: supabaseUser.id,
      is_premium: false,
      premium_expires_at: null,
    };

    // 3. 활성 구독 조회 (모든 결제 수단 확인: 카드, 페이, 토스, 프로모션 코드 등)
    const { data: activeSubscriptions, error: subError } = await serviceSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = 결과 없음 (에러가 아님)
      console.error('❌ 구독 조회 실패:', subError);
    }

    // 프리미엄 만료 시간 확인
    const now = new Date();
    const premiumExpiresAt = userData.premium_expires_at ? new Date(userData.premium_expires_at) : null;
    
    // 만료일이 지났는지 확인 (시간대 문제 방지를 위해 UTC 기준으로 비교)
    const isPremiumExpired = premiumExpiresAt 
      ? premiumExpiresAt.getTime() <= now.getTime()
      : false;

    // 구독 만료 확인 및 업데이트 (모든 활성 구독의 current_period_end 체크)
    let validSubscription = null;
    let expiredSubscriptionIds: string[] = [];

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      for (const sub of activeSubscriptions) {
        const periodEnd = new Date(sub.current_period_end);
        if (periodEnd.getTime() <= now.getTime()) {
          // 구독 기간이 만료됨
          expiredSubscriptionIds.push(sub.id);
          console.log(`⚠️ 구독 만료됨: ${sub.id} (결제 수단: ${sub.payment_method || 'unknown'})`);
        } else {
          // 유효한 구독 (가장 최근 구독을 사용)
          if (!validSubscription) {
            validSubscription = sub;
          }
        }
      }
    }

    // 만료된 구독들을 inactive로 업데이트 (모든 결제 수단에 적용)
    if (expiredSubscriptionIds.length > 0) {
      console.log(`⚠️ 만료된 구독 ${expiredSubscriptionIds.length}개를 inactive로 업데이트 중...`);
      const { error: updateSubError } = await serviceSupabase
        .from('subscriptions')
        .update({ 
          status: 'inactive',
          updated_at: now.toISOString()
        })
        .in('id', expiredSubscriptionIds);

      if (updateSubError) {
        console.error('❌ 구독 상태 업데이트 실패:', updateSubError);
      } else {
        console.log(`✅ 구독 상태 업데이트 완료 (${expiredSubscriptionIds.length}개 inactive로 변경)`);
      }
    }

    let subscriptionInfo: SubscriptionInfo | null = null;

    if (validSubscription) {
      const nextBillingDate =
        validSubscription.status === 'active' && !validSubscription.cancelled_at
          ? validSubscription.current_period_end
          : null;

      // 결제 수단 포맷팅 (null 값 처리)
      const paymentMethodDisplay = validSubscription.payment_method && validSubscription.last_four_digits
        ? `${validSubscription.payment_method} (${validSubscription.last_four_digits})`
        : validSubscription.payment_method || '등록되지 않음';

      subscriptionInfo = {
        id: validSubscription.id,
        status: validSubscription.status,
        planType: validSubscription.plan_type,
        currentPeriodStart: validSubscription.current_period_start,
        currentPeriodEnd: validSubscription.current_period_end,
        pricePerMonth: validSubscription.price_per_month || 0,
        totalPaid: validSubscription.total_paid || 0,
        nextBillingDate,
        paymentMethod: paymentMethodDisplay,
        lastFourDigits: validSubscription.last_four_digits || '',
        cancelledAt: validSubscription.cancelled_at,
        isTestMode: validSubscription.is_test_mode || false,
      };
    }

    // 프리미엄 활성 여부 결정: premium_expires_at 또는 활성 구독이 있어야 함
    const hasActiveSubscription = validSubscription !== null;
    const isPremiumActive = userData.is_premium && !isPremiumExpired && (hasActiveSubscription || !premiumExpiresAt);

    // 만료일이 지났거나 활성 구독이 없는데 is_premium이 true로 남아있으면 자동으로 false로 업데이트
    if ((isPremiumExpired || !hasActiveSubscription) && userData.is_premium && premiumExpiresAt) {
      console.log('⚠️ 프리미엄 만료됨 - is_premium 플래그 및 user_subscriptions 자동 업데이트');
      
      // users 테이블 업데이트
      const { error: updateError } = await serviceSupabase
        .from('users')
        .update({ is_premium: false })
        .eq('id', userData.id);

      if (updateError) {
        console.error('❌ is_premium 플래그 업데이트 실패:', updateError);
      } else {
        console.log('✅ is_premium 플래그 업데이트 완료 (false로 변경)');
      }

      // user_subscriptions 테이블 업데이트 (free 플랜으로 변경)
      const { error: userSubError } = await serviceSupabase
        .from('user_subscriptions')
        .upsert({
          user_id: userData.id,
          subscription_plan: 'free',
          is_active: false,
        }, {
          onConflict: 'user_id'
        });

      if (userSubError) {
        console.error('❌ user_subscriptions 업데이트 실패:', userSubError);
      } else {
        console.log('✅ user_subscriptions 업데이트 완료 (free 플랜으로 변경)');
      }
    }

    console.log('✅ 구독 정보 조회 성공');
    console.log('프리미엄 상태:', userData.is_premium);
    console.log('프리미엄 만료일:', premiumExpiresAt);
    console.log('프리미엄 만료 여부:', isPremiumExpired);
    console.log('활성 구독 존재:', hasActiveSubscription);
    console.log('만료된 구독 수:', expiredSubscriptionIds.length);
    console.log('프리미엄 활성화 여부:', isPremiumActive);
    console.groupEnd();

    return {
      success: true,
      isPremium: isPremiumActive,
      subscription: subscriptionInfo,
      premiumExpiresAt: userData.premium_expires_at,
    };
  } catch (error) {
    console.error('❌ 구독 정보 조회 오류:', error);
    console.groupEnd();
    return {
      success: false,
      isPremium: false,
      subscription: null,
      premiumExpiresAt: null,
      error: error instanceof Error ? error.message : '구독 정보 조회에 실패했습니다.',
    };
  }
}
























