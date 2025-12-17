"use server";

/**
 * @file confirm-payment.ts
 * @description 결제 승인 처리 Server Action
 */

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getMockTossClient,
  generateMockPaymentKey,
} from "@/lib/payments/mock-toss-client";
import { recordPromoCodeUse } from "@/lib/payments/promo-code-validator";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

export interface ConfirmPaymentRequest {
  orderId: string;
  userId: string;
  planType: "monthly" | "yearly";
  amount: number;
  promoCodeId?: string;
  /**
   * 카드 0원 승인 기반 무료 14일 체험 여부
   */
  isTrial?: boolean;
  /**
   * 무료 체험 일수(서버에서 다시 고정/검증됨)
   */
  trialDays?: number;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  subscriptionId?: string;
  expiresAt?: string;
  message?: string;
  error?: string;
}

/**
 * 결제 승인 및 구독 활성화
 */
export async function confirmPayment(
  request: ConfirmPaymentRequest,
): Promise<ConfirmPaymentResponse> {
  console.group("[ConfirmPayment] 결제 승인 처리");
  console.log("요청:", request);

  try {
    // 0. 사용자 확인 및 Supabase user ID 가져오기
    const user = await ensureSupabaseUser();

    if (!user) {
      console.error("❌ 사용자 정보를 찾을 수 없거나 생성할 수 없습니다.");
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    console.log("✅ 사용자 확인 완료:", user.id);
    console.log("요청된 userId:", request.userId);
    console.log("Supabase user ID:", user.id);

    // Supabase user ID 사용 (request.userId는 URL 파라미터로 전달된 값)
    const supabaseUserId = user.id;

    // Service Role 클라이언트 사용 (RLS 우회 - 구독 생성, 결제 내역 생성 등 관리 작업)
    const serviceSupabase = getServiceRoleClient();
    // 일반 클라이언트는 사용자 정보 조회 등에만 사용
    const supabase = await createClerkSupabaseClient();

    // 1. Mock 결제 승인 요청
    const tossClient = getMockTossClient();
    const paymentKey = generateMockPaymentKey();

    const confirmResult = await tossClient.confirmPayment({
      paymentKey,
      orderId: request.orderId,
      amount: request.amount,
    });

    if (confirmResult.status !== "DONE") {
      console.log("❌ 결제 실패:", confirmResult.status);
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return {
        success: false,
        error: "결제가 실패했습니다. 다시 시도해주세요.",
      };
    }

    // 2. 빌링키 발급 (정기결제용)
    // customerKey는 Clerk user ID 사용 (Toss 결제 시스템용)
    const { userId: clerkUserId } = await auth();
    const billingKeyResult = await tossClient.issueBillingKey({
      customerKey: clerkUserId || supabaseUserId,
      authKey: paymentKey,
    });

    // 3. 구독 기간 계산
    const now = new Date();
    const periodEnd = new Date(now);
    const isTrial = request.isTrial === true;
    const trialDays = 14; // ✅ 정책 고정

    if (isTrial) {
      periodEnd.setDate(periodEnd.getDate() + trialDays);
    } else if (request.planType === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const pricePerMonth = isTrial
      ? 0
      : request.planType === "monthly"
        ? request.amount
        : Math.floor(request.amount / 12);

    // 4. 구독 레코드 생성 (Service Role 클라이언트 사용 - RLS 우회)
    console.log("구독 생성 시도:", {
      user_id: supabaseUserId,
      user_id_type: typeof supabaseUserId,
      user_id_length: supabaseUserId?.length,
      plan_type: request.planType,
      amount: request.amount,
      price_per_month: pricePerMonth,
    });

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supabaseUserId)) {
      console.error("❌ 잘못된 UUID 형식:", supabaseUserId);
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return {
        success: false,
        error: `잘못된 사용자 ID 형식입니다: ${supabaseUserId}`,
      };
    }

    const { data: subscription, error: subError } = await serviceSupabase
      .from("subscriptions")
      .insert({
        user_id: supabaseUserId,
        status: "active",
        plan_type: isTrial ? "monthly" : request.planType,
        billing_key: billingKeyResult.billingKey,
        payment_method: "card",
        last_four_digits: billingKeyResult.cardInfo.lastFourDigits,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        price_per_month: pricePerMonth,
        total_paid: isTrial ? 0 : request.amount,
        is_test_mode: true,
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error("❌ 구독 생성 실패:", subError);
      console.error("에러 상세:", {
        code: subError?.code,
        message: subError?.message,
        details: subError?.details,
        hint: subError?.hint,
        user_id: supabaseUserId,
        user_id_type: typeof supabaseUserId,
        subscription: subscription,
      });
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return {
        success: false,
        error: `구독 생성에 실패했습니다: ${subError?.message || "구독 정보를 가져올 수 없습니다."}`,
      };
    }

    console.log("✅ 구독 생성 완료:", subscription.id);

    // subscription.id가 유효한지 확인
    if (!subscription.id) {
      console.error("❌ 구독 ID가 없습니다:", subscription);
      try {
        console.groupEnd();
      } catch {
        // groupEnd 실패 무시
      }
      return {
        success: false,
        error: "구독 ID를 가져올 수 없습니다.",
      };
    }

    // 5. 결제 내역 생성 (Service Role 클라이언트 사용)
    try {
      const { error: txError } = await serviceSupabase
        .from("payment_transactions")
        .insert({
          subscription_id: subscription.id,
          user_id: supabaseUserId,
          status: "completed",
          transaction_type: "subscription",
          pg_provider: "toss_payments",
          pg_transaction_id: confirmResult.paymentKey,
          amount: request.amount,
          tax_amount: 0,
          net_amount: request.amount,
          payment_method: "card",
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
        console.error("❌ 결제 내역 생성 실패:", txError);
      }
    } catch (error) {
      console.error("❌ 결제 내역 생성 중 오류:", error);
      // 결제는 성공했으므로 계속 진행
    }

    // 6. 사용자 프리미엄 상태 활성화 (Service Role 클라이언트 사용)
    try {
      const { error: userUpdateError } = await serviceSupabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: periodEnd.toISOString(),
          ...(isTrial
            ? {
                trial_ends_at: periodEnd.toISOString(),
                trial_used_at: now.toISOString(),
              }
            : {}),
        })
        .eq("id", supabaseUserId);

      if (userUpdateError) {
        console.error(
          "❌ 사용자 프리미엄 상태 업데이트 실패:",
          userUpdateError,
        );
      }
    } catch (error) {
      console.error("❌ 사용자 프리미엄 상태 업데이트 중 오류:", error);
      // 결제는 성공했으므로 계속 진행
    }

    // 6-1. user_subscriptions 테이블 업데이트 (가족 구성원 관리용)
    // 프리미엄 결제는 'premium' 플랜으로 매핑 (Service Role 클라이언트 사용)
    try {
      const { error: userSubError } = await serviceSupabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: supabaseUserId,
            subscription_plan: "premium",
            started_at: now.toISOString(),
            expires_at: periodEnd.toISOString(),
            is_active: true,
          },
          {
            onConflict: "user_id",
          },
        );

      if (userSubError) {
        console.error("❌ user_subscriptions 업데이트 실패:", userSubError);
        // 에러가 발생해도 결제는 성공했으므로 계속 진행
      } else {
        console.log("✅ user_subscriptions 업데이트 완료 (premium 플랜)");
      }
    } catch (error) {
      console.error("❌ user_subscriptions 업데이트 중 오류:", error);
      // 결제는 성공했으므로 계속 진행
    }

    // 7. 프로모션 코드 사용 기록
    if (request.promoCodeId) {
      try {
        await recordPromoCodeUse(
          request.promoCodeId,
          supabaseUserId,
          subscription.id,
        );
      } catch (error) {
        console.error("⚠️ 프로모션 코드 사용 기록 실패:", error);
        // 결제는 성공했으므로 계속 진행
      }
    }

    console.log("✅ 결제 승인 완료");

    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 응답 직렬화 보장: subscription.id를 명시적으로 문자열로 변환
    const subscriptionId = String(subscription.id);
    const expiresAt = periodEnd.toISOString();
    const message = isTrial
      ? `프리미엄 무료 체험이 활성화되었습니다. ${new Date(expiresAt).toLocaleDateString("ko-KR")}까지 이용할 수 있어요.`
      : `프리미엄이 활성화되었습니다. ${new Date(expiresAt).toLocaleDateString("ko-KR")}까지 이용할 수 있어요.`;

    return {
      success: true,
      subscriptionId: subscriptionId,
      expiresAt,
      message,
    };
  } catch (error) {
    console.error("❌ 결제 승인 오류:", error);
    console.error(
      "에러 타입:",
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      "에러 메시지:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "에러 스택:",
      error instanceof Error ? error.stack : "스택 없음",
    );

    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 항상 올바른 형식의 응답 반환
    const errorMessage =
      error instanceof Error ? error.message : "결제 승인에 실패했습니다.";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
