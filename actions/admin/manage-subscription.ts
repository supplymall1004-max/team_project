'use server';

/**
 * @file manage-subscription.ts
 * @description 관리자용 구독 제어 Server Action
 */

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface GrantPremiumRequest {
  userId: string;
  planType: 'monthly' | 'yearly';
  durationDays?: number; // 기본값: 월간=30, 연간=365
}

export interface GrantPremiumResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 관리자: 사용자에게 프리미엄 권한 부여 (무료)
 */
export async function grantPremiumAccess(
  request: GrantPremiumRequest
): Promise<GrantPremiumResponse> {
  console.group('[AdminGrantPremium] 프리미엄 부여');
  console.log('대상 사용자 ID:', request.userId);
  console.log('플랜:', request.planType);

  try {
    // 1. 관리자 권한 확인
    const { userId: adminUserId } = await auth();
    if (!adminUserId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // TODO: 실제 프로덕션에서는 Clerk 역할 확인 필요
    // const { sessionClaims } = await auth();
    // if (sessionClaims?.metadata?.role !== 'admin') {
    //   return { success: false, error: '관리자 권한이 필요합니다.' };
    // }

    const supabase = getServiceRoleClient();

    // 2. 대상 사용자 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, name')
      .eq('id', request.userId)
      .single();

    if (userError || !targetUser) {
      console.error('❌ 사용자 조회 실패:', userError);
      console.groupEnd();
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    // 3. 구독 기간 계산
    const now = new Date();
    const periodEnd = new Date(now);
    const durationDays = request.durationDays || (request.planType === 'monthly' ? 30 : 365);
    periodEnd.setDate(periodEnd.getDate() + durationDays);

    const pricePerMonth = request.planType === 'monthly' ? 9900 : 7900;

    // 4. 구독 레코드 생성 (관리자 부여는 무료)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: targetUser.id,
        status: 'active',
        plan_type: request.planType,
        billing_key: null,
        payment_method: 'admin_granted',
        last_four_digits: '0000',
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        price_per_month: pricePerMonth,
        total_paid: 0,
        is_test_mode: true,
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ 구독 생성 실패:', subError);
      console.groupEnd();
      return { success: false, error: '구독 생성에 실패했습니다.' };
    }

    console.log('✅ 구독 생성 완료:', subscription.id);

    // 5. 사용자 프리미엄 상태 활성화
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: periodEnd.toISOString(),
      })
      .eq('id', targetUser.id);

    if (userUpdateError) {
      console.error('❌ 사용자 프리미엄 상태 업데이트 실패:', userUpdateError);
    }

    console.log('✅ 프리미엄 부여 완료');
    console.groupEnd();

    return {
      success: true,
      message: `${targetUser.name || '사용자'}에게 ${durationDays}일 프리미엄 권한이 부여되었습니다.`,
    };
  } catch (error) {
    console.error('❌ 프리미엄 부여 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '프리미엄 부여에 실패했습니다.',
    };
  }
}

/**
 * 관리자: 사용자 프리미엄 권한 취소
 */
export async function revokePremiumAccess(userId: string): Promise<GrantPremiumResponse> {
  console.group('[AdminRevokePremium] 프리미엄 취소');
  console.log('대상 사용자 ID:', userId);

  try {
    const { userId: adminUserId } = await auth();
    if (!adminUserId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 1. 활성 구독 취소
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (subError) {
      console.error('❌ 구독 취소 실패:', subError);
    }

    // 2. 사용자 프리미엄 상태 비활성화
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_premium: false,
        premium_expires_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('❌ 사용자 상태 업데이트 실패:', userUpdateError);
      console.groupEnd();
      return { success: false, error: '프리미엄 취소에 실패했습니다.' };
    }

    console.log('✅ 프리미엄 취소 완료');
    console.groupEnd();

    return {
      success: true,
      message: '사용자의 프리미엄 권한이 취소되었습니다.',
    };
  } catch (error) {
    console.error('❌ 프리미엄 취소 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '프리미엄 취소에 실패했습니다.',
    };
  }
}










