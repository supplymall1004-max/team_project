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
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('❌ 요청 본문 파싱 오류:', error);
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }

    const { code } = body;

    console.log('📥 요청 본문:', body);
    console.log('📥 입력된 코드:', code);

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
    let user;
    try {
      user = await ensureSupabaseUser();
      
      if (!user) {
        console.error('❌ 사용자 정보를 찾을 수 없거나 생성할 수 없습니다.');
        try {
          console.groupEnd();
        } catch {
          // groupEnd 실패 무시
        }
        return NextResponse.json(
          { 
            success: false, 
            valid: false, 
            error: '사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.' 
          },
          { status: 404 }
        );
      }
      
      console.log('✅ 사용자 확인 완료:', user.id);
    } catch (error) {
      console.error('❌ 사용자 조회 오류:', error);
      console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
      console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
      
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      
      return NextResponse.json(
        { 
          success: false, 
          valid: false, 
          error: '사용자 정보를 확인하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        },
        { status: 500 }
      );
    }

    // 4. 프로모션 코드 조회 (Service Role 클라이언트 사용 - RLS 우회)
    // 프로모션 코드는 공개 데이터이므로 Service Role로 조회
    let serviceSupabase;
    try {
      serviceSupabase = getServiceRoleClient();
    } catch (error) {
      console.error('❌ Service Role 클라이언트 생성 실패:', error);
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return NextResponse.json({
        success: false,
        valid: false,
        error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.',
      }, { status: 500 });
    }
    
    // 코드 정규화: 대문자 변환 (생성 시와 동일한 방식)
    // 생성 시: validatedInput.code는 z.string().transform(val => val.toUpperCase())로 변환됨
    // 검증 시: 사용자 입력에서 공백이 포함될 수 있으므로 trim() 추가
    const normalizedCode = code.toUpperCase().trim();
    console.log('🔍 원본 코드:', code);
    console.log('🔍 정규화된 코드:', normalizedCode);
    
    // 프로모션 코드 조회 (Service Role 클라이언트 사용)
    let promoCode;
    let fetchError;
    
    try {
      const result = await serviceSupabase
        .from('promo_codes')
        .select('*')
        .eq('code', normalizedCode)
        .maybeSingle();
      
      promoCode = result.data;
      fetchError = result.error;
    } catch (error) {
      console.error('❌ 프로모션 코드 조회 중 예외 발생:', error);
      console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return NextResponse.json({
        success: false,
        valid: false,
        error: '프로모션 코드 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }, { status: 500 });
    }
    
    // Service Role 클라이언트를 사용자별 체크에도 사용 (RLS 우회)
    // RLS가 비활성화되어 있어도 일관성을 위해 Service Role 사용
    const supabase = serviceSupabase;

    if (fetchError) {
      // .maybeSingle()을 사용하면 결과가 없을 때는 에러가 아닌 null을 반환하지만,
      // 다른 데이터베이스 오류는 여전히 발생할 수 있음
      console.error('❌ 데이터베이스 조회 오류:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        normalizedCode: normalizedCode,
      });
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return NextResponse.json({
        success: false,
        valid: false,
        error: `데이터베이스 오류: ${fetchError.message}`,
      }, { status: 500 });
    }

    if (!promoCode) {
      console.log('❌ 코드를 찾을 수 없음 (데이터 없음)');
      console.log('💡 검색한 코드:', normalizedCode);
      console.groupEnd();
      return NextResponse.json({
        success: false,
        valid: false,
        error: `유효하지 않은 프로모션 코드입니다.`,
      });
    }

    console.log('✅ 프로모션 코드 조회 성공:', {
      id: promoCode.id,
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      valid_from: promoCode.valid_from,
      valid_until: promoCode.valid_until,
    });

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
        error: '프로모션 코드 사용 가능 횟수를 초과했습니다. 사용 횟수가 마감된 쿠폰은 삭제 후 다시 사용할 수 없습니다.',
      });
    }

    // 6-1. 이미 사용한 코드인지 체크
    const { data: existingUse } = await serviceSupabase
      .from('promo_code_uses')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingUse) {
      console.log('❌ 이미 사용한 코드');
      console.groupEnd();
      return NextResponse.json({
        success: false,
        valid: false,
        error: '이미 사용한 프로모션 코드입니다. 사용 횟수가 마감된 쿠폰은 삭제 후 다시 사용할 수 없습니다.',
      });
    }

    // 7. 신규 사용자 전용 체크 (Service Role 클라이언트 사용)
    if (promoCode.new_users_only) {
      try {
        const { data: existingSub, error: subError } = await serviceSupabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (subError) {
          console.error('❌ 구독 조회 오류:', subError);
          console.error('에러 상세:', {
            code: subError.code,
            message: subError.message,
            details: subError.details,
            hint: subError.hint,
            userId: user.id,
            userIdType: typeof user.id,
          });
          // 오류가 발생해도 계속 진행 (신규 사용자로 간주)
        } else if (existingSub) {
          console.log('❌ 신규 사용자 전용');
          try {
            console.groupEnd();
          } catch {
            // groupEnd 실패 무시
          }
          return NextResponse.json({
            success: false,
            valid: false,
            error: '신규 사용자만 사용 가능한 프로모션 코드입니다.',
          });
        }
      } catch (error) {
        console.error('❌ 신규 사용자 체크 중 오류:', error);
        console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
        // 오류가 발생해도 계속 진행
      }
    }

    // 8. 이미 사용한 코드인지 체크 (Service Role 클라이언트 사용)
    try {
      const { data: existingUse, error: useError } = await serviceSupabase
        .from('promo_code_uses')
        .select('id')
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (useError && useError.code !== 'PGRST116') {
        console.error('❌ 프로모션 코드 사용 내역 조회 오류:', useError);
        console.error('에러 상세:', {
          code: useError.code,
          message: useError.message,
          details: useError.details,
          hint: useError.hint,
          promoCodeId: promoCode.id,
          promoCodeIdType: typeof promoCode.id,
          userId: user.id,
          userIdType: typeof user.id,
        });
        // 오류가 발생해도 계속 진행 (사용하지 않은 것으로 간주)
      } else if (existingUse) {
        console.log('❌ 이미 사용한 코드');
        try {
          console.groupEnd();
        } catch {
          // groupEnd 실패 무시
        }
        return NextResponse.json({
          success: false,
          valid: false,
          error: '이미 사용한 프로모션 코드입니다.',
        });
      }
    } catch (error) {
      console.error('❌ 프로모션 코드 사용 내역 체크 중 오류:', error);
      console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
      // 오류가 발생해도 계속 진행
    }

    // 9. 할인 정보 반환
    console.log('✅ 코드 검증 성공');
    console.log('할인 정보:', {
      type: promoCode.discount_type,
      value: promoCode.discount_value,
      applicablePlans: promoCode.applicable_plans,
      description: promoCode.description,
    });
    console.groupEnd();

    return NextResponse.json({
      success: true,
      valid: true,
      promoCodeId: promoCode.id,
      discountType: promoCode.discount_type,
      discountValue: promoCode.discount_value,
      description: promoCode.description,
      applicablePlans: promoCode.applicable_plans,
      freeTrialDays: promoCode.discount_type === 'free_trial' ? promoCode.discount_value : undefined,
    });
  } catch (error) {
    console.error('❌ 프로모션 코드 검증 오류:', error);
    console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
    console.groupEnd();
    
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: error instanceof Error 
          ? `프로모션 코드 검증 중 오류가 발생했습니다: ${error.message}` 
          : '프로모션 코드 검증 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

