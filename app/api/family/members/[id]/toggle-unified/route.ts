/**
 * @file app/api/family/members/[id]/toggle-unified/route.ts
 * @description 가족 구성원 통합 식단 포함/제외 토글 API
 *
 * PATCH /api/family/members/[id]/toggle-unified
 * - 현재 값의 반대로 토글 (true ↔ false)
 * - 요청 본문 없음
 * - 응답: { include_in_unified_diet: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * PATCH /api/family/members/[id]/toggle-unified
 * 가족 구성원의 통합 식단 포함/제외 상태를 토글
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("🔄 PATCH /api/family/members/[id]/toggle-unified");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("구성원 ID:", id);

    // 사용자 동기화 보장: 없으면 자동으로 users 테이블에 생성/업데이트
    const userRow = await ensureSupabaseUser();
    if (!userRow) {
      console.error("❌ 사용자 동기화 실패 (ensureSupabaseUser)");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const supabaseUserId = userRow.id;
    const supabase = getServiceRoleClient();

    // 현재 구성원의 통합 식단 포함 상태 조회
    const { data: currentMember } = await supabase
      .from("family_members")
      .select("include_in_unified_diet")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .single();

    if (!currentMember) {
      console.error("❌ 권한 없음 또는 구성원 없음");
      console.groupEnd();
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 현재 값의 반대로 토글
    const currentValue = currentMember.include_in_unified_diet !== false; // null/undefined도 true로 처리
    const newValue = !currentValue;

    console.log(`토글: ${currentValue} → ${newValue}`);

    // 업데이트
    const { data: updatedMember, error } = await supabase
      .from("family_members")
      .update({ include_in_unified_diet: newValue })
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .select("include_in_unified_diet")
      .single();

    if (error) {
      console.error("❌ 업데이트 실패:", error);
      console.groupEnd();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ 토글 성공:", updatedMember.include_in_unified_diet);
    console.groupEnd();

    return NextResponse.json({
      include_in_unified_diet: updatedMember.include_in_unified_diet
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
