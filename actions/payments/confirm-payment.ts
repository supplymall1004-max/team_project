'use server';

/**
 * @file confirm-payment.ts
 * @description 결제 승인 처리 Server Action
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getMockTossClient, generateMockPaymentKey } from '@/lib/payments/mock-toss-client';
import { recordPromoCodeUse } from '@/lib/payments/promo-code-validator';

export interface ConfirmPaymentRequest {
  orderId: string;
  userId: string;
  planType: 'monthly' | 'yearly';
  amount: number;
  promoCodeId?: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

/**
 * 결제 승인 및 구독 활성화
 */
export async function confirmPayment(
  request: ConfirmPaymentRequest
): Promise<ConfirmPaymentResponse> {
  console.group('[ConfirmPayment] 결제 승인 처리');
  console.log('요청:', request);

  const supabase = await createClerkSupabaseClient();

  try {
    // 1. Mock 결제 승인 요청
    const tossClient = getMockTossClient();
    const paymentKey = generateMockPaymentKey();

    const confirmResult = await tossClient.confirmPayment({
      paymentKey,
      orderId: request.orderId,
      amount: request.amount,
    });

    if (confirmResult.status !== 'DONE') {
      console.log('❌ 결제 실패:', confirmResult.status);
      console.groupEnd();
      return { success: false, error: '결제가 실패했습니다. 다시 시도해주세요.' };
    }

    // 2. 빌링키 발급 (정기결제용)
    const billingKeyResult = await tossClient.issueBillingKey({
      customerKey: request.userId,
      authKey: paymentKey,
    });

    // 3. 구독 기간 계산
    const now = new Date();
    const periodEnd = new Date(now);
    if (request.planType === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const pricePerMonth = request.planType === 'monthly' ? request.amount : Math.floor(request.amount / 12);

    // 4. 구독 레코드 생성
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: request.userId,
        status: 'active',
        plan_type: request.planType,
        billing_key: billingKeyResult.billingKey,
        payment_method: 'card',
        last_four_digits: billingKeyResult.cardInfo.lastFourDigits,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        price_per_month: pricePerMonth,
        total_paid: request.amount,
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

    // 5. 결제 내역 생성
    const { error: txError } = await supabase.from('payment_transactions').insert({
      subscription_id: subscription.id,
      user_id: request.userId,
      status: 'completed',
      transaction_type: 'subscription',
      pg_provider: 'toss_payments',
      pg_transaction_id: confirmResult.paymentKey,
      amount: request.amount,
      tax_amount: 0,
      net_amount: request.amount,
      payment_method: 'card',
      card_info: {
        issuer: billingKeyResult.cardInfo.issuer,
        last_four: billingKeyResult.cardInfo.lastFourDigits,
        type: billingKeyResult.cardInfo.cardType,
      },
      paid_at: confirmResult.approvedAt,
      metadata: {
        order_id: request.orderId,
        promo_code_id: request.promoCodeId || null,
      },
      is_test_mode: true,
    });

    if (txError) {
      console.error('❌ 결제 내역 생성 실패:', txError);
    }

    // 6. 사용자 프리미엄 상태 활성화
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: periodEnd.toISOString(),
      })
      .eq('id', request.userId);

    if (userUpdateError) {
      console.error('❌ 사용자 프리미엄 상태 업데이트 실패:', userUpdateError);
    }

    // 6-1. user_subscriptions 테이블 업데이트 (가족 구성원 관리용)
    // 프리미엄 결제는 'premium' 플랜으로 매핑
    const { error: userSubError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: request.userId,
        subscription_plan: 'premium',
        started_at: now.toISOString(),
        expires_at: periodEnd.toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id'
      });

    if (userSubError) {
      console.error('❌ user_subscriptions 업데이트 실패:', userSubError);
      // 에러가 발생해도 결제는 성공했으므로 계속 진행
    } else {
      console.log('✅ user_subscriptions 업데이트 완료 (premium 플랜)');
    }

    // 7. 프로모션 코드 사용 기록
    if (request.promoCodeId) {
      try {
        await recordPromoCodeUse(request.promoCodeId, request.userId, subscription.id);
      } catch (error) {
        console.error('⚠️ 프로모션 코드 사용 기록 실패:', error);
        // 결제는 성공했으므로 계속 진행
      }
    }

    console.log('✅ 결제 승인 완료');
    console.groupEnd();

    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error('❌ 결제 승인 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '결제 승인에 실패했습니다.',
    };
  }
}
























