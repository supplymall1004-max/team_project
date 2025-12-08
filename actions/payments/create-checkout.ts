'use server';

/**
 * @file create-checkout.ts
 * @description 결제 세션 생성 Server Action
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getMockTossClient, generateOrderId } from '@/lib/payments/mock-toss-client';
import { validatePromoCode } from '@/lib/payments/promo-code-validator';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';

export interface CreateCheckoutRequest {
  planType: 'monthly' | 'yearly';
  promoCode?: string;
}

export interface CreateCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  orderId?: string;
  amount?: number;
  finalAmount?: number;
  discountApplied?: {
    code: string;
    discountValue: number;
    description: string;
  };
  error?: string;
}

/**
 * 결제 세션 생성
 */
export async function createCheckout(
  request: CreateCheckoutRequest
): Promise<CreateCheckoutResponse> {
  console.group('[CreateCheckout] 결제 세션 생성');
  console.log('요청:', request);

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 2. 사용자 정보 조회 (없으면 자동 생성)
    const user = await ensureSupabaseUser();
    
    if (!user) {
      console.error('❌ 사용자 정보를 찾을 수 없거나 생성할 수 없습니다.');
      console.groupEnd();
      return { success: false, error: '사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.' };
    }
    
    console.log('✅ 사용자 확인 완료:', user.id);
    
    const supabase = await createClerkSupabaseClient();

    // 3. 가격 계산
    const basePrice = request.planType === 'monthly' ? 9900 : 94800;
    let finalAmount = basePrice;
    let promoData: { code: string; id: string; discountValue: number; description: string } | null = null;

    // 4. 프로모션 코드 검증 (있을 경우)
    if (request.promoCode) {
      const validation = await validatePromoCode(
        request.promoCode,
        request.planType,
        user.id
      );

      if (!validation.valid) {
        console.log('❌ 프로모션 코드 검증 실패:', validation.error);
        console.groupEnd();
        return { success: false, error: validation.error };
      }

      if (validation.finalPrice !== undefined) {
        finalAmount = validation.finalPrice;
      }

      // 프로모션 코드 ID 조회
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('id, code, description, discount_value')
        .eq('code', request.promoCode.toUpperCase())
        .single();

      if (promo) {
        promoData = {
          code: promo.code,
          id: promo.id,
          discountValue: basePrice - finalAmount,
          description: promo.description || '',
        };
      }
    }

    // 5. 주문 ID 생성
    const orderId = generateOrderId(user.id);

    // 6. Mock 결제 클라이언트로 결제창 URL 생성
    const tossClient = getMockTossClient();
    const paymentResponse = await tossClient.createPayment({
      orderId,
      amount: finalAmount,
      orderName: `맛의 아카이브 ${request.planType === 'monthly' ? '월간' : '연간'} 프리미엄`,
      customerName: user.name || '사용자',
      customerEmail: '', // Clerk에서 이메일 가져오기 (선택)
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?orderId=${orderId}`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/fail?orderId=${orderId}`,
    });

    // 7. 주문 정보를 세션에 저장 (또는 DB에 임시 저장)
    // 여기서는 간단히 URL 파라미터로 전달
    const checkoutUrlWithParams = `${paymentResponse.checkoutUrl}&planType=${request.planType}&userId=${user.id}${promoData ? `&promoCodeId=${promoData.id}` : ''}`;

    console.log('✅ 결제 세션 생성 성공');
    console.log('결제 URL:', checkoutUrlWithParams);
    console.groupEnd();

    return {
      success: true,
      checkoutUrl: checkoutUrlWithParams,
      orderId,
      amount: basePrice,
      finalAmount,
      discountApplied: promoData
        ? {
            code: promoData.code,
            discountValue: promoData.discountValue,
            description: promoData.description,
          }
        : undefined,
    };
  } catch (error) {
    console.error('❌ 결제 세션 생성 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '결제 세션 생성에 실패했습니다.',
    };
  }
}
























