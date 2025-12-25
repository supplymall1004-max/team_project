/**
 * @file actions/community/create-group.ts
 * @description 그룹 생성 Server Action
 *
 * 사용자가 새로운 커뮤니티 그룹을 생성하고, 소유자로 자동 가입합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/community: CreateGroupInput, Group
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import type { CreateGroupInput, Group, ActionResult } from "@/types/community";

/**
 * 그룹 생성
 *
 * @param input 그룹 생성 입력 데이터
 * @returns 생성된 그룹 정보 또는 에러
 */
export async function createGroup(
  input: CreateGroupInput
): Promise<ActionResult<Group>> {
  try {
    console.group("[CreateGroup] 그룹 생성 시작");
    console.log("input", input);

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

    console.log("✅ 사용자 확인 완료:", user.id);

    // 3. 프리미엄 사용자 확인
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      console.error("❌ 프리미엄 사용자만 그룹을 생성할 수 있습니다");
      console.groupEnd();
      return {
        success: false,
        error:
          premiumCheck.error ||
          "그룹 생성은 프리미엄 회원만 이용할 수 있습니다. 프리미엄으로 업그레이드해주세요.",
      };
    }

    console.log("✅ 프리미엄 사용자 확인 완료");

    // 4. 입력 유효성 검사
    if (!input.name || input.name.trim().length === 0) {
      console.error("❌ 그룹 이름이 필요합니다");
      console.groupEnd();
      return { success: false, error: "그룹 이름을 입력해주세요." };
    }

    if (input.name.length > 100) {
      console.error("❌ 그룹 이름이 너무 깁니다 (최대 100자)");
      console.groupEnd();
      return { success: false, error: "그룹 이름은 100자 이하여야 합니다." };
    }

    if (!input.category) {
      console.error("❌ 그룹 카테고리가 필요합니다");
      console.groupEnd();
      return { success: false, error: "그룹 카테고리를 선택해주세요." };
    }

    const validCategories = ["health", "pet", "recipe", "exercise", "region"];
    if (!validCategories.includes(input.category)) {
      console.error("❌ 유효하지 않은 카테고리:", input.category);
      console.groupEnd();
      return { success: false, error: "유효하지 않은 그룹 카테고리입니다." };
    }

    // 5. 그룹 생성
    const supabase = getServiceRoleClient();

    const { data: group, error: createError } = await supabase
      .from("community_groups")
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        category: input.category,
        cover_image_url: input.cover_image_url || null,
        is_public: input.is_public ?? true,
        is_family_only: input.is_family_only ?? false,
        owner_id: user.id,
        member_count: 0, // 트리거가 1로 업데이트함
        post_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ 그룹 생성 실패:", createError);
      console.groupEnd();
      return {
        success: false,
        error: createError.message || "그룹 생성에 실패했습니다.",
      };
    }

    console.log("✅ 그룹 생성 완료:", group.id);

    // 6. 그룹 소유자 자동 가입
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      console.error("❌ 그룹 소유자 가입 실패:", memberError);
      // 그룹은 생성되었지만 멤버 추가 실패 - 그룹 삭제
      await supabase.from("community_groups").delete().eq("id", group.id);
      console.groupEnd();
      return {
        success: false,
        error: "그룹 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
      };
    }

    console.log("✅ 그룹 소유자 자동 가입 완료");

    // 7. 트리거에 의해 member_count가 1로 업데이트됨
    console.log("✅ 그룹 생성 완료");
    console.groupEnd();

    return {
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category as Group["category"],
        cover_image_url: group.cover_image_url,
        is_public: group.is_public,
        is_family_only: group.is_family_only,
        owner_id: group.owner_id,
        member_count: 1, // 소유자가 가입했으므로 1
        post_count: group.post_count,
        created_at: group.created_at,
        updated_at: group.updated_at,
      },
    };
  } catch (error) {
    console.error("❌ 그룹 생성 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "그룹 생성 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

