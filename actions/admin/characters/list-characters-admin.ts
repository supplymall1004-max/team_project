/**
 * @file actions/admin/characters/list-characters-admin.ts
 * @description 관리자용 캐릭터 목록 조회 Server Action
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/types/admin/character: AdminCharacter, AdminPaginationParams, AdminCharacterFilters
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  AdminCharacter,
  AdminPaginationParams,
  AdminCharacterFilters,
} from "@/types/admin/character";

interface ListCharactersAdminParams extends AdminPaginationParams, AdminCharacterFilters {}

/**
 * 관리자용 캐릭터 목록 조회
 */
export async function listCharactersAdmin(
  params: ListCharactersAdminParams = {}
): Promise<{
  success: boolean;
  error?: string;
  data?: AdminCharacter[];
  total?: number;
}> {
  try {
    console.group("[AdminCharacters][ListCharacters] 캐릭터 목록 조회 시작");

    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      search,
      healthScoreMin,
      healthScoreMax,
      levelMin,
      levelMax,
      userId,
    } = params;

    const supabase = getServiceRoleClient();

    let query = supabase
      .from("family_members")
      .select(`
        *,
        users!family_members_user_id_fkey(id, name, clerk_id),
        character_levels!character_levels_family_member_id_fkey(level, experience, experience_to_next_level, last_level_up_at)
      `);

    // 필터링
    if (search) {
      query = query.or(`name.ilike.%${search}%,relationship.ilike.%${search}%`);
    }

    if (healthScoreMin !== undefined) {
      query = query.gte("health_score", healthScoreMin);
    }

    if (healthScoreMax !== undefined) {
      query = query.lte("health_score", healthScoreMax);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ 캐릭터 목록 조회 실패:", error);
      throw error;
    }

    // 레벨 필터링은 조회 후 처리
    let characters: AdminCharacter[] = (data || []).map((member: any) => {
      const levelData = Array.isArray(member.character_levels)
        ? member.character_levels[0]
        : member.character_levels;

      return {
        id: member.id,
        userId: member.user_id,
        userName: member.users?.name || "알 수 없음",
        familyMemberId: member.id,
        name: member.name,
        relationship: member.relationship,
        avatarType: member.avatar_type,
        photoUrl: member.photo_url,
        healthScore: member.health_score,
        healthScoreUpdatedAt: member.health_score_updated_at,
        level: levelData?.level || 1,
        experience: levelData?.experience || 0,
        experienceToNextLevel: levelData?.experience_to_next_level || 100,
        lastLevelUpAt: levelData?.last_level_up_at,
        createdAt: member.created_at,
        updatedAt: member.updated_at,
      };
    });

    // 레벨 필터링
    if (levelMin !== undefined) {
      characters = characters.filter((c) => c.level >= levelMin);
    }
    if (levelMax !== undefined) {
      characters = characters.filter((c) => c.level <= levelMax);
    }

    console.log("✅ 캐릭터 목록 조회 완료");
    console.log("📊 조회된 캐릭터 수:", characters.length);
    console.groupEnd();

    return {
      success: true,
      data: characters,
      total: count || 0,
    };
  } catch (error) {
    console.error("❌ 캐릭터 목록 조회 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

