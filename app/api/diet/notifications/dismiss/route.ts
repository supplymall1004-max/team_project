/**
 * @file app/api/diet/notifications/dismiss/route.ts
 * @description 오늘 알림 닫기 API
 *
 * POST /api/diet/notifications/dismiss
 * 오늘 하루 알림을 닫고 다시 표시하지 않음
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/diet/notifications/dismiss
 * 오늘 알림 닫기
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🙅‍♂️ 오늘 알림 닫기");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const today = new Date().toISOString().split("T")[0];

    console.log("오늘 날짜:", today);

    // 알림 설정 업데이트 또는 생성
    const { data: existingSettings } = await supabase
      .from("diet_notification_settings")
      .select("id")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    const updateData = {
      last_dismissed_date: today,
      updated_at: new Date().toISOString(),
    };

    if (existingSettings) {
      // 기존 설정 업데이트
      const { error: updateError } = await supabase
        .from("diet_notification_settings")
        .update(updateData)
        .eq("user_id", supabaseUserId);

      if (updateError) {
        console.error("❌ 설정 업데이트 실패:", updateError);
        console.groupEnd();
        return NextResponse.json(
          { error: "Failed to update settings" },
          { status: 500 }
        );
      }

      console.log("✅ 알림 설정 업데이트됨");
    } else {
      // 새 설정 생성
      const { error: insertError } = await supabase
        .from("diet_notification_settings")
        .insert({
          user_id: supabaseUserId,
          ...updateData,
        });

      if (insertError) {
        console.error("❌ 설정 생성 실패:", insertError);
        console.groupEnd();
        return NextResponse.json(
          { error: "Failed to create settings" },
          { status: 500 }
        );
      }

      console.log("✅ 알림 설정 생성됨");
    }

    console.log("✅ 오늘 알림 닫기 완료 - 내일 다시 표시됨");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "Notification dismissed for today",
      dismissedDate: today,
    });

  } catch (error) {
    console.error("❌ 알림 닫기 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
