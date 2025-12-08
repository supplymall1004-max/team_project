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
  display_type: "modal" | "checkpoint";
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
    let supabase;
    try {
      supabase = getServiceRoleClient();
      console.log("✅ Supabase Service Role 클라이언트 생성 성공");
    } catch (clientError) {
      console.error("❌ Supabase 클라이언트 생성 실패:", {
        error: clientError,
        message: clientError instanceof Error ? clientError.message : String(clientError),
        stack: clientError instanceof Error ? clientError.stack : undefined,
        envCheck: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      console.groupEnd();
      return {
        success: false,
        error: `Supabase 클라이언트 생성 실패: ${clientError instanceof Error ? clientError.message : "알 수 없는 오류"}. 환경 변수를 확인해주세요.`,
      };
    }

    // 쿼리 빌드 - 명시적으로 컬럼 선택
    console.log("📊 팝업 목록 조회 시작:", { status, limit, offset });
    
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
        display_type,
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
      console.error("❌ 데이터베이스 오류:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      console.groupEnd();
      
      // 테이블이 없는 경우 명확한 메시지 제공
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation")) {
        return {
          success: false,
          error: `테이블 'popup_announcements'를 찾을 수 없습니다. 마이그레이션을 적용해주세요. (오류 코드: ${error.code})`,
        };
      }
      
      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}${error.hint ? ` (힌트: ${error.hint})` : ""} (오류 코드: ${error.code})`,
      };
    }
    
    console.log("✅ 데이터 조회 성공:", { count: data?.length || 0, total: count || 0 });

    // 데이터 타입 검증 및 변환
    const validatedData: AdminPopupAnnouncement[] = (data || []).map((item: any) => {
      // display_type이 없거나 null인 경우 기본값 설정
      let displayType: "modal" | "checkpoint" = "modal";
      if (item.display_type === "modal" || item.display_type === "checkpoint") {
        displayType = item.display_type;
      } else if (item.display_type) {
        console.warn(`[AdminConsole][Popups][List] invalid_display_type`, {
          id: item.id,
          display_type: item.display_type,
        });
      }

      return {
        ...item,
        display_type: displayType,
        // target_segments가 배열이 아닌 경우 처리
        target_segments: Array.isArray(item.target_segments) ? item.target_segments : [],
        // metadata가 객체가 아닌 경우 처리
        metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {},
      } as AdminPopupAnnouncement;
    });

    console.log("result_count", validatedData.length);
    console.log("total_count", count);
    console.groupEnd();

    return {
      success: true,
      data: validatedData,
      total: count || 0,
      hasMore: (count || 0) > offset + validatedData.length,
    };
  } catch (error) {
    console.error("❌ [AdminConsole][Popups][List] 예상치 못한 오류:", {
      error,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
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

/**
 * 캐시 무효화 헬퍼 함수
 */
export async function revalidatePopups() {
  revalidateTag("popup-announcements");
}
