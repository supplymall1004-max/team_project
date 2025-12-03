/**
 * @file actions/admin/popups/deploy.ts
 * @description 관리자 팝업 공지 배포/배포취소 Server Action
 *
 * 주요 기능:
 * 1. 팝업 공지 상태를 published로 변경 (배포)
 * 2. published 팝업을 draft로 변경 (배포 취소)
 * 3. 배포 전 유효성 검증
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

// 입력 스키마
const DeployPopupSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["publish", "unpublish"]),
});

type DeployPopupInput = z.infer<typeof DeployPopupSchema>;

export interface DeployPopupResponse {
  success: true;
  data: {
    id: string;
    status: "draft" | "published" | "archived";
    updated_at: string;
  };
  action: "publish" | "unpublish";
}

export interface DeployPopupError {
  success: false;
  error: string;
}

export type DeployPopupResult = DeployPopupResponse | DeployPopupError;

/**
 * 팝업 공지 배포 또는 배포 취소
 */
export async function deployPopup(input: DeployPopupInput): Promise<DeployPopupResult> {
  try {
    console.group("[AdminConsole][Popups][Deploy]");
    console.log("event", "start");
    console.log("popup_id", input.id);
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
    const validatedInput = DeployPopupSchema.parse(input);
    const { id, action } = validatedInput;

    // Supabase 클라이언트 생성 (Clerk 인증 사용)
    const supabase = await createClerkSupabaseClient();

    // 현재 팝업 정보 조회
    const { data: currentData, error: fetchError } = await supabase
      .from("popup_announcements")
      .select("title, body, active_from, active_until, status")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("fetch_error", fetchError);
      console.groupEnd();
      return {
        success: false,
        error: `팝업 조회 오류: ${fetchError.message}`,
      };
    }

    // 배포 전 유효성 검증 (publish인 경우)
    if (action === "publish") {
      const now = new Date();
      const activeFrom = new Date(currentData.active_from);
      const activeUntil = currentData.active_until ? new Date(currentData.active_until) : null;

      // 시작일이 현재보다 이전인지 확인
      if (activeFrom > now) {
        console.error("validation_error", "시작일이 미래입니다");
        console.groupEnd();
        return {
          success: false,
          error: "시작일이 현재보다 미래여야 배포할 수 있습니다",
        };
      }

      // 종료일이 설정되어 있고 현재보다 이전인지 확인
      if (activeUntil && activeUntil < now) {
        console.error("validation_error", "종료일이 이미 지났습니다");
        console.groupEnd();
        return {
          success: false,
          error: "종료일이 이미 지났습니다",
        };
      }

      // 필수 필드 검증
      if (!currentData.title.trim() || !currentData.body.trim()) {
        console.error("validation_error", "제목과 본문은 필수입니다");
        console.groupEnd();
        return {
          success: false,
          error: "제목과 본문은 필수입니다",
        };
      }
    }

    // 상태 업데이트
    const newStatus = action === "publish" ? "published" : "draft";
    const { data, error } = await supabase
      .from("popup_announcements")
      .update({
        status: newStatus,
        updated_by: clerkUser.id,
      })
      .eq("id", id)
      .select("id, status, updated_at")
      .single();

    if (error) {
      console.error("update_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `상태 업데이트 오류: ${error.message}`,
      };
    }

    // 캐시 무효화
    revalidateTag("popup-announcements");

    console.log("result_status", data.status);
    console.log("action_completed", action);
    console.groupEnd();

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
        updated_at: data.updated_at,
      },
      action,
    };
  } catch (error) {
    console.error("[AdminConsole][Popups][Deploy] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}
