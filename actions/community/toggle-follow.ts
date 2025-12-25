/**
 * @file actions/community/toggle-follow.ts
 * @description 팔로우 토글 Server Action
 *
 * 사용자를 팔로우하거나 언팔로우합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { ActionResult } from "@/types/community";

/**
 * 팔로우 토글
 *
 * @param followingId 팔로우할 사용자 ID
 * @returns 팔로우 상태 (following: true/false)
 */
export async function toggleFollow(
  followingId: string
): Promise<ActionResult<{ following: boolean }>> {
  try {
    console.group("[ToggleFollow] 팔로우 토글 시작");
    console.log("followingId", followingId);

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

    // 3. 자기 자신 팔로우 방지
    if (user.id === followingId) {
      console.error("❌ 자기 자신을 팔로우할 수 없습니다");
      console.groupEnd();
      return {
        success: false,
        error: "자기 자신을 팔로우할 수 없습니다.",
      };
    }

    // 4. 팔로우 대상 사용자 존재 확인
    const supabase = getServiceRoleClient();

    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", followingId)
      .single();

    if (!targetUser) {
      console.error("❌ 팔로우할 사용자를 찾을 수 없습니다");
      console.groupEnd();
      return { success: false, error: "팔로우할 사용자를 찾을 수 없습니다." };
    }

    // 5. 기존 팔로우 확인
    const { data: existingFollow } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .maybeSingle();

    // 6. 팔로우 토글
    if (existingFollow) {
      // 언팔로우
      const { error: deleteError } = await supabase
        .from("user_follows")
        .delete()
        .eq("id", existingFollow.id);

      if (deleteError) {
        console.error("❌ 언팔로우 실패:", deleteError);
        console.groupEnd();
        return {
          success: false,
          error: deleteError.message || "언팔로우에 실패했습니다.",
        };
      }

      // follower_count와 following_count는 트리거에 의해 자동 감소
      console.log("✅ 언팔로우 완료");
      console.groupEnd();

      return {
        success: true,
        data: { following: false },
      };
    } else {
      // 팔로우
      const { error: insertError } = await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: followingId,
      });

      if (insertError) {
        console.error("❌ 팔로우 실패:", insertError);
        console.groupEnd();
        return {
          success: false,
          error: insertError.message || "팔로우에 실패했습니다.",
        };
      }

      // follower_count와 following_count는 트리거에 의해 자동 증가
      console.log("✅ 팔로우 완료");
      console.groupEnd();

      return {
        success: true,
        data: { following: true },
      };
    }
  } catch (error) {
    console.error("❌ 팔로우 토글 중 예외 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "팔로우 토글 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}

