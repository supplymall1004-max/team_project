/**
 * @file app/api/diet/weekly/[week]/route.ts
 * @description 주간 식단 조회 API
 * 
 * GET /api/diet/weekly/[week]
 * - 특정 주차의 식단 조회
 * - week 파라미터: 'this' | 'next' | 'YYYY-Www' (예: '2025-W01')
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getThisMonday, getNextMonday } from "@/lib/diet/weekly-diet-generator";

interface RouteParams {
  params: Promise<{
    week: string;
  }>;
}

// diet_plans 테이블에서 조회된 데이터 타입
interface DietPlanFromDB {
  id?: string;
  user_id?: string;
  plan_date?: string;
  date?: string;
  meal_type?: string;
  recipe_id?: string | null;
  recipe_title?: string | null;
  recipe_slug?: string | null;
  recipe_thumbnail_url?: string | null;
  calories?: number | null;
  carbohydrates?: number | null;
  carbs_g?: number | null;
  protein?: number | null;
  protein_g?: number | null;
  fat?: number | null;
  fat_g?: number | null;
  sodium?: number | null;
  sodium_mg?: number | null;
  composition_summary?: string | Record<string, unknown> | null;
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const week = resolvedParams.week;

    console.group(`[API] GET /api/diet/weekly/${week}`);

    // 1. 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증 완료:", clerkUserId);

    // 2. 사용자 ID 조회 (건강 맞춤 식단 큐레이션과 동일한 방식)
    const supabase = getServiceRoleClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("❌ 사용자 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 조회 완료:", userData.id);
    const userId = userData.id;

    // 3. 주차 정보 파싱
    let weekStartDate: string;
    let weekYear: number;
    let weekNumber: number;

    if (week === "this") {
      weekStartDate = getThisMonday();
    } else if (week === "next") {
      weekStartDate = getNextMonday();
    } else if (week.match(/^\d{4}-W\d{1,2}$/)) {
      // YYYY-Www 형식
      const [yearStr, weekStr] = week.split("-W");
      weekYear = parseInt(yearStr);
      weekNumber = parseInt(weekStr);
      
      // 주차 번호로 월요일 날짜 계산
      weekStartDate = getDateFromWeekNumber(weekYear, weekNumber);
    } else {
      console.error("❌ 잘못된 주차 형식:", week);
      console.groupEnd();
      return NextResponse.json(
        { error: "Invalid week format. Use 'this', 'next', or 'YYYY-Www'" },
        { status: 400 }
      );
    }

    // ISO 주차 정보 계산
    if (!weekYear || !weekNumber) {
      const weekInfo = getWeekInfoFromDate(weekStartDate);
      weekYear = weekInfo.year;
      weekNumber = weekInfo.weekNumber;
    }

    console.log("주차:", `${weekYear}-W${weekNumber}`);
    console.log("시작 날짜:", weekStartDate);

    // 4. 주간 식단 메타데이터 조회
    const { data: weeklyPlans, error: planError } = await supabase
      .from("weekly_diet_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_year", weekYear)
      .eq("week_number", weekNumber)
      .limit(1);
    
    const weeklyPlan = weeklyPlans && weeklyPlans.length > 0 ? weeklyPlans[0] : null;

    if (planError) {
      console.error("❌ 주간 식단 조회 실패:", planError);
      console.groupEnd();
      return NextResponse.json(
        { error: "주간 식단을 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    if (!weeklyPlan) {
      console.log("⚠️ 주간 식단 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          exists: false,
          message: "Weekly diet plan not found for this week",
          weekStartDate,
          weekYear,
          weekNumber,
        },
        { status: 404 }
      );
    }

    // 5. 일별 식단 조회 (건강 맞춤 식단 큐레이션과 동일한 방식)
    const dates = generateWeekDates(weekStartDate);
    
    // recipe_id가 TEXT 타입이고 recipes.id가 UUID 타입이므로 조인 없이 조회
    // 주간 식단 요약은 사용자 본인의 식단만 조회 (family_member_id가 NULL인 경우만)
    console.log("🔍 diet_plans 조회 조건:", {
      user_id: userId,
      plan_dates: dates,
      family_member_id: "null",
    });
    
    const { data: dietPlans, error: dietError } = await supabase
      .from("diet_plans")
      .select(
        `
        *,
        composition_summary
        `
      )
      .eq("user_id", userId)
      .is("family_member_id", null) // 사용자 본인의 식단만 조회
      .in("plan_date", dates)
      .order("plan_date", { ascending: true })
      .order("meal_type", { ascending: true });
    
    // 조회 전에 해당 날짜 범위의 모든 식단 확인 (디버깅용)
    const { data: allPlansInRange, error: debugError } = await supabase
      .from("diet_plans")
      .select("id, user_id, plan_date, meal_type, is_unified, family_member_id")
      .eq("user_id", userId)
      .in("plan_date", dates);
    
    if (!debugError && allPlansInRange) {
      console.log(`🔍 날짜 범위 내 전체 식단 레코드: ${allPlansInRange.length}개`);
      console.log("🔍 전체 식단 상세:", allPlansInRange.map(p => ({
        plan_date: p.plan_date,
        meal_type: p.meal_type,
        is_unified: p.is_unified,
        family_member_id: p.family_member_id,
      })));
    }

    if (dietError) {
      console.error("❌ 일별 식단 조회 실패:", dietError);
      console.error("에러 코드:", dietError?.code);
      console.error("에러 메시지:", dietError?.message);
      console.error("에러 상세:", dietError?.details);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "일별 식단을 불러오는데 실패했습니다",
          details: dietError?.message
        },
        { status: 500 }
      );
    }

    console.log(`📊 조회된 식단 레코드 수: ${dietPlans?.length || 0}개`);
    if (dietPlans && dietPlans.length > 0) {
      // 조회된 식단의 타입 분류 로그
      const unifiedCount = dietPlans.filter(p => p.is_unified).length;
      const personalCount = dietPlans.filter(p => !p.is_unified && !p.family_member_id).length;
      const memberCount = dietPlans.filter(p => p.family_member_id).length;
      console.log(`📊 식단 타입 분류: 통합(${unifiedCount}개), 개인(${personalCount}개), 가족구성원(${memberCount}개)`);
    }

    // recipe_id가 UUID 형식인 경우에만 recipes 테이블에서 조회
    const settledResults = await Promise.allSettled(
      (dietPlans || []).map(async (plan: DietPlanFromDB) => {
        if (!plan) {
          console.warn("⚠️ plan이 null 또는 undefined입니다");
          return null;
        }

        let recipe: {
          id: string;
          title: string;
          thumbnail_url: string | null;
          slug: string | null;
        } | null = null;

        const recipeId: string | null =
          typeof plan.recipe_id === "string" ? plan.recipe_id : null;

        const isUuid =
          typeof recipeId === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            recipeId
          );

        if (recipeId && isUuid) {
          try {
            const { data: recipeData, error: recipeError } = await supabase
              .from("recipes")
              .select("id, title, thumbnail_url, slug")
              .eq("id", recipeId)
              .single();

            if (!recipeError && recipeData) {
              recipe = recipeData;
            }
          } catch (e) {
            console.warn(`레시피 조회 실패 (recipe_id: ${recipeId}):`, e);
          }
        }

        const normalizedPlanDate =
          typeof plan.plan_date === "string" && plan.plan_date.length > 0
            ? plan.plan_date
            : plan.date || "";

        const normalizedMealType =
          typeof plan.meal_type === "string" && plan.meal_type.length > 0
            ? plan.meal_type
            : "breakfast";

        const normalizedCalories =
          typeof plan.calories === "number"
            ? plan.calories
            : Number(plan.calories) || 0;

        return {
          ...plan,
          plan_date: normalizedPlanDate,
          meal_type: normalizedMealType,
          calories: normalizedCalories,
          carbohydrates:
            Number(plan.carbs_g) || Number(plan.carbohydrates) || 0,
          protein: Number(plan.protein_g) || Number(plan.protein) || 0,
          fat: Number(plan.fat_g) || Number(plan.fat) || 0,
          sodium: Number(plan.sodium_mg) || Number(plan.sodium) || 0,
          recipe_title: recipe?.title || plan.recipe_title || "",
          recipe_slug: recipe?.slug || plan.recipe_slug || null,
          recipe_thumbnail_url:
            recipe?.thumbnail_url || plan.recipe_thumbnail_url || null,
          recipe, // 조회된 레시피 정보 또는 null
        };
      })
    );

    // 성공한 결과만 필터링
    const transformedDietPlans = settledResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);

    // 6. 장보기 리스트 조회
    const { data: shoppingList, error: shoppingError } = await supabase
      .from("weekly_shopping_lists")
      .select("*")
      .eq("weekly_diet_plan_id", weeklyPlan.id)
      .order("category", { ascending: true })
      .order("ingredient_name", { ascending: true });

    if (shoppingError) {
      console.error("❌ 장보기 리스트 조회 실패:", shoppingError);
      // 장보기 리스트는 선택적이므로 에러가 있어도 계속 진행
    }

    // 7. 영양 통계 조회 또는 재계산
    let nutritionStats: Array<{
      day_of_week: number;
      date: string;
      total_calories: number;
      total_carbohydrates: number;
      total_protein: number;
      total_fat: number;
      total_sodium: number;
      meal_count: number;
    }> = [];
    
    // 먼저 저장된 통계 조회 시도
    const { data: storedStats, error: statsError } = await supabase
      .from("weekly_nutrition_stats")
      .select("*")
      .eq("weekly_diet_plan_id", weeklyPlan.id)
      .order("day_of_week", { ascending: true });

    if (statsError) {
      console.error("❌ 영양 통계 조회 실패:", statsError);
    }

    // 저장된 통계가 있고 7일 모두 있는 경우 사용, 아니면 재계산
    // 저장된 통계의 칼로리가 비정상적으로 작은 경우(하루 1000kcal 미만)도 재계산
    const hasValidStoredStats = storedStats && storedStats.length === 7;
    const hasAbnormalCalories = storedStats?.some(stat => {
      const calories = typeof stat.total_calories === 'number' 
        ? stat.total_calories 
        : Number(stat.total_calories) || 0;
      return calories < 1000; // 하루 1000kcal 미만이면 비정상
    });
    
    if (hasValidStoredStats && !hasAbnormalCalories) {
      nutritionStats = storedStats;
      console.log("✅ 저장된 영양 통계 사용");
    } else {
      if (hasAbnormalCalories) {
        console.log("⚠️ 저장된 통계의 칼로리가 비정상적으로 작아 재계산합니다");
      }
      // diet_plans에서 직접 계산
      console.log("📊 영양 통계 재계산 중...");
      const statsMap = new Map<string, {
        day_of_week: number;
        date: string;
        total_calories: number;
        total_carbohydrates: number;
        total_protein: number;
        total_fat: number;
        total_sodium: number;
        meal_count: number;
      }>();

      // 각 날짜별로 초기화 (7일 모두)
      dates.forEach((date, index) => {
        const dayOfWeek = index + 1; // 1=월요일, 7=일요일
        statsMap.set(date, {
          day_of_week: dayOfWeek,
          date,
          total_calories: 0,
          total_carbohydrates: 0,
          total_protein: 0,
          total_fat: 0,
          total_sodium: 0,
          meal_count: 0,
        });
      });

      // 칼로리 재계산이 필요한 plan들을 먼저 수집
      const plansNeedingRecalculation = new Map<string, string[]>(); // key: plan_date + meal_type, value: itemNames
      const allItemNames = new Set<string>();
      
      for (const plan of transformedDietPlans) {
        if (!plan) continue;
        
        const planDate = plan.plan_date;
        const mealType = plan.meal_type || '';
        const planKey = `${planDate}_${mealType}`;
        
        const calories = typeof plan.calories === 'number' 
          ? plan.calories 
          : Number(plan.calories) || 0;
        
        // 칼로리가 비정상적으로 작은 경우 (200kcal 미만) composition_summary에서 재계산 필요
        if (calories < 200 && plan.composition_summary) {
          try {
            const compositionSummary = typeof plan.composition_summary === 'string'
              ? JSON.parse(plan.composition_summary)
              : plan.composition_summary;
            
            if (compositionSummary && typeof compositionSummary === 'object') {
              const itemNames: string[] = [];
              if (Array.isArray(compositionSummary.items)) {
                itemNames.push(...compositionSummary.items);
              }
              if (Array.isArray(compositionSummary.rice)) {
                itemNames.push(...compositionSummary.rice);
              }
              if (Array.isArray(compositionSummary.sides)) {
                itemNames.push(...compositionSummary.sides);
              }
              if (Array.isArray(compositionSummary.soup)) {
                itemNames.push(...compositionSummary.soup);
              }
              
              if (itemNames.length > 0) {
                plansNeedingRecalculation.set(planKey, itemNames);
                itemNames.forEach(name => allItemNames.add(name));
              }
            }
          } catch (e) {
            console.warn(`⚠️ composition_summary 파싱 실패:`, e);
          }
        }
      }
      
      // 필요한 모든 레시피를 한 번에 조회
      const recipeCaloriesMap = new Map<string, number>();
      if (allItemNames.size > 0) {
        const { data: recipes, error: recipeError } = await supabase
          .from("recipes")
          .select("title, calories")
          .in("title", Array.from(allItemNames));
        
        if (!recipeError && recipes) {
          recipes.forEach(recipe => {
            const recipeCalories = typeof recipe.calories === 'number' 
              ? recipe.calories 
              : Number(recipe.calories) || 0;
            recipeCaloriesMap.set(recipe.title, recipeCalories);
          });
          console.log(`📊 ${recipes.length}개 레시피의 칼로리 정보 조회 완료`);
        } else if (recipeError) {
          console.warn(`⚠️ 레시피 칼로리 조회 실패:`, recipeError);
        }
      }
      
      // diet_plans에서 각 식사의 영양 정보 합산
      console.log(`📊 총 ${transformedDietPlans.length}개 식단 레코드 처리 중...`);
      console.log(`📊 재계산 필요한 식단: ${plansNeedingRecalculation.size}개`);
      
      for (const plan of transformedDietPlans) {
        if (!plan) continue;
        
        const planDate = plan.plan_date;
        if (!planDate) {
          console.warn("⚠️ plan_date가 없는 식단 레코드:", plan);
          continue;
        }
        
        const stat = statsMap.get(planDate);
        if (!stat) {
          console.warn(`⚠️ 날짜 ${planDate}에 대한 통계 맵이 없습니다`);
          continue;
        }

        // 칼로리 계산: 여러 필드명 지원
        let calories = typeof plan.calories === 'number' 
          ? plan.calories 
          : Number(plan.calories) || 0;
        
        const mealType = plan.meal_type || '';
        const planKey = `${planDate}_${mealType}`;
        
        // 칼로리가 비정상적으로 작은 경우 재계산된 값 사용
        const itemNames = plansNeedingRecalculation.get(planKey);
        if (itemNames && itemNames.length > 0) {
          const recalculatedCalories = itemNames.reduce((sum, itemName) => {
            const itemCalories = recipeCaloriesMap.get(itemName) || 0;
            return sum + itemCalories;
          }, 0);
          
          if (recalculatedCalories > calories) {
            console.log(`📊 칼로리 재계산: ${mealType} (${planDate}) - 저장된 값: ${calories}kcal → 재계산 값: ${recalculatedCalories}kcal`);
            calories = recalculatedCalories;
          } else if (recalculatedCalories === 0) {
            console.warn(`⚠️ 레시피를 찾지 못함: ${mealType} (${planDate}), 구성품: ${itemNames.join(', ')}`);
          }
        } else if (calories < 200 && calories > 0) {
          // composition_summary가 없지만 칼로리가 비정상적으로 작은 경우 경고
          console.warn(`⚠️ 칼로리가 비정상적으로 작음: ${mealType} (${planDate}) - ${calories}kcal, composition_summary: ${plan.composition_summary ? '있음' : '없음'}`);
        }
        
        const carbs = typeof plan.carbohydrates === 'number'
          ? plan.carbohydrates
          : Number(plan.carbs_g) || Number(plan.carbohydrates) || 0;
        const protein = typeof plan.protein === 'number'
          ? plan.protein
          : Number(plan.protein_g) || Number(plan.protein) || 0;
        const fat = typeof plan.fat === 'number'
          ? plan.fat
          : Number(plan.fat_g) || Number(plan.fat) || 0;
        const sodium = typeof plan.sodium === 'number'
          ? plan.sodium
          : Number(plan.sodium_mg) || Number(plan.sodium) || 0;

        stat.total_calories += calories;
        stat.total_carbohydrates += carbs;
        stat.total_protein += protein;
        stat.total_fat += fat;
        stat.total_sodium += sodium;
        stat.meal_count += 1;
      }

      nutritionStats = Array.from(statsMap.values()).sort((a, b) => a.day_of_week - b.day_of_week);
      console.log("✅ 영양 통계 재계산 완료:", nutritionStats.length, "일");
      const totalCalories = nutritionStats.reduce((sum, stat) => sum + stat.total_calories, 0);
      console.log("📊 총 칼로리:", totalCalories, "kcal");
      console.log("📊 일별 칼로리 상세:", nutritionStats.map(stat => ({
        날짜: stat.date,
        요일: stat.day_of_week,
        칼로리: stat.total_calories,
        식사수: stat.meal_count
      })));
    }

    console.log("✅ 주간 식단 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      exists: true,
      metadata: weeklyPlan,
      dailyPlans: transformedDietPlans,
      shoppingList: shoppingList || [],
      nutritionStats: nutritionStats,
      weekStartDate: weekStartDate,
    });
  } catch (error) {
    console.error("❌ 주간 식단 조회 실패:", error);
    console.error("❌ 오류 상세:", error instanceof Error ? error.message : String(error));
    console.error("❌ 오류 스택:", error instanceof Error ? error.stack : undefined);
    console.groupEnd();
    return NextResponse.json(
      { 
        error: "주간 식단을 불러오는데 실패했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
      },
      { status: 500 }
    );
  }
}

/**
 * 날짜로부터 ISO 주차 정보 계산
 */
function getWeekInfoFromDate(dateString: string): {
  year: number;
  weekNumber: number;
} {
  const date = new Date(dateString);
  
  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  const dayOfWeek = date.getDay() || 7;
  const nearestThursday = new Date(date);
  nearestThursday.setDate(date.getDate() + 4 - dayOfWeek);

  const year = nearestThursday.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const weekNumber = Math.ceil(
    ((nearestThursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  return { year, weekNumber };
}

/**
 * ISO 주차 번호로부터 월요일 날짜 계산
 */
function getDateFromWeekNumber(year: number, week: number): string {
  // ISO 8601: 첫 주의 목요일이 포함된 주
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4Day + 1);

  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);

  return targetMonday.toISOString().split("T")[0];
}

/**
 * 주간 날짜 배열 생성
 */
function generateWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);

  // 유효한 날짜인지 확인
  if (isNaN(start.getTime())) {
    throw new Error(`Invalid start date: ${startDate}`);
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const isoString = date.toISOString().split("T")[0];
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date generated from start date: ${startDate}, day offset: ${i}`);
    }
    
    dates.push(isoString);
  }

  return dates;
}

