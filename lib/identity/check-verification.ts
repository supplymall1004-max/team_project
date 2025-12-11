/**
 * @file lib/identity/check-verification.ts
 * @description 신원확인 상태 확인 유틸리티
 *
 * API에서 사용자의 신원확인 상태를 확인하는 함수입니다.
 */

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 사용자의 신원확인 상태를 확인합니다.
 * @returns 신원확인이 완료되었으면 true, 아니면 false
 */
export async function checkIdentityVerification(): Promise<boolean> {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;

    if (!userId) {
      console.log("[checkIdentityVerification] 사용자가 로그인하지 않음");
      return false;
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("clerk_user_id", userId)
      .eq("status", "verified")
      .limit(1);

    if (error) {
      console.error("[checkIdentityVerification] 신원확인 조회 오류:", error);
      return false;
    }

    const isVerified = Array.isArray(data) && data.length > 0;
    console.log("[checkIdentityVerification] 신원확인 상태:", { userId, isVerified });
    return isVerified;
  } catch (error) {
    console.error("[checkIdentityVerification] 예상치 못한 오류:", error);
    return false;
  }
}

