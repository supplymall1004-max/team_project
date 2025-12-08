/**
 * @file api/payments/activate-premium-from-promo/route.ts
 * @description 프로모션 코드(무료 체험)로 프리미엄 활성화 API 라우트
 */

import { NextRequest, NextResponse } from 'next/server';
import { activatePremiumFromPromo } from '@/actions/payments/activate-premium-from-promo';

export async function POST(request: NextRequest) {
  console.group('[API][ActivatePremiumFromPromo] 프리미엄 활성화');
  
  try {
    const body = await request.json();
    const { promoCodeId, freeTrialDays } = body;

    if (!promoCodeId || !freeTrialDays) {
      console.log('❌ 잘못된 요청');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '프로모션 코드 ID와 무료 체험 일수가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await activatePremiumFromPromo({
      promoCodeId,
      freeTrialDays,
    });

    if (result.success) {
      console.log('✅ 프리미엄 활성화 성공');
      console.groupEnd();
      return NextResponse.json(result);
    } else {
      console.error('❌ 프리미엄 활성화 실패:', result.error);
      console.groupEnd();
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('❌ 프리미엄 활성화 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '프리미엄 활성화에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

