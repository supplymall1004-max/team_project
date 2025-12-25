/**
 * @file actions/community/list-groups.ts
 * @description 그룹 목록 조회 Server Action
 *
 * 그룹 목록을 조회하며, 필터링, 검색, 페이지네이션을 지원합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: ListGroupsParams, PaginatedResult, Group
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type {
  ListGroupsParams,
  PaginatedResult,
  Group,
  ActionResult,
} from "@/types/community";

/**
 * 그룹 목록 조회
 *
 * @param params 조회 파라미터
 * @returns 그룹 목록 및 페이지네이션 정보
 */
export async function listGroups(
  params: ListGroupsParams = {}
): Promise<ActionResult<PaginatedResult<Group>>> {
  try {
    console.group("[ListGroups] 그룹 목록 조회 시작");
    console.log("params", params);

    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 로그인이 필요합니다");
      console.groupEnd();
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 2. Supabase 사용자 확인
    const user = await ensureSupabaseUser();
    if (!user) {
      console.error("❌ 사용자 정보를 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    // 3. 파라미터 설정
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // 4. 쿼리 빌더
    const supabase = getServiceRoleClient();
    let query = supabase.from("community_groups").select("*", { count: "exact" });

    // 5. 필터링
    if (params.category) {
      query = query.eq("category", params.category);
    }

    if (params.is_public !== undefined) {
      query = query.eq("is_public", params.is_public);
    } else {
      // 기본적으로 공개 그룹만 조회 (비공개 그룹은 멤버만 조회 가능)
      query = query.eq("is_public", true);
    }

    // 6. 검색
    if (params.search && params.search.trim().length > 0) {
      query = query.or(
        `name.ilike.%${params.search.trim()}%,description.ilike.%${params.search.trim()}%`
      );
    }

    // 7. 정렬 (최신순)
    query = query.order("created_at", { ascending: false });

    // 8. 페이지네이션
    query = query.range(offset, offset + limit - 1);

    // 9. 쿼리 실행
    const { data: groups, error: queryError, count } = await query;

    if (queryError) {
      console.error("❌ 그룹 목록 조회 실패:", queryError);
      console.groupEnd();
      return {
        success: false,
        error: queryError.message || "그룹 목록 조회에 실패했습니다.",
      };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    console.log("✅ 그룹 목록 조회 완료:", {
      count: groups?.length || 0,
      total,
      page,
      totalPages,
    });
    console.groupEnd();

    return {
      success: true,
      data: {
        items:
          groups?.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            category: group.category as Group["category"],
            cover_image_url: group.cover_image_url,
            is_public: group.is_public,
            is_family_only: group.is_family_only,
            owner_id: group.owner_id,
            member_count: group.member_count,
            post_count: group.post_count,
            created_at: group.created_at,
            updated_at: group.updated_at,
          })) || [],
        meta: {
          total,
          page,
          limit,
          total_pages: totalPages,
        },
      },
    };
  } catch (error) {
    console.error("❌ 그룹 목록 조회 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "그룹 목록 조회 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

