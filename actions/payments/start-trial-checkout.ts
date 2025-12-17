"use server";

/**
 * @file start-trial-checkout.ts
 * @description 카드(0원 승인) 기반 14일 무료 체험 checkout 생성 Server Action
 *
 * 정책:
 * - 무료 14일 체험은 사용자당 1회만 가능 (users.trial_used_at으로 판정)
 * - 무료 체험 시작은 "카드 결제/등록(0원 승인)"이 필수
 *
 * 구현:
 * - Mock Toss 결제 페이지(`/checkout/mock`)로 이동하는 URL을 생성합니다.
 * - 성공 URL에 isTrial=1, trialDays=14를 실어 결제 성공 후 confirm 단계에서 처리합니다.
 */

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getMockTossClient,
  generateOrderId,
} from "@/lib/payments/mock-toss-client";

export interface StartTrialCheckoutRequest {
  /**
   * 기본 14일로 고정하지만, 운영에서 변경 가능하도록 파라미터로 둡니다.
   * (클라이언트에서 임의 값 조작을 방지하기 위해 서버에서 다시 검증/고정합니다)
   */
  trialDays?: number;
}

export interface StartTrialCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  orderId?: string;
  error?: string;
}

export async function startTrialCheckout(
  request: StartTrialCheckoutRequest = {},
): Promise<StartTrialCheckoutResponse> {
  console.group("[StartTrialCheckout] 14일 무료 체험 checkout 생성");
  console.log("요청:", request);

  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ 인증 실패");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 정보를 찾을 수 없거나 생성할 수 없습니다.");
      console.groupEnd();
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    const trialDays = 14; // ✅ 정책 고정(클라이언트 전달값 무시)

    const service = getServiceRoleClient();
    const { data: userRow, error: userError } = await service
      .from("users")
      .select("id, trial_used_at, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      console.error("❌ 사용자 상태 조회 실패:", userError);
      console.groupEnd();
      return { success: false, error: "사용자 상태를 확인할 수 없습니다." };
    }

    if (userRow?.trial_used_at) {
      console.log("⚠️ 무료 체험 1회 사용 이력 있음:", userRow.trial_used_at);
      console.groupEnd();
      return {
        success: false,
        error: "무료 14일 체험은 계정당 1회만 사용할 수 있습니다.",
      };
    }

    // 이미 체험 중이면 재시작 불가
    if (userRow?.trial_ends_at) {
      const endsAt = new Date(userRow.trial_ends_at);
      if (endsAt.getTime() > Date.now()) {
        console.log("⚠️ 이미 무료 체험 진행 중:", userRow.trial_ends_at);
        console.groupEnd();
        return {
          success: false,
          error: "이미 무료 체험을 이용 중입니다.",
        };
      }
    }

    // 0원 승인(카드 등록)용 결제 세션 생성 (Mock)
    const orderId = generateOrderId(user.id);
    const tossClient = getMockTossClient();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const paymentResponse = await tossClient.createPayment({
      orderId,
      amount: 0,
      orderName: "맛의 아카이브 프리미엄 무료체험(14일) - 카드 확인(0원)",
      customerName: user.name || "사용자",
      customerEmail: "",
      successUrl: `${baseUrl}/checkout/success?orderId=${orderId}&isTrial=1&trialDays=${trialDays}`,
      failUrl: `${baseUrl}/checkout/fail?orderId=${orderId}&isTrial=1`,
    });

    // mock checkoutUrl에 추가 파라미터 전달(현재 confirm-payment가 사용하는 형태 유지)
    const checkoutUrlWithParams =
      `${paymentResponse.checkoutUrl}` +
      `&planType=monthly` +
      `&userId=${user.id}` +
      `&isTrial=1` +
      `&trialDays=${trialDays}` +
      `&amount=0`;

    console.log("✅ 무료 체험 checkoutUrl 생성 완료:", checkoutUrlWithParams);
    console.groupEnd();

    // createClerkSupabaseClient가 여기서는 필요 없지만(일관성 차원) 남겨둠
    await createClerkSupabaseClient();

    return { success: true, checkoutUrl: checkoutUrlWithParams, orderId };
  } catch (error) {
    console.error("❌ 무료 체험 checkout 생성 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "무료 체험 결제 시작에 실패했습니다.",
    };
  }
}
