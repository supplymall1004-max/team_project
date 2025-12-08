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

    // 3. 활성 구독 조회 (Service Role 클라이언트 사용)
    const { data: subscription, error: subError } = await serviceSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = 결과 없음 (에러가 아님)
      console.error('❌ 구독 조회 실패:', subError);
    }

    let subscriptionInfo: SubscriptionInfo | null = null;

    if (subscription) {
      const nextBillingDate =
        subscription.status === 'active' && !subscription.cancelled_at
          ? subscription.current_period_end
          : null;

      // 결제 수단 포맷팅 (null 값 처리)
      const paymentMethodDisplay = subscription.payment_method && subscription.last_four_digits
        ? `${subscription.payment_method} (${subscription.last_four_digits})`
        : subscription.payment_method || '등록되지 않음';

      subscriptionInfo = {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.plan_type,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        pricePerMonth: subscription.price_per_month || 0,
        totalPaid: subscription.total_paid || 0,
        nextBillingDate,
        paymentMethod: paymentMethodDisplay,
        lastFourDigits: subscription.last_four_digits || '',
        cancelledAt: subscription.cancelled_at,
        isTestMode: subscription.is_test_mode || false,
      };
    }

    // 프리미엄 만료 시간 확인
    const now = new Date();
    const premiumExpiresAt = userData.premium_expires_at ? new Date(userData.premium_expires_at) : null;
    const isPremiumActive = userData.is_premium && (!premiumExpiresAt || premiumExpiresAt > now);

    console.log('✅ 구독 정보 조회 성공');
    console.log('프리미엄 상태:', userData.is_premium);
    console.log('프리미엄 만료일:', premiumExpiresAt);
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
























