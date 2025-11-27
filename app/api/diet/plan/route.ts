/**
 * @file api/diet/plan/route.ts
 * @description 식단 추천 생성/조회 API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getDailyDietPlan,
  generateAndSaveDietPlan,
} from "@/lib/diet/queries";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // 사용자 ID 조회
    const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
    const supabase = getServiceRoleClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    console.log("🍽️ 사용자 ID:", userData.id);
    console.log("📅 날짜:", date);

    // 저장된 식단 조회
    console.log("🔍 기존 식단 조회 중...");
    let dietPlan = await getDailyDietPlan(userData.id, date);
    console.log("🔍 기존 식단 조회 결과:", dietPlan ? "있음" : "없음");

    // 없으면 새로 생성
    if (!dietPlan) {
      console.log("🤖 새 식단 생성 중...");
      dietPlan = await generateAndSaveDietPlan(userData.id, date);
      console.log("🤖 식단 생성 결과:", dietPlan ? "성공" : "실패");
    }

    if (!dietPlan) {
      return NextResponse.json(
        { error: "식단을 생성할 수 없습니다. 건강 정보를 확인해주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json({ dietPlan }, { status: 200 });
  } catch (error) {
    console.error("❌ diet plan API 오류:", error);
    console.error("❌ 오류 상세:", error instanceof Error ? error.message : String(error));
    console.error("❌ 오류 스택:", error instanceof Error ? error.stack : undefined);
    return NextResponse.json(
      { 
        error: "식단을 불러오는데 실패했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const force = searchParams.get("force") === "true";

    // 사용자 ID 조회
    const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
    const supabase = getServiceRoleClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    console.log("🍽️ 사용자 ID:", userData.id);
    console.log("📅 날짜:", date);
    console.log("⚡ 강제 생성:", force);

    // 강제 생성이거나 기존 식단이 없는 경우 새로 생성
    let dietPlan;
    if (force) {
      console.log("🤖 강제 식단 생성 중...");
      dietPlan = await generateAndSaveDietPlan(userData.id, date);
      console.log("🤖 강제 생성 결과:", dietPlan ? "성공" : "실패");
    } else {
      console.log("🔍 기존 식단 확인 중...");
      dietPlan = await getDailyDietPlan(userData.id, date);
      console.log("🔍 기존 식단 존재:", dietPlan ? "있음" : "없음");

      if (!dietPlan) {
        console.log("🤖 새 식단 생성 중...");
        dietPlan = await generateAndSaveDietPlan(userData.id, date);
        console.log("🤖 생성 결과:", dietPlan ? "성공" : "실패");
      }
    }

    if (!dietPlan) {
      console.error("❌ 식단 생성 실패 - dietPlan이 null입니다");
      return NextResponse.json(
        { 
          error: "식단을 생성할 수 없습니다. 건강 정보를 확인해주세요.",
          details: "식단 생성 과정에서 오류가 발생했습니다. 브라우저 콘솔을 확인하거나 관리자에게 문의해주세요."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ dietPlan }, { status: 201 });
  } catch (error) {
    console.error("❌ diet plan generation API 오류:", error);
    console.error("❌ 오류 상세:", error instanceof Error ? error.message : String(error));
    console.error("❌ 오류 스택:", error instanceof Error ? error.stack : undefined);
    return NextResponse.json(
      { 
        error: "식단을 생성하는데 실패했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
      },
      { status: 500 }
    );
  }
}

