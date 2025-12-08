/**
 * @file actions/admin/promo-codes/create.ts
 * @description 관리자 프로모션 코드 생성 Server Action
 */

"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { PromoCodeFormValues } from "@/types/promo-code";

const CreatePromoCodeSchema = z.object({
  code: z.string().min(1).max(50).transform(val => val.toUpperCase()),
  discount_type: z.enum(["percentage", "fixed_amount", "free_trial"]),
  discount_value: z.number().min(1),
  max_uses: z.number().min(1).nullable().optional(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  applicable_plans: z.array(z.enum(["monthly", "yearly"])).nullable().optional(),
  new_users_only: z.boolean().default(false),
  description: z.string().max(500).nullable().optional(),
});

type CreatePromoCodeInput = z.infer<typeof CreatePromoCodeSchema>;

export interface CreatePromoCodeResponse {
  success: true;
  data: PromoCodeFormValues & { id: string; created_at: string };
}

export interface CreatePromoCodeError {
  success: false;
  error: string;
}

export type CreatePromoCodeResult = CreatePromoCodeResponse | CreatePromoCodeError;

/**
 * 프로모션 코드 생성
 */
export async function createPromoCode(input: CreatePromoCodeInput): Promise<CreatePromoCodeResult> {
  try {
    console.group("[AdminConsole][PromoCodes][Create]");
    console.log("event", "start");
    console.log("input", input);

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return {
        success: false,
        error: "인증이 필요합니다",
      };
    }

    // 입력 검증
    const validatedInput = CreatePromoCodeSchema.parse(input);

    // 유효 기간 검증
    const validFrom = new Date(validatedInput.valid_from);
    const validUntil = new Date(validatedInput.valid_until);
    
    if (validUntil <= validFrom) {
      return {
        success: false,
        error: "유효 종료일은 시작일보다 이후여야 합니다",
      };
    }

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 사용자 ID 조회 (Supabase users 테이블)
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();

    // 프로모션 코드 생성
    const { data, error } = await supabase
      .from("promo_codes")
      .insert({
        code: validatedInput.code,
        discount_type: validatedInput.discount_type,
        discount_value: validatedInput.discount_value,
        max_uses: validatedInput.max_uses ?? null,
        current_uses: 0,
        valid_from: validatedInput.valid_from,
        valid_until: validatedInput.valid_until,
        applicable_plans: validatedInput.applicable_plans ?? null,
        new_users_only: validatedInput.new_users_only,
        description: validatedInput.description ?? null,
        created_by: userData?.id ?? null,
      })
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

    console.log("✅ 프로모션 코드 생성 성공:", data.id);
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
    console.error("❌ [AdminConsole][PromoCodes][Create] 예상치 못한 오류:", {
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

