/**
 * @file promo-code-validator.ts
 * @description 프로모션 코드 검증 및 할인 계산
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface PromoCodeValidationResult {
  valid: boolean;
  error?: string;
  discount?: {
    type: "percentage" | "fixed_amount" | "free_trial";
    value: number;
    description: string;
  };
  originalPrice?: number;
  finalPrice?: number;
  freeTrialDays?: number;
}

/**
 * 프로모션 코드 검증
 */
export async function validatePromoCode(
  code: string,
  planType: "monthly" | "yearly",
  userId: string,
): Promise<PromoCodeValidationResult> {
  console.group("[PromoValidator] 코드 검증");
  console.log("코드:", code);
  console.log("플랜:", planType);
  console.log("사용자 ID:", userId);

  const supabase = await createClerkSupabaseClient();
  const serviceSupabase = getServiceRoleClient();

  // 0) 무료 체험 중에는 어떤 프로모션 코드도 적용 불가
  // (요구사항: "14일 무료사용하는 유저는 다른 프로모션 코드를 등록할 수 없음")
  try {
    const { data: user, error: userError } = await serviceSupabase
      .from("users")
      .select("trial_ends_at")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error("⚠️ 사용자 체험 상태 조회 실패 (계속 진행):", userError);
    } else if (user?.trial_ends_at) {
      const trialEndsAt = new Date(user.trial_ends_at);
      if (trialEndsAt.getTime() > Date.now()) {
        console.log(
          "❌ 무료 체험 기간 중 프로모션 코드 차단:",
          user.trial_ends_at,
        );
        console.groupEnd();
        return {
          valid: false,
          error: `무료 체험 기간에는 프로모션 코드를 사용할 수 없습니다. (만료일: ${trialEndsAt.toLocaleDateString(
            "ko-KR",
          )})`,
        };
      }
    }
  } catch (error) {
    console.error("⚠️ 사용자 체험 상태 확인 중 오류 (계속 진행):", error);
  }

  // 1. 프로모션 코드 조회
  const { data: promoCode, error: fetchError } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (fetchError || !promoCode) {
    console.log("❌ 코드를 찾을 수 없음");
    console.groupEnd();
    return { valid: false, error: "유효하지 않은 프로모션 코드입니다." };
  }

  // 2. 유효 기간 체크
  const now = new Date();
  const validFrom = new Date(promoCode.valid_from);
  const validUntil = new Date(promoCode.valid_until);

  if (now < validFrom || now > validUntil) {
    console.log("❌ 유효 기간 만료");
    console.groupEnd();
    return { valid: false, error: "프로모션 코드가 만료되었습니다." };
  }

  // 3. 사용 횟수 체크
  if (
    promoCode.max_uses !== null &&
    promoCode.current_uses >= promoCode.max_uses
  ) {
    console.log("❌ 사용 횟수 초과");
    console.groupEnd();
    return {
      valid: false,
      error: "프로모션 코드 사용 가능 횟수를 초과했습니다.",
    };
  }

  // 4. 적용 가능 플랜 체크
  if (promoCode.applicable_plans && promoCode.applicable_plans.length > 0) {
    if (!promoCode.applicable_plans.includes(planType)) {
      console.log("❌ 플랜 불일치");
      console.groupEnd();
      return {
        valid: false,
        error: "이 플랜에는 적용할 수 없는 프로모션 코드입니다.",
      };
    }
  }

  // 5. 신규 사용자 전용 체크
  if (promoCode.new_users_only) {
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (existingSub) {
      console.log("❌ 신규 사용자 전용");
      console.groupEnd();
      return {
        valid: false,
        error: "신규 사용자만 사용 가능한 프로모션 코드입니다.",
      };
    }
  }

  // 6. 이미 사용한 코드인지 체크
  const { data: existingUse } = await supabase
    .from("promo_code_uses")
    .select("id")
    .eq("promo_code_id", promoCode.id)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingUse) {
    console.log("❌ 이미 사용한 코드");
    console.groupEnd();
    return {
      valid: false,
      error:
        "이미 사용한 프로모션 코드입니다. 사용 횟수가 마감된 쿠폰은 삭제 후 다시 사용할 수 없습니다.",
    };
  }

  // 6-1. 사용 횟수 마감 확인 (추가 검증)
  if (
    promoCode.max_uses !== null &&
    promoCode.current_uses >= promoCode.max_uses
  ) {
    console.log("❌ 사용 횟수 마감");
    console.groupEnd();
    return {
      valid: false,
      error:
        "프로모션 코드 사용 가능 횟수를 초과했습니다. 사용 횟수가 마감된 쿠폰은 삭제 후 다시 사용할 수 없습니다.",
    };
  }

  // 7. 할인 금액 계산
  const originalPrice = planType === "monthly" ? 9900 : 94800;
  let finalPrice = originalPrice;
  let freeTrialDays: number | undefined;

  if (promoCode.discount_type === "percentage") {
    const discountAmount = Math.floor(
      originalPrice * (promoCode.discount_value / 100),
    );
    finalPrice = originalPrice - discountAmount;
  } else if (promoCode.discount_type === "fixed_amount") {
    finalPrice = Math.max(0, originalPrice - promoCode.discount_value);
  } else if (promoCode.discount_type === "free_trial") {
    freeTrialDays = promoCode.discount_value;
    finalPrice = 0; // 무료 체험
  }

  console.log("✅ 검증 성공");
  console.log("원가:", originalPrice);
  console.log("할인가:", finalPrice);
  console.groupEnd();

  return {
    valid: true,
    discount: {
      type: promoCode.discount_type as
        | "percentage"
        | "fixed_amount"
        | "free_trial",
      value: promoCode.discount_value,
      description: promoCode.description || "",
    },
    originalPrice,
    finalPrice,
    freeTrialDays,
  };
}

