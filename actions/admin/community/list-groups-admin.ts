/**
 * @file actions/admin/community/list-groups-admin.ts
 * @description 관리자용 그룹 목록 조회 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/types/admin/community: AdminGroup, AdminPaginationParams, AdminCommunityFilters
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  AdminGroup,
  AdminPaginationParams,
  AdminCommunityFilters,
} from "@/types/admin/community";

interface ListGroupsAdminParams extends AdminPaginationParams, AdminCommunityFilters {}

/**
 * 관리자용 그룹 목록 조회
 */
export async function listGroupsAdmin(
  params: ListGroupsAdminParams = {}
): Promise<{
  success: boolean;
  error?: string;
  data?: AdminGroup[];
  total?: number;
}> {
  try {
    console.group("[AdminCommunity][ListGroups] 그룹 목록 조회 시작");

    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      category,
      search,
      isPublic,
      minMembers,
      minPosts,
    } = params;

    const supabase = getServiceRoleClient();

    let query = supabase
      .from("community_groups")
      .select(`
        *,
        users!community_groups_owner_id_fkey(id, name, clerk_id)
      `);

    // 필터링
    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (isPublic !== undefined) {
      query = query.eq("is_public", isPublic);
    }

    if (minMembers !== undefined) {
      query = query.gte("member_count", minMembers);
    }

    if (minPosts !== undefined) {
      query = query.gte("post_count", minPosts);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ 그룹 목록 조회 실패:", error);
      throw error;
    }

    const groups: AdminGroup[] = (data || []).map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.category,
      cover_image_url: group.cover_image_url,
      is_public: group.is_public,
      is_family_only: group.is_family_only,
      owner_id: group.owner_id,
      member_count: group.member_count,
      post_count: group.post_count,
      created_at: group.created_at,
      updated_at: group.updated_at,
      owner: {
        id: group.users?.id || group.owner_id,
        name: group.users?.name || "알 수 없음",
      },
      memberCount: group.member_count || 0,
      postCount: group.post_count || 0,
      recentActivity: group.updated_at,
    }));

    console.log("✅ 그룹 목록 조회 완료");
    console.log("📊 조회된 그룹 수:", groups.length);
    console.groupEnd();

    return {
      success: true,
      data: groups,
      total: count || 0,
    };
  } catch (error) {
    console.error("❌ 그룹 목록 조회 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

