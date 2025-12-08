/**
 * @file actions/admin/promo-codes/delete.ts
 * @description 관리자 프로모션 코드 삭제 Server Action
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

const DeletePromoCodeSchema = z.object({
  id: z.string().uuid(),
});

type DeletePromoCodeInput = z.infer<typeof DeletePromoCodeSchema>;

export interface DeletePromoCodeResponse {
  success: true;
}

export interface DeletePromoCodeError {
  success: false;
  error: string;
}

export type DeletePromoCodeResult = DeletePromoCodeResponse | DeletePromoCodeError;

/**
 * 프로모션 코드 삭제
 */
export async function deletePromoCode(input: DeletePromoCodeInput): Promise<DeletePromoCodeResult> {
  try {
    console.group("[AdminConsole][PromoCodes][Delete]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const { id } = DeletePromoCodeSchema.parse(input);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 프로모션 코드 삭제
    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ 데이터베이스 오류:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      console.groupEnd();

      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}`,
      };
    }

    console.log("✅ 프로모션 코드 삭제 성공:", id);
    console.groupEnd();

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ [AdminConsole][PromoCodes][Delete] 예상치 못한 오류:", {
      error,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.groupEnd();

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `입력 검증 실패: ${error.errors.map(e => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : "알 수 없는 오류가 발생했습니다",
    };
  }
}