/**
 * 프로모션 코드 사용 기록
 */
export async function recordPromoCodeUse(
  promoCodeId: string,
  userId: string,
  subscriptionId: string,
): Promise<void> {
  console.group("[PromoValidator] 사용 기록");
  console.log("프로모션 코드 ID:", promoCodeId);
  console.log("사용자 ID:", userId);
  console.log("구독 ID:", subscriptionId);

  const supabase = await createClerkSupabaseClient();

  // 1. 사용 내역 추가
  const { error: insertError } = await supabase.from("promo_code_uses").insert({
    promo_code_id: promoCodeId,
    user_id: userId,
    subscription_id: subscriptionId,
  });

  if (insertError) {
    console.error("❌ 사용 내역 추가 실패:", insertError);
    console.error("에러 상세:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      promoCodeId: promoCodeId,
      userId: userId,
      subscriptionId: subscriptionId,
      promoCodeIdType: typeof promoCodeId,
      userIdType: typeof userId,
      subscriptionIdType: typeof subscriptionId,
    });
    console.groupEnd();
    throw new Error(`프로모션 코드 사용 기록 실패: ${insertError.message}`);
  }

  // 2. 프로모션 코드 사용 횟수 증가 (promo_code_uses 테이블의 실제 레코드 수로 업데이트)
  const { count: useCount, error: countError } = await supabase
    .from("promo_code_uses")
    .select("*", { count: "exact", head: true })
    .eq("promo_code_id", promoCodeId);

  if (countError) {
    console.error("❌ 사용 횟수 조회 실패:", countError);
  } else {
    // 실제 사용 횟수로 업데이트
    const { error: updateError } = await supabase
      .from("promo_codes")
      .update({ current_uses: useCount || 0 })
      .eq("id", promoCodeId);

    if (updateError) {
      console.error("❌ 사용 횟수 업데이트 실패:", updateError);
    } else {
      console.log("✅ 사용 횟수 업데이트 성공:", useCount || 0);
    }
  }

  console.log("✅ 사용 기록 완료");
  console.groupEnd();
}
