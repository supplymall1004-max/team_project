/**
 * @file app/api/users/current/route.ts
 * @description 현재 사용자의 Supabase user_id 조회 API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/users/current
 * 현재 사용자의 Supabase user_id 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/users/current");

    const { userId } = await auth();

    if (!userId) {
      console.log("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const supabase = getServiceRoleClient();
    const clerkId = String(userId);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .maybeSingle();

    if (userError) {
      console.error("❌ 사용자 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch user",
          message: userError.message,
          code: userError.code,
        },
        { status: 500 }
      );
    }

    if (!userData) {
      console.log("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 조회 성공:", userData.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      userId: userData.id,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
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

