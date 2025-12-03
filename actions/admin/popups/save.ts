/**
 * @file actions/admin/popups/save.ts
 * @description 관리자 팝업 공지 생성/수정 Server Action
 *
 * 주요 기능:
 * 1. 새 팝업 공지 생성 또는 기존 공지 업데이트
 * 2. 유효성 검증 (날짜 범위, 필수 필드 등)
 * 3. Clerk 사용자 정보로 생성자/수정자 설정
 */

"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

// 입력 스키마
const SavePopupSchema = z.object({
  id: z.string().uuid().optional(), // 없으면 새로 생성
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  image_url: z.string().url().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
  active_from: z.string().datetime(),
  active_until: z.string().datetime().nullable().optional(),
  priority: z.number().min(0).max(100).default(0),
  target_segments: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => {
    // active_until이 active_from보다 이후인지 검증
    if (data.active_until && new Date(data.active_until) <= new Date(data.active_from)) {
      return false;
    }
    return true;
  },
  {
    message: "종료일은 시작일보다 이후여야 합니다",
    path: ["active_until"],
  }
);

type SavePopupInput = z.infer<typeof SavePopupSchema>;

export interface SavePopupResponse {
  success: true;
  data: {
    id: string;
    title: string;
    body: string;
    image_url: string | null;
    link_url: string | null;
    active_from: string;
    active_until: string | null;
    status: "draft" | "published" | "archived";
    priority: number;
    target_segments: string[];
    metadata: Record<string, any>;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
  };
  isNew: boolean;
}

export interface SavePopupError {
  success: false;
  error: string;
}

export type SavePopupResult = SavePopupResponse | SavePopupError;

/**
 * 팝업 공지 생성 또는 업데이트
 */
export async function savePopup(input: SavePopupInput): Promise<SavePopupResult> {
  try {
    console.group("[AdminConsole][Popups][Save]");
    console.log("event", "start");
    console.log("title", input.title);
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
    const validatedInput = SavePopupSchema.parse(input);
    const {
      id,
      title,
      body,
      image_url,
      link_url,
      active_from,
      active_until,
      priority,
      target_segments,
      metadata = {},
    } = validatedInput;

    // Supabase 클라이언트 생성 (Clerk 인증 사용)
    const supabase = await createClerkSupabaseClient();

    // upsert 수행
    const upsertData = {
      title,
      body,
      image_url: image_url || null,
      link_url: link_url || null,
      active_from,
      active_until: active_until || null,
      priority,
      target_segments,
      metadata,
      updated_by: clerkUser.id,
      ...(id ? { id } : { created_by: clerkUser.id, status: "draft" as const }),
    };

    const { data, error } = await supabase
      .from("popup_announcements")
      .upsert(upsertData, {
        onConflict: id ? undefined : "title", // 새로 생성할 때는 title 중복 방지
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
    revalidateTag("popup-announcements");

    console.log("result_id", data.id);
    console.log("is_new", !id);
    console.groupEnd();

    return {
      success: true,
      data: {
        id: data.id,
        title: data.title,
        body: data.body,
        image_url: data.image_url,
        link_url: data.link_url,
        active_from: data.active_from,
        active_until: data.active_until,
        status: data.status,
        priority: data.priority,
        target_segments: data.target_segments,
        metadata: data.metadata,
        created_by: data.created_by,
        updated_by: data.updated_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      isNew: !id,
    };
  } catch (error) {
    console.error("[AdminConsole][Popups][Save] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}
