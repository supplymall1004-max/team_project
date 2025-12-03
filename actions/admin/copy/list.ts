/**
 * @file actions/admin/copy/list.ts
 * @description 관리자 페이지 문구 블록 목록 조회 Server Action
 *
 * 주요 기능:
 * 1. admin_copy_blocks 테이블에서 모든 문구 블록 조회
 * 2. 검색/필터링 지원 (slug, locale)
 * 3. 최신 업데이트 순으로 정렬
 */

"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidateTag } from "next/cache";

// 입력 스키마
const ListCopyBlocksSchema = z.object({
  search: z.string().optional(),
  locale: z.string().optional(),
});

type ListCopyBlocksInput = z.infer<typeof ListCopyBlocksSchema>;

export interface AdminCopyBlock {
  id: string;
  slug: string;
  locale: string;
  content: Record<string, any>;
  version: number;
  updated_by: string;
  updated_at: string;
  created_at: string;
}

export interface ListCopyBlocksResponse {
  success: true;
  data: AdminCopyBlock[];
  total: number;
}

export interface ListCopyBlocksError {
  success: false;
  error: string;
}

export type ListCopyBlocksResult = ListCopyBlocksResponse | ListCopyBlocksError;

/**
 * 페이지 문구 블록 목록 조회
 */
export async function listCopyBlocks(input?: ListCopyBlocksInput): Promise<ListCopyBlocksResult> {
  try {
    console.group("[AdminConsole][Copy][List]");
    console.log("event", "start");
    console.log("input", input);

    // 입력 검증
    const validatedInput = ListCopyBlocksSchema.parse(input || {});
    const { search, locale } = validatedInput;

    // Supabase 클라이언트 생성 (Service Role - RLS 우회)
    const supabase = getServiceRoleClient();

    // 쿼리 빌드
    let query = supabase
      .from("admin_copy_blocks")
      .select("*")
      .order("updated_at", { ascending: false });

    // 검색 필터
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(`slug.ilike.%${searchTerm}%,content::text.ilike.%${searchTerm}%`);
    }

    // 언어 필터
    if (locale) {
      query = query.eq("locale", locale);
    }

    const { data, error } = await query;

    if (error) {
      console.error("database_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `데이터베이스 오류: ${error.message}`,
      };
    }

    console.log("result_count", data?.length || 0);
    console.groupEnd();

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    };
  } catch (error) {
    console.error("[AdminConsole][Copy][List] unexpected_error", error);
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
export async function revalidateCopyBlocks() {
  revalidateTag("admin-copy-blocks");
}
