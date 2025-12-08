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

    // 저장된 식단 조회 (GET 요청은 기존 식단만 조회, 자동 생성하지 않음)
    console.log("🔍 기존 식단 조회 중...");
    const dietPlan = await getDailyDietPlan(userData.id, date);
    console.log("🔍 기존 식단 조회 결과:", dietPlan ? "있음" : "없음");

    // 식단이 없으면 404 반환 (자동 생성하지 않음)
    if (!dietPlan) {
      return NextResponse.json(
        { error: "해당 날짜의 식단을 찾을 수 없습니다." },
        { status: 404 }
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
    
    // 요청 본문에서 includeFavorites 읽기
    let includeFavorites = false;
    try {
      const body = await request.json().catch(() => ({}));
      includeFavorites = body.includeFavorites === true;
    } catch {
      // 본문이 없거나 파싱 실패 시 기본값 사용
    }

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
      // force=true인 경우에만 강제 생성 (사용자가 명시적으로 생성 버튼을 클릭한 경우)
      console.log("🤖 강제 식단 생성 중...");
      console.log("⭐ 찜한 식단 포함:", includeFavorites);
      dietPlan = await generateAndSaveDietPlan(userData.id, date, includeFavorites);
      console.log("🤖 강제 생성 결과:", dietPlan ? "성공" : "실패");
    } else {
      // force=false인 경우: 저장된 식단만 조회 (자동 생성하지 않음)
      console.log("🔍 기존 식단 확인 중...");
      dietPlan = await getDailyDietPlan(userData.id, date);
      console.log("🔍 기존 식단 존재:", dietPlan ? "있음" : "없음");

      // 저장된 식단이 없으면 null 반환 (자동 생성하지 않음)
      // 사용자가 명시적으로 "지금 식단 생성하기" 버튼을 클릭해야만 생성됨
      if (!dietPlan) {
        console.log("⚠️ 저장된 식단이 없습니다. 사용자가 생성 버튼을 클릭해야 합니다.");
        return NextResponse.json(
          { error: "해당 날짜의 식단을 찾을 수 없습니다. 식단 생성 버튼을 클릭하여 생성해주세요." },
          { status: 404 }
        );
      }
    }

    if (!dietPlan) {
      console.error("❌ 식단 생성 실패 - dietPlan이 null입니다");
      console.error("❌ 가능한 원인:");
      console.error("  1. 건강 정보가 없거나 조회 실패");
      console.error("  2. 사용 가능한 레시피가 없음");
      console.error("  3. 식단 생성 알고리즘 실패");
      console.error("  4. 생성된 식단에 식사가 하나도 없음");
      console.error("  5. 레시피에 title이 없어서 저장 실패");
      
      // 건강 정보 재확인
      const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
      const checkSupabase = getServiceRoleClient();
      const { data: healthCheck } = await checkSupabase
        .from("user_health_profiles")
        .select("id, daily_calorie_goal")
        .eq("user_id", userData.id)
        .maybeSingle();
      
      if (!healthCheck) {
        return NextResponse.json(
          { 
            error: "건강 정보를 찾을 수 없습니다.",
            details: "건강 정보를 먼저 입력해주세요. 건강 정보 페이지로 이동하시겠습니까?"
          },
          { status: 404 }
        );
      }
      
      // 레시피 확인
      const { data: recipeCheck } = await checkSupabase
        .from("recipes")
        .select("id")
        .limit(1);
      
      if (!recipeCheck || recipeCheck.length === 0) {
        return NextResponse.json(
          { 
            error: "레시피 데이터가 없습니다.",
            details: "레시피 데이터베이스가 비어있습니다. 관리자에게 문의해주세요."
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "식단을 생성할 수 없습니다.",
          details: "식단 생성 과정에서 오류가 발생했습니다. 서버 로그를 확인해주세요. 레시피에 제목이 없거나 저장 중 오류가 발생했을 수 있습니다."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ dietPlan }, { status: 201 });
  } catch (error) {
    console.error("❌ diet plan generation API 오류:", error);
    console.error("❌ 오류 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ 오류 메시지:", error instanceof Error ? error.message : String(error));
    console.error("❌ 오류 스택:", error instanceof Error ? error.stack : undefined);
    
    // 에러 메시지에서 더 구체적인 정보 추출
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userFriendlyMessage = "식단을 생성하는데 실패했습니다";
    let details = errorMessage;
    
    // 특정 에러 타입에 대한 사용자 친화적 메시지
    if (errorMessage.includes("건강 정보")) {
      userFriendlyMessage = "건강 정보를 확인할 수 없습니다";
      details = "건강 정보를 먼저 입력해주세요.";
    } else if (errorMessage.includes("레시피")) {
      userFriendlyMessage = "레시피를 불러올 수 없습니다";
      details = "레시피 데이터베이스에 문제가 있을 수 있습니다.";
    } else if (errorMessage.includes("칼로리")) {
      userFriendlyMessage = "칼로리 계산 중 오류가 발생했습니다";
      details = "건강 정보의 칼로리 목표를 확인해주세요.";
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyMessage,
        details: details,
        technicalDetails: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

