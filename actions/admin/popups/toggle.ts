/**
 * @file actions/admin/popups/toggle.ts
 * @description 관리자 팝업 공지 토글 Server Action
 *
 * 주요 기능:
 * 1. 팝업의 우선순위 토글 (높음/보통/낮음)
 * 2. 대상 세그먼트 토글 (특정 세그먼트 추가/제거)
 * 3. 빠른 설정 변경을 위한 optimistic 업데이트 지원
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidateTag } from "next/cache";

// 입력 스키마
const TogglePopupSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["priority", "segment"]),
  value: z.union([
    z.number().min(0).max(100), // priority
    z.string(), // segment to add/remove
  ]),
  action: z.enum(["set", "add", "remove"]).optional(), // for segments
});

type TogglePopupInput = z.infer<typeof TogglePopupSchema>;

export interface TogglePopupResponse {
  success: true;
  data: {
    id: string;
    priority?: number;
    target_segments?: string[];
    updated_at: string;
  };
  type: "priority" | "segment";
}

export interface TogglePopupError {
  success: false;
  error: string;
}

export type TogglePopupResult = TogglePopupResponse | TogglePopupError;

/**
 * 팝업 공지 설정 토글
 */
export async function togglePopup(input: TogglePopupInput): Promise<TogglePopupResult> {
  try {
    console.group("[AdminConsole][Popups][Toggle]");
    console.log("event", "start");
    console.log("popup_id", input.id);
    console.log("type", input.type);
    console.log("action", input.action);

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
    const validatedInput = TogglePopupSchema.parse(input);
    const { id, type, value, action = "set" } = validatedInput;

    // Supabase 클라이언트 생성 (Service Role 사용 - RLS 우회)
    let supabase;
    try {
      supabase = getServiceRoleClient();
      console.log("✅ Supabase Service Role 클라이언트 생성 성공");
    } catch (clientError) {
      console.error("❌ Supabase 클라이언트 생성 실패:", {
        error: clientError,
        message: clientError instanceof Error ? clientError.message : String(clientError),
      });
      console.groupEnd();
      return {
        success: false,
        error: `Supabase 클라이언트 생성 실패: ${clientError instanceof Error ? clientError.message : "알 수 없는 오류"}. 환경 변수를 확인해주세요.`,
      };
    }

    // 현재 팝업 정보 조회
    const { data: currentData, error: fetchError } = await supabase
      .from("popup_announcements")
      .select("priority, target_segments")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("❌ 팝업 조회 오류:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      console.groupEnd();
      return {
        success: false,
        error: `팝업 조회 오류: ${fetchError.message}${fetchError.code ? ` (코드: ${fetchError.code})` : ""}`,
      };
    }

    let updateData: Record<string, any> = {
      updated_by: clerkUser.id,
    };

    // 우선순위 토글
    if (type === "priority") {
      if (typeof value !== "number") {
        console.error("validation_error", "우선순위는 숫자여야 합니다");
        console.groupEnd();
        return {
          success: false,
          error: "우선순위는 숫자여야 합니다",
        };
      }
      updateData.priority = value;
    }

    // 세그먼트 토글
    else if (type === "segment") {
      if (typeof value !== "string") {
        console.error("validation_error", "세그먼트는 문자열이어야 합니다");
        console.groupEnd();
        return {
          success: false,
          error: "세그먼트는 문자열이어야 합니다",
        };
      }

      const currentSegments = currentData.target_segments || [];
      let newSegments: string[];

      switch (action) {
        case "add":
          newSegments = [...new Set([...currentSegments, value])]; // 중복 제거
          break;
        case "remove":
          newSegments = currentSegments.filter(s => s !== value);
          break;
        case "set":
        default:
          newSegments = [value];
          break;
      }

      updateData.target_segments = newSegments;
    }

    // 업데이트 수행
    const { data, error } = await supabase
      .from("popup_announcements")
      .update(updateData)
      .eq("id", id)
      .select("id, priority, target_segments, updated_at")
      .single();

    if (error) {
      console.error("❌ 업데이트 오류:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      console.groupEnd();
      return {
        success: false,
        error: `업데이트 오류: ${error.message}${error.code ? ` (코드: ${error.code})` : ""}`,
      };
    }

    // 캐시 무효화
    revalidateTag("popup-announcements");

    console.log("result_id", data.id);
    console.log("updated_field", type);
    console.log("new_value", type === "priority" ? data.priority : data.target_segments);
    console.groupEnd();

    return {
      success: true,
      data: {
        id: data.id,
        priority: type === "priority" ? data.priority : undefined,
        target_segments: type === "segment" ? data.target_segments : undefined,
        updated_at: data.updated_at,
      },
      type,
    };
  } catch (error) {
    console.error("❌ [AdminConsole][Popups][Toggle] 예상치 못한 오류:", {
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
        : typeof error === "string" 
        ? error 
        : "알 수 없는 오류가 발생했습니다",
    };
  }
}
