/**
 * @file actions/admin/promo-codes/sync-usage.ts
 * @description 프로모션 코드 사용 횟수 동기화 Server Action
 *
 * promo_code_uses 테이블의 실제 레코드 수를 기반으로
 * promo_codes 테이블의 current_uses를 업데이트합니다.
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface SyncUsageResponse {
  success: true;
  updated: number;
}

export interface SyncUsageError {
  success: false;
  error: string;
}

export type SyncUsageResult = SyncUsageResponse | SyncUsageError;

/**
 * 모든 프로모션 코드의 사용 횟수를 동기화
 */
export async function syncPromoCodeUsage(): Promise<SyncUsageResult> {
  try {
    console.group("[AdminConsole][PromoCodes][SyncUsage]");
    console.log("event", "start");

    const supabase = getServiceRoleClient();

    // 1. 모든 프로모션 코드 조회
    const { data: codes, error: codesError } = await supabase
      .from("promo_codes")
      .select("id");

    if (codesError) {
      console.error("❌ 프로모션 코드 조회 실패:", codesError);
      console.groupEnd();
      return {
        success: false,
        error: `프로모션 코드 조회 실패: ${codesError.message}`,
      };
    }

    if (!codes || codes.length === 0) {
      console.log("✅ 동기화할 프로모션 코드가 없습니다");
      console.groupEnd();
      return {
        success: true,
        updated: 0,
      };
    }

    // 2. 각 코드별 실제 사용 횟수 조회 및 업데이트
    let updatedCount = 0;

    for (const code of codes) {
      const { count, error: countError } = await supabase
        .from("promo_code_uses")
        .select("*", { count: "exact", head: true })
        .eq("promo_code_id", code.id);

      if (countError) {
        console.warn(`⚠️ 코드 ${code.id} 사용 횟수 조회 실패:`, countError);
        continue;
      }

      const actualUses = count || 0;

      // current_uses 업데이트
      const { error: updateError } = await supabase
        .from("promo_codes")
        .update({ current_uses: actualUses })
        .eq("id", code.id);

      if (updateError) {
        console.warn(`⚠️ 코드 ${code.id} 사용 횟수 업데이트 실패:`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ 코드 ${code.id} 사용 횟수 동기화: ${actualUses}`);
      }
    }

    console.log(`✅ 동기화 완료: ${updatedCount}개 코드 업데이트`);
    console.groupEnd();

    return {
      success: true,
      updated: updatedCount,
    };
  } catch (error) {
    console.error("❌ [AdminConsole][PromoCodes][SyncUsage] 예상치 못한 오류:", {
      error,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : "알 수 없는 오류가 발생했습니다",
    };
  }
}

