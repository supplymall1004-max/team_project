'use server';

/**
 * @file activate-premium-from-promo.ts
 * @description 프로모션 코드(무료 체험)로 프리미엄 활성화 Server Action
 * 
 * 무료 체험 쿠폰을 등록했을 때 자동으로 프리미엄을 활성화합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';

export interface ActivatePremiumFromPromoRequest {
  promoCodeId: string;
  freeTrialDays: number;
}

export interface ActivatePremiumFromPromoResponse {
  success: boolean;
  message?: string;
  error?: string;
  expiresAt?: string;
}

/**
 * 프로모션 코드(무료 체험)로 프리미엄 활성화
 */
export async function activatePremiumFromPromo(
  request: ActivatePremiumFromPromoRequest
): Promise<ActivatePremiumFromPromoResponse> {
  console.group('[ActivatePremiumFromPromo] 프리미엄 활성화');
  console.log('요청:', request);

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 2. 사용자 확인 및 Supabase user ID 가져오기
    const user = await ensureSupabaseUser();
    
    if (!user) {
      console.error('❌ 사용자 정보를 찾을 수 없거나 생성할 수 없습니다.');
      console.groupEnd();
      return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
    }
    
    console.log('✅ 사용자 확인 완료:', user.id);
    const supabaseUserId = user.id;

    // Service Role 클라이언트 사용 (RLS 우회)
    const serviceSupabase = getServiceRoleClient();

    // 3. 프로모션 코드 확인
    const { data: promoCode, error: promoError } = await serviceSupabase
      .from('promo_codes')
      .select('id, code, discount_type, discount_value, description')
      .eq('id', request.promoCodeId)
      .single();

    if (promoError || !promoCode) {
      console.error('❌ 프로모션 코드 조회 실패:', promoError);
      console.groupEnd();
      return { success: false, error: '프로모션 코드를 찾을 수 없습니다.' };
    }

    // 무료 체험 쿠폰인지 확인
    if (promoCode.discount_type !== 'free_trial') {
      console.log('⚠️ 무료 체험 쿠폰이 아님:', promoCode.discount_type);
      console.groupEnd();
      return { success: false, error: '이 쿠폰은 무료 체험 쿠폰이 아닙니다.' };
    }

    // 4. 이미 사용한 쿠폰인지 확인
    const { data: existingUse } = await serviceSupabase
      .from('promo_code_uses')
      .select('id')
      .eq('promo_code_id', request.promoCodeId)
      .eq('user_id', supabaseUserId)
      .maybeSingle();

    if (existingUse) {
      console.log('⚠️ 이미 사용한 쿠폰');
      console.groupEnd();
      return { success: false, error: '이미 사용한 프로모션 코드입니다.' };
    }

    // 5. 기간 계산
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + request.freeTrialDays);

    // 6. 구독 레코드 생성 (무료 체험)
    const { data: subscription, error: subError } = await serviceSupabase
      .from('subscriptions')
      .insert({
        user_id: supabaseUserId,
        status: 'active',
        plan_type: 'monthly', // 무료 체험은 월간 플랜으로 처리
        billing_key: null,
        payment_method: 'promo_code',
        last_four_digits: null,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        price_per_month: 0,
        total_paid: 0,
        is_test_mode: true,
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('❌ 구독 생성 실패:', subError);
      console.groupEnd();
      return { success: false, error: '구독 생성에 실패했습니다.' };
    }

    console.log('✅ 구독 생성 완료:', subscription.id);

    // 7. 사용자 프리미엄 상태 활성화
    const { error: userUpdateError } = await serviceSupabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString(),
        trial_ends_at: expiresAt.toISOString(),
      })
      .eq('id', supabaseUserId);

    if (userUpdateError) {
      console.error('❌ 사용자 프리미엄 상태 업데이트 실패:', userUpdateError);
      console.groupEnd();
      return { success: false, error: '프리미엄 상태 업데이트에 실패했습니다.' };
    }

    // 8. user_subscriptions 테이블 업데이트
    const { error: userSubError } = await serviceSupabase
      .from('user_subscriptions')
      .upsert({
        user_id: supabaseUserId,
        subscription_plan: 'premium',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id'
      });

    if (userSubError) {
      console.error('❌ user_subscriptions 업데이트 실패:', userSubError);
      // 에러가 발생해도 프리미엄 활성화는 완료되었으므로 계속 진행
    }

    // 9. 프로모션 코드 사용 기록
    const { error: useRecordError } = await serviceSupabase
      .from('promo_code_uses')
      .insert({
        promo_code_id: request.promoCodeId,
        user_id: supabaseUserId,
        subscription_id: subscription.id,
      });

    if (useRecordError) {
      console.error('⚠️ 프로모션 코드 사용 기록 실패:', useRecordError);
      // 에러가 발생해도 프리미엄 활성화는 완료되었으므로 계속 진행
    }

    // 10. 프로모션 코드 사용 횟수 증가
    const { error: incrementError } = await serviceSupabase
      .rpc('increment_promo_code_uses', {
        promo_code_id_param: request.promoCodeId,
      });

    if (incrementError) {
      console.error('⚠️ 프로모션 코드 사용 횟수 증가 실패:', incrementError);
      // 에러가 발생해도 프리미엄 활성화는 완료되었으므로 계속 진행
    }

    console.log('✅ 프리미엄 활성화 완료');
    console.log('만료일:', expiresAt.toISOString());
    console.groupEnd();

    return {
      success: true,
      message: `${request.freeTrialDays}일 무료 체험이 활성화되었습니다!`,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('❌ 프리미엄 활성화 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '프리미엄 활성화에 실패했습니다.',
    };
  }
}

