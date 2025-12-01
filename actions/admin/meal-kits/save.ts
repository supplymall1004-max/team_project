/**
 * @file actions/admin/meal-kits/save.ts
 * @description 관리자 밀키트 제품 생성/수정 Server Action
 *
 * 주요 기능:
 * 1. 새 밀키트 제품 생성 또는 기존 제품 업데이트
 * 2. 유효성 검증 (필수 필드, 가격, 영양 정보 등)
 * 3. Clerk 사용자 정보로 생성자 설정
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import type { MealKit } from "@/types/diet";
import type { MealType } from "@/types/health";

// 입력 스키마
const SaveMealKitSchema = z.object({
  id: z.string().uuid().optional(), // 없으면 새로 생성
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  price: z.number().min(0),
  serving_size: z.number().min(1).default(1),
  calories: z.number().min(0).nullable().optional(),
  protein: z.number().min(0).nullable().optional(),
  carbs: z.number().min(0).nullable().optional(),
  fat: z.number().min(0).nullable().optional(),
  category: z.enum(["korean", "western", "japanese", "chinese", "fusion", "other"]).nullable().optional(),
  meal_type: z.array(z.enum(["breakfast", "lunch", "dinner", "snack"])).default([]),
  purchase_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  is_premium_only: z.boolean().default(true),
});

type SaveMealKitInput = z.infer<typeof SaveMealKitSchema>;

export interface SaveMealKitResponse {
  success: true;
  data: MealKit;
  isNew: boolean;
}

export interface SaveMealKitError {
  success: false;
  error: string;
}

export type SaveMealKitResult = SaveMealKitResponse | SaveMealKitError;

/**
 * 밀키트 제품 생성 또는 업데이트
 */
export async function saveMealKit(input: SaveMealKitInput): Promise<SaveMealKitResult> {
  try {
    console.group("[AdminConsole][MealKits][Save]");
    console.log("event", "start");
    console.log("name", input.name);
    console.log("has_id", !!input.id);

    // Clerk 사용자 정보 확인
    const clerkUser = await currentUser();
    if (!clerkUser) {
      console.error("auth_error", "사용자를 찾을 수 없습니다");
      console.groupEnd();
      return {
        success: false,
        error: "인증되지 않은 사용자입니다",
      };
    }

    // 입력 검증
    const validatedInput = SaveMealKitSchema.parse(input);
    const {
      id,
      name,
      description,
      image_url,
      price,
      serving_size,
      calories,
      protein,
      carbs,
      fat,
      category,
      meal_type,
      purchase_url,
      is_active,
      is_premium_only,
    } = validatedInput;

    // Supabase 클라이언트 생성 (Clerk 인증 사용)
    const supabase = await createClerkSupabaseClient();

    // upsert 수행
    const upsertData = {
      name,
      description: description || null,
      image_url: image_url || null,
      price,
      serving_size,
      calories: calories || null,
      protein: protein || null,
      carbs: carbs || null,
      fat: fat || null,
      category: category || null,
      meal_type: meal_type || [],
      purchase_url: purchase_url || null,
      is_active,
      is_premium_only,
      ...(id ? {} : { created_by: clerkUser.id }),
    };

    const { data, error } = await supabase
      .from("meal_kits")
      .upsert(upsertData, {
        onConflict: id ? "id" : undefined,
      })
      .select("*")
      .single();

    if (error) {
      console.error("upsert_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `저장 오류: ${error.message}`,
      };
    }

    // 캐시 무효화
    revalidateTag("meal-kits");

    console.log("result_id", data.id);
    console.log("is_new", !id);
    console.groupEnd();

    return {
      success: true,
      data: data as MealKit,
      isNew: !id,
    };
  } catch (error) {
    console.error("[AdminConsole][MealKits][Save] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}













