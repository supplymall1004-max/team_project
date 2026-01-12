/**
 * @file api/diet/plan/route.ts
 * @description 식단 추천 생성/조회 API
 * 
 * Node.js Runtime 필요: queries.ts에서 fs, path 모듈을 사용하는 recipe-loader를 동적으로 import합니다.
 */

// Node.js Runtime 설정: fs, path 모듈 사용을 위해 필수
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getDailyDietPlan,
  generateAndSaveDietPlan,
} from "@/lib/diet/queries";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";

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

    // 사용자 ID 조회 (없으면 자동 동기화)
    const userRow = await ensureSupabaseUser();
    if (!userRow) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      console.log("❌ 프리미엄 사용자가 아님 - 식단 조회 차단");
      return NextResponse.json(
        { 
          error: "식단 조회는 프리미엄 회원만 이용할 수 있습니다.",
          details: "프리미엄 구독을 통해 건강식단 기능을 이용하실 수 있습니다."
        },
        { status: 403 }
      );
    }

    console.log("🍽️ 사용자 ID:", userRow.id);
    console.log("📅 날짜:", date);

    // 저장된 식단 조회 (GET 요청은 기존 식단만 조회, 자동 생성하지 않음)
    console.log("🔍 기존 식단 조회 중...");
    let dietPlan = await getDailyDietPlan(userRow.id, date);
    console.log("🔍 기존 식단 조회 결과:", dietPlan ? "있음" : "없음");

    // 식단이 없으면 404 반환 (자동 생성하지 않음)
    if (!dietPlan) {
      return NextResponse.json(
        { error: "해당 날짜의 식단을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 개발 환경: 크론/레거시 저장으로 규칙이 깨진 경우 자동 복구 (저녁 누락/칼로리 0/구성요약 비어있음)
    if (process.env.NODE_ENV === "development") {
      const isInvalidMeal = (meal: any): boolean => {
        if (!meal) return true;
        const calories = Number(meal.calories ?? 0);
        const summary = Array.isArray(meal.compositionSummary) ? meal.compositionSummary : [];
        // 한식 구성 규칙(밥 + 반찬3 + 국/찌개) 최소 5개가 정상
        if (summary.length < 3) return true;
        if (calories <= 0) return true;
        return false;
      };

      const hasInvalid =
        isInvalidMeal(dietPlan.breakfast) ||
        isInvalidMeal(dietPlan.lunch) ||
        isInvalidMeal(dietPlan.dinner);

      if (hasInvalid) {
        console.warn("[DietPlan GET] 규칙 위반 식단 감지 → 자동 재생성(개발용)", {
          date,
          breakfast: {
            calories: dietPlan.breakfast?.calories,
            summaryLen: dietPlan.breakfast?.compositionSummary?.length,
            title: dietPlan.breakfast?.recipe?.title,
          },
          lunch: {
            calories: dietPlan.lunch?.calories,
            summaryLen: dietPlan.lunch?.compositionSummary?.length,
            title: dietPlan.lunch?.recipe?.title,
          },
          dinner: {
            calories: dietPlan.dinner?.calories,
            summaryLen: dietPlan.dinner?.compositionSummary?.length,
            title: dietPlan.dinner?.recipe?.title,
          },
        });
        const regenerated = await generateAndSaveDietPlan(userRow.id, date, false);
        if (regenerated) {
          dietPlan = regenerated;
        }
      }
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

    // 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium) {
      console.log("❌ 프리미엄 사용자가 아님 - 식단 생성 차단");
      return NextResponse.json(
        { 
          error: "건강식단 생성은 프리미엄 회원만 이용할 수 있습니다.",
          details: "프리미엄 구독을 통해 건강식단 생성 기능을 이용하실 수 있습니다."
        },
        { status: 403 }
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
      
      // 주간 컨텍스트 확인: 오늘 날짜가 현재 주간 식단 범위에 포함되는지 확인
      const { getThisMonday, getNextMonday, generateWeekDates, getWeekInfo } = await import("@/lib/diet/weekly-diet-generator");
      const thisMonday = getThisMonday();
      const nextMonday = getNextMonday();
      const thisWeekDates = generateWeekDates(thisMonday);
      const nextWeekDates = generateWeekDates(nextMonday);
      
      let usedByCategory: { rice: Set<string>; side: Set<string>; soup: Set<string>; snack: Set<string> } | undefined;
      let preferredRiceType: string | undefined;
      
      // 오늘 날짜가 현재 주간 식단 범위에 포함되는지 확인
      const isInThisWeek = thisWeekDates.includes(date);
      const isInNextWeek = nextWeekDates.includes(date);
      
      if (isInThisWeek || isInNextWeek) {
        const weekStartDate = isInThisWeek ? thisMonday : nextMonday;
        console.log("📅 주간 식단 컨텍스트 확인:", { date, weekStartDate, isInThisWeek, isInNextWeek });
        
        // 주간 식단에서 사용된 레시피 추적 정보 가져오기
        const supabase = getServiceRoleClient();
        
        // 주간 식단 메타데이터 조회
        const weekInfo = getWeekInfo(weekStartDate);
        
        const { data: weeklyPlan } = await supabase
          .from("weekly_diet_plans")
          .select("id")
          .eq("user_id", userData.id)
          .eq("week_year", weekInfo.year)
          .eq("week_number", weekInfo.weekNumber)
          .maybeSingle();
        
        if (weeklyPlan) {
          // 주간 식단이 있으면 해당 주간의 식단에서 사용된 레시피 추적
          const weekDates = generateWeekDates(weekStartDate);
          const { data: existingPlans } = await supabase
            .from("diet_plans")
            .select("meal_type, composition_summary, recipe_title")
            .eq("user_id", userData.id)
            .in("plan_date", weekDates)
            .is("family_member_id", null)
            .eq("is_unified", false);
          
          if (existingPlans && existingPlans.length > 0) {
            usedByCategory = {
              rice: new Set<string>(),
              side: new Set<string>(),
              soup: new Set<string>(),
              snack: new Set<string>(),
            };
            
            // composition_summary에서 레시피 추출
            existingPlans.forEach((plan) => {
              if (!plan.composition_summary) return;
              
              try {
                const composition = typeof plan.composition_summary === 'string'
                  ? JSON.parse(plan.composition_summary)
                  : plan.composition_summary;
                
                if (composition.rice && Array.isArray(composition.rice)) {
                  composition.rice.forEach((item: string) => usedByCategory!.rice.add(item));
                }
                if (composition.sides && Array.isArray(composition.sides)) {
                  composition.sides.forEach((item: string) => usedByCategory!.side.add(item));
                }
                if (composition.soup && Array.isArray(composition.soup)) {
                  composition.soup.forEach((item: string) => usedByCategory!.soup.add(item));
                }
                if (plan.meal_type === 'snack' && plan.recipe_title) {
                  usedByCategory!.snack.add(plan.recipe_title);
                }
              } catch (e) {
                console.warn("⚠️ composition_summary 파싱 실패:", e);
              }
            });
            
            console.log("📋 주간 컨텍스트 적용:", {
              rice: Array.from(usedByCategory.rice),
              side: Array.from(usedByCategory.side),
              soup: Array.from(usedByCategory.soup),
              snack: Array.from(usedByCategory.snack),
            });
          }
        }
      }
      
      dietPlan = await generateAndSaveDietPlan(
        userData.id,
        date,
        includeFavorites,
        usedByCategory, // 주간 컨텍스트 전달
        preferredRiceType // 주간 컨텍스트 전달
      );
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

