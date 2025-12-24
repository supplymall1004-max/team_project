/**
 * @file app/api/health/pets/[id]/lifecycle-events/route.ts
 * @description 반려동물 생애주기별 건강 이벤트 조회 API
 * 
 * GET /api/health/pets/[id]/lifecycle-events - 생애주기별 건강 이벤트 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { generatePetLifecycleEvents } from "@/lib/health/pet-lifecycle-events";

/**
 * GET /api/health/pets/[id]/lifecycle-events
 * 반려동물 생애주기별 건강 이벤트 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`🐾 GET /api/health/pets/${id}/lifecycle-events`);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 확인
    const { data: pet, error: petError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (petError || !pet) {
      console.error("❌ 반려동물 조회 실패:", petError);
      console.groupEnd();
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // 생애주기별 건강 이벤트 생성
    const events = generatePetLifecycleEvents(pet as any);

    console.log(`✅ 생애주기 이벤트 조회 완료: ${events.length}건`);
    console.groupEnd();

    return NextResponse.json({
      events,
      count: events.length,
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

