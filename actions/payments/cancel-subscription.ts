'use server';

/**
 * @file cancel-subscription.ts
 * @description 구독 취소 Server Action
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  reason?: string;
  immediate?: boolean; // true: 즉시 해지, false: 기간 종료 시 해지
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message?: string;
  cancelledAt?: string;
  error?: string;
}

/**
 * 구독 취소
 */
export async function cancelSubscription(
  request: CancelSubscriptionRequest
): Promise<CancelSubscriptionResponse> {
  console.group('[CancelSubscription] 구독 취소');
  console.log('요청:', request);

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const supabase = await createClerkSupabaseClient();

    // 2. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ 사용자 조회 실패:', userError);
      console.groupEnd();
      return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
    }

    // 3. 구독 정보 조회 (본인 소유 확인)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', request.subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      console.error('❌ 구독 조회 실패:', subError);
      console.groupEnd();
      return { success: false, error: '구독 정보를 찾을 수 없습니다.' };
    }

    if (subscription.status === 'cancelled') {
      console.log('⚠️ 이미 취소된 구독');
      console.groupEnd();
      return { success: false, error: '이미 취소된 구독입니다.' };
    }

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    // 4. 즉시 해지 vs 기간 종료 시 해지
    if (request.immediate) {
      // 즉시 해지: 상태를 cancelled로 변경하고 프리미엄 비활성화
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
        })
        .eq('id', request.subscriptionId);

      if (updateError) {
        console.error('❌ 구독 업데이트 실패:', updateError);
        console.groupEnd();
        return { success: false, error: '구독 취소에 실패했습니다.' };
      }

      // 사용자 프리미엄 상태 즉시 해제
      await supabase
        .from('users')
        .update({
          is_premium: false,
          premium_expires_at: now.toISOString(),
        })
        .eq('id', user.id);

      console.log('✅ 즉시 해지 완료');
      console.groupEnd();

      return {
        success: true,
        message: '구독이 즉시 취소되었습니다.',
        cancelledAt: now.toISOString(),
      };
    } else {
      // 기간 종료 시 해지: cancelled_at만 기록하고 상태는 유지
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancelled_at: now.toISOString(),
        })
        .eq('id', request.subscriptionId);

      if (updateError) {
        console.error('❌ 구독 업데이트 실패:', updateError);
        console.groupEnd();
        return { success: false, error: '구독 취소에 실패했습니다.' };
      }

      const periodEndDate = periodEnd.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      console.log('✅ 기간 종료 시 해지 예약 완료');
      console.groupEnd();

      return {
        success: true,
        message: `구독이 ${periodEndDate}에 종료됩니다. 그 전까지는 프리미엄 혜택을 계속 이용하실 수 있습니다.`,
        cancelledAt: periodEnd.toISOString(),
      };
    }
  } catch (error) {
    console.error('❌ 구독 취소 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '구독 취소에 실패했습니다.',
    };
  }
}

/**
 * 구독 재활성화 (취소 철회)
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<CancelSubscriptionResponse> {
  console.group('[ReactivateSubscription] 구독 재활성화');
  console.log('구독 ID:', subscriptionId);

  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const supabase = await createClerkSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      console.groupEnd();
      return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
    }

    // 구독 정보 조회
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      console.error('❌ 구독 조회 실패:', subError);
      console.groupEnd();
      return { success: false, error: '구독 정보를 찾을 수 없습니다.' };
    }

    // cancelled_at만 있고 status가 still active인 경우에만 재활성화 가능
    if (subscription.status === 'cancelled') {
      console.log('❌ 이미 만료된 구독은 재활성화할 수 없습니다.');
      console.groupEnd();
      return { success: false, error: '이미 만료된 구독은 재활성화할 수 없습니다.' };
    }

    if (!subscription.cancelled_at) {
      console.log('⚠️ 취소되지 않은 구독');
      console.groupEnd();
      return { success: false, error: '취소되지 않은 구독입니다.' };
    }

    // cancelled_at 제거 (재활성화)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancelled_at: null,
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('❌ 구독 업데이트 실패:', updateError);
      console.groupEnd();
      return { success: false, error: '구독 재활성화에 실패했습니다.' };
    }

    console.log('✅ 구독 재활성화 완료');
    console.groupEnd();

    return {
      success: true,
      message: '구독이 다시 활성화되었습니다.',
    };
  } catch (error) {
    console.error('❌ 구독 재활성화 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '구독 재활성화에 실패했습니다.',
    };
  }
}
























