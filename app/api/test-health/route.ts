/**
 * @file app/api/test-health/route.ts
 * @description 건강관리 API 테스트용 엔드포인트
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    console.log("🧪 [TEST] 건강관리 API 테스트 시작");

    // 1. Clerk 인증 확인
    const { userId } = await auth();
    console.log("✅ Clerk 인증:", userId ? "성공" : "실패");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();
    console.log("✅ Supabase 클라이언트 생성 성공");

    // 3. 사용자 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    console.log("✅ 사용자 조회:", userData ? "성공" : "실패", userError);

    if (userError) {
      return NextResponse.json({ error: "User lookup failed", details: userError }, { status: 500 });
    }

    // 4. 건강 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", userData.id)
      .maybeSingle();

    console.log("✅ 건강 프로필 조회:", profile ? "성공" : "실패", profileError);

    // 5. 가족 구성원 조회
    const { data: members, error: membersError } = await supabase
      .from("family_members")
      .select("id, user_id, name, birth_date, gender, relationship, diseases, allergies, height_cm, weight_kg, activity_level, dietary_preferences, created_at, updated_at")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: true });

    console.log("✅ 가족 구성원 조회:", members ? "성공" : "실패", membersError);

    // 6. 구독 정보 조회
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("subscription_plan")
      .eq("user_id", userData.id)
      .maybeSingle();

    console.log("✅ 구독 정보 조회:", subscription ? "성공" : "실패", subError);

    return NextResponse.json({
      success: true,
      user: { id: userData.id },
      profile: profile || null,
      members: members || [],
      subscription: subscription || null,
    });

  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
