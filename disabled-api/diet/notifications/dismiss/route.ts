/**
 * @file app/api/diet/notifications/dismiss/route.ts
 * @description 오늘 알림 닫기 API
 *
 * POST /api/diet/notifications/dismiss
 * 오늘 하루 알림을 닫고 다시 표시하지 않음
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

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

    // ✅ 프로덕션에서 PGRST301 방지: service-role 클라이언트 사용
    const supabase = getServiceRoleClient();

    // 사용자의 Supabase user_id 조회 (없으면 자동 동기화)
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const today = new Date().toISOString().split("T")[0];

    // 요청 데이터 파싱
    const body = await request.json();
    const { dismissed, shown } = body;

    console.log("요청 데이터:", { dismissed, shown });
    console.log("오늘 날짜:", today);

    // 알림 설정 업데이트 또는 생성
    const { data: existingSettings } = await supabase
      .from("diet_notification_settings")
      .select("id")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    // 업데이트 데이터 구성
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dismissed) {
      updateData.last_dismissed_date = today;
      console.log("알림 닫기 기록");
    }

    if (shown) {
      updateData.last_notification_date = today;
      console.log("알림 표시 기록");
    }

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
        console.error("생성 시도한 데이터:", {
          user_id: supabaseUserId,
          ...updateData,
        });
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to create settings",
            details: insertError.message,
            code: insertError.code
          },
          { status: 500 }
        );
      }

      console.log("✅ 알림 설정 생성됨");
    }

    const action = dismissed ? "닫기" : shown ? "표시" : "처리";
    console.log(`✅ 오늘 알림 ${action} 완료`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: dismissed
        ? "Notification dismissed for today"
        : shown
          ? "Notification shown recorded"
          : "Notification action recorded",
      action: dismissed ? "dismissed" : shown ? "shown" : "recorded",
      date: today,
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
