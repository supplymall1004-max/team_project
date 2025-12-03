/**
 * @file actions/admin/meal-kits/delete.ts
 * @description 관리자 밀키트 제품 삭제 Server Action
 *
 * 주요 기능:
 * 1. 밀키트 제품 삭제 (soft delete: is_active = false)
 * 2. 실제 삭제는 하지 않고 비활성화 처리
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

// 입력 스키마
const DeleteMealKitSchema = z.object({
  id: z.string().uuid(),
  hardDelete: z.boolean().default(false), // true면 실제 삭제, false면 is_active = false
});

type DeleteMealKitInput = z.infer<typeof DeleteMealKitSchema>;

export interface DeleteMealKitResponse {
  success: true;
  deleted: boolean;
}

export interface DeleteMealKitError {
  success: false;
  error: string;
}

export type DeleteMealKitResult = DeleteMealKitResponse | DeleteMealKitError;

/**
 * 밀키트 제품 삭제 (또는 비활성화)
 */
export async function deleteMealKit(input: DeleteMealKitInput): Promise<DeleteMealKitResult> {
  try {
    console.group("[AdminConsole][MealKits][Delete]");
    console.log("event", "start");
    console.log("id", input.id);
    console.log("hard_delete", input.hardDelete);

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
    const validatedInput = DeleteMealKitSchema.parse(input);
    const { id, hardDelete } = validatedInput;

    // Supabase 클라이언트 생성 (Clerk 인증 사용)
    const supabase = await createClerkSupabaseClient();

    if (hardDelete) {
      // 실제 삭제
      const { error } = await supabase.from("meal_kits").delete().eq("id", id);

      if (error) {
        console.error("delete_error", error);
        console.groupEnd();
        return {
          success: false,
          error: `삭제 오류: ${error.message}`,
        };
      }

      console.log("hard_delete_success");
    } else {
      // Soft delete: is_active = false
      const { error } = await supabase
        .from("meal_kits")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        console.error("soft_delete_error", error);
        console.groupEnd();
        return {
          success: false,
          error: `비활성화 오류: ${error.message}`,
        };
      }

      console.log("soft_delete_success");
    }

    // 캐시 무효화
    revalidateTag("meal-kits");

    console.groupEnd();

    return {
      success: true,
      deleted: true,
    };
  } catch (error) {
    console.error("[AdminConsole][MealKits][Delete] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

















