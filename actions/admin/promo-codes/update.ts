/**
 * @file actions/admin/promo-codes/update.ts
 * @description 관리자 프로모션 코드 수정 Server Action
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { PromoCodeFormValues } from "@/types/promo-code";

const UpdatePromoCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(50).transform(val => val.toUpperCase()).optional(),
  discount_type: z.enum(["percentage", "fixed_amount", "free_trial"]).optional(),
  discount_value: z.number().min(1).optional(),
  max_uses: z.number().min(1).nullable().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  applicable_plans: z.array(z.enum(["monthly", "yearly"])).nullable().optional(),
  new_users_only: z.boolean().optional(),
  description: z.string().max(500).nullable().optional(),
});

type UpdatePromoCodeInput = z.infer<typeof UpdatePromoCodeSchema>;

export interface UpdatePromoCodeResponse {
  success: true;
  data: PromoCodeFormValues & { id: string; created_at: string };
}

export interface UpdatePromoCodeError {
  success: false;
  error: string;
}

export type UpdatePromoCodeResult = UpdatePromoCodeResponse | UpdatePromoCodeError;

/**
 * 프로모션 코드 수정
 */
export async function updatePromoCode(input: UpdatePromoCodeInput): Promise<UpdatePromoCodeResult> {
  try {
    console.group("[AdminConsole][PromoCodes][Update]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const validatedInput = UpdatePromoCodeSchema.parse(input);
    const { id, ...updateData } = validatedInput;

    // 유효 기간 검증
    if (updateData.valid_from && updateData.valid_until) {
      const validFrom = new Date(updateData.valid_from);
      const validUntil = new Date(updateData.valid_until);
      
      if (validUntil <= validFrom) {
        return {
          success: false,
          error: "유효 종료일은 시작일보다 이후여야 합니다",
        };
      }
    }

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 프로모션 코드 수정
    const { data, error } = await supabase
      .from("promo_codes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ 데이터베이스 오류:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      console.groupEnd();

      if (error.code === "23505") {
        return {
          success: false,
          error: "이미 존재하는 프로모션 코드입니다",
        };
      }

      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "프로모션 코드를 찾을 수 없습니다",
      };
    }

    console.log("✅ 프로모션 코드 수정 성공:", data.id);
    console.groupEnd();

    return {
      success: true,
      data: {
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_uses: data.max_uses,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        applicable_plans: data.applicable_plans,
        new_users_only: data.new_users_only,
        description: data.description,
        created_at: data.created_at,
      },
    };
  } catch (error) {
    console.error("❌ [AdminConsole][PromoCodes][Update] 예상치 못한 오류:", {
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

