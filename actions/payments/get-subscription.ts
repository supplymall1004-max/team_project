'use server';

/**
 * @file get-subscription.ts
 * @description 구독 정보 조회 Server Action
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

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
 * 개발 환경에서는 모든 사용자에게 프리미엄 기능을 임시로 허용합니다.
 */
export async function getCurrentSubscription(): Promise<GetSubscriptionResponse> {
  console.group('[GetSubscription] 구독 정보 조회');

  try {
    // 개발 환경에서는 모든 사용자에게 프리미엄 기능 허용
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 개발 모드: 모든 사용자에게 프리미엄 기능 허용');
      console.groupEnd();
      return {
        success: true,
        isPremium: true,
        subscription: null,
        premiumExpiresAt: null,
      };
    }

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

    const supabase = await createClerkSupabaseClient();

    // 2. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_premium, premium_expires_at')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ 사용자 조회 실패:', userError);
      console.groupEnd();
      return {
        success: false,
        isPremium: false,
        subscription: null,
        premiumExpiresAt: null,
        error: '사용자 정보를 찾을 수 없습니다.',
      };
    }

    // 3. 활성 구독 조회
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

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

      subscriptionInfo = {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.plan_type,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        pricePerMonth: subscription.price_per_month,
        totalPaid: subscription.total_paid,
        nextBillingDate,
        paymentMethod: `${subscription.payment_method} (${subscription.last_four_digits})`,
        lastFourDigits: subscription.last_four_digits,
        cancelledAt: subscription.cancelled_at,
        isTestMode: subscription.is_test_mode,
      };
    }

    console.log('✅ 구독 정보 조회 성공');
    console.log('프리미엄 상태:', user.is_premium);
    console.groupEnd();

    return {
      success: true,
      isPremium: user.is_premium || false,
      subscription: subscriptionInfo,
      premiumExpiresAt: user.premium_expires_at,
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
























