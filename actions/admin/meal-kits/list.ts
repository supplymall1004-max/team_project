/**
 * @file actions/admin/meal-kits/list.ts
 * @description 관리자 밀키트 제품 목록 조회 Server Action
 *
 * 주요 기능:
 * 1. meal_kits 테이블에서 모든 밀키트 조회
 * 2. 활성 상태 필터링 지원
 * 3. 생성일 기준 정렬
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidateTag } from "next/cache";
import type { MealKit } from "@/types/diet";

// 입력 스키마
const ListMealKitsSchema = z.object({
  is_active: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

type ListMealKitsInput = z.infer<typeof ListMealKitsSchema>;

export interface AdminMealKit extends MealKit {
  // MealKit 타입에 이미 필요한 필드들이 포함되어 있음
}

export interface ListMealKitsResponse {
  success: true;
  data: AdminMealKit[];
  total: number;
  hasMore: boolean;
}

export interface ListMealKitsError {
  success: false;
  error: string;
}

export type ListMealKitsResult = ListMealKitsResponse | ListMealKitsError;

/**
 * 밀키트 제품 목록 조회
 */
export async function listMealKits(input?: ListMealKitsInput): Promise<ListMealKitsResult> {
  try {
    console.group("[AdminConsole][MealKits][List]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const validatedInput = ListMealKitsSchema.parse(input || {});
    const { is_active, limit, offset } = validatedInput;

    // Supabase 클라이언트 생성 (Service Role 사용 - RLS 우회)
    const supabase = getServiceRoleClient();

    // 쿼리 빌드
    let query = supabase
      .from("meal_kits")
      .select(
        `
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
        created_by,
        created_at,
        updated_at
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 활성 상태 필터
    if (is_active !== undefined) {
      query = query.eq("is_active", is_active);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("database_error", error);
      console.error("error_details", JSON.stringify(error, null, 2));
      console.groupEnd();
      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}`,
      };
    }

    console.log("result_count", data?.length || 0);
    console.log("total_count", count);
    console.groupEnd();

    return {
      success: true,
      data: (data as AdminMealKit[]) || [],
      total: count || 0,
      hasMore: (count || 0) > offset + (data?.length || 0),
    };
  } catch (error) {
    console.error("[AdminConsole][MealKits][List] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

/**
 * 캐시 무효화 헬퍼 함수
 */
export async function revalidateMealKits() {
  revalidateTag("meal-kits");
}













