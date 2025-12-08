/**
 * @file api/payments/validate-promo-code/route.ts
 * @description 프로모션 코드 검증 API 라우트
 *
 * 주요 기능:
 * 1. 프로모션 코드 유효성 검증
 * 2. 할인 정보 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { validatePromoCode } from "@/lib/payments/promo-code-validator";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

export async function POST(request: NextRequest) {
  console.group('[API][ValidatePromoCode] 프로모션 코드 검증');
  
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      console.log('❌ 잘못된 요청');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '프로모션 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 3. 사용자 ID 조회 (Supabase users 테이블)
    // 사용자가 없으면 자동으로 생성
    const user = await ensureSupabaseUser();
    
    if (!user) {
      console.error('❌ 사용자 정보를 찾을 수 없거나 생성할 수 없습니다.');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.' },
        { status: 404 }
      );
    }
    
    console.log('✅ 사용자 확인 완료:', user.id);

    // 4. 프로모션 코드 조회 (플랜 타입 없이 기본 검증만)
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createClerkSupabaseClient();
    
    const { data: promoCode, error: fetchError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (fetchError || !promoCode) {
      console.log('❌ 코드를 찾을 수 없음');
      console.groupEnd();
      return NextResponse.json({
        success: false,
        valid: false,
        error: '유효하지 않은 프로모션 코드입니다.',
      });
    }

    // 5. 유효 기간 체크
    const now = new Date();
    const validFrom = new Date(promoCode.valid_from);
    const validUntil = new Date(promoCode.valid_until);

    if (now < validFrom || now > validUntil) {
      console.log('❌ 유효 기간 만료');
      console.groupEnd();
      return NextResponse.json({
        success: false,
        valid: false,
        error: '프로모션 코드가 만료되었습니다.',
      });
    }

    // 6. 사용 횟수 체크
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      console.log('❌ 사용 횟수 초과');
      console.groupEnd();
      return NextResponse.json({
        success: false,
        valid: false,
        error: '프로모션 코드 사용 가능 횟수를 초과했습니다.',
      });
    }

    // 7. 신규 사용자 전용 체크
    if (promoCode.new_users_only) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        console.log('❌ 신규 사용자 전용');
        console.groupEnd();
        return NextResponse.json({
          success: false,
          valid: false,
          error: '신규 사용자만 사용 가능한 프로모션 코드입니다.',
        });
      }
    }

    // 8. 이미 사용한 코드인지 체크
    const { data: existingUse } = await supabase
      .from('promo_code_uses')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingUse) {
      console.log('❌ 이미 사용한 코드');
      console.groupEnd();
      return NextResponse.json({
        success: false,
        valid: false,
        error: '이미 사용한 프로모션 코드입니다.',
      });
    }

    // 9. 할인 정보 반환
    console.log('✅ 코드 검증 성공');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      valid: true,
      discountType: promoCode.discount_type,
      discountValue: promoCode.discount_value,
      description: promoCode.description,
      applicablePlans: promoCode.applicable_plans,
      freeTrialDays: promoCode.discount_type === 'free_trial' ? promoCode.discount_value : undefined,
    });
  } catch (error) {
    console.error('❌ 프로모션 코드 검증 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '프로모션 코드 검증 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

