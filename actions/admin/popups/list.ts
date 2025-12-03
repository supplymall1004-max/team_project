/**
 * @file actions/admin/popups/list.ts
 * @description 관리자 팝업 공지 목록 조회 Server Action
 *
 * 주요 기능:
 * 1. popup_announcements 테이블에서 모든 팝업 조회
 * 2. 상태/날짜 범위 필터링 지원
 * 3. 활성 상태 우선 정렬
 */

"use server";

import { z } from "zod";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidateTag } from "next/cache";

// 입력 스키마
const ListPopupsSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

type ListPopupsInput = z.infer<typeof ListPopupsSchema>;

export interface AdminPopupAnnouncement {
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
}

export interface ListPopupsResponse {
  success: true;
  data: AdminPopupAnnouncement[];
  total: number;
  hasMore: boolean;
}

export interface ListPopupsError {
  success: false;
  error: string;
}

export type ListPopupsResult = ListPopupsResponse | ListPopupsError;

/**
 * 팝업 공지 목록 조회
 */
export async function listPopups(input?: ListPopupsInput): Promise<ListPopupsResult> {
  try {
    console.group("[AdminConsole][Popups][List]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const validatedInput = ListPopupsSchema.parse(input || {});
    const { status, limit, offset } = validatedInput;

    // Supabase 클라이언트 생성 (Service Role 사용 - RLS 우회)
    const supabase = getServiceRoleClient();

    // 쿼리 빌드 - 명시적으로 컬럼 선택
    let query = supabase
      .from("popup_announcements")
      .select(
        `
        id,
        title,
        body,
        image_url,
        link_url,
        active_from,
        active_until,
        status,
        priority,
        target_segments,
        metadata,
        created_by,
        updated_by,
        created_at,
        updated_at
        `,
        { count: "exact" }
      )
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("database_error", error);
      console.error("error_details", JSON.stringify(error, null, 2));
      console.error("error_code", error.code);
      console.error("error_hint", error.hint);
      console.error("error_details_obj", error.details);
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
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + (data?.length || 0),
    };
  } catch (error) {
    console.error("[AdminConsole][Popups][List] unexpected_error", error);
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
export async function revalidatePopups() {
  revalidateTag("popup-announcements");
}
