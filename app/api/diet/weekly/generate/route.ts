/**
 * @file app/api/diet/weekly/generate/route.ts
 * @description 주간 식단 생성 API
 *
 * POST /api/diet/weekly/generate
 * - 7일치 식단 생성
 * - 장보기 리스트 통합
 * - 영양 통계 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { toInt, toIntOrNull } from "@/lib/diet/nutrition-normalizer";
import {
  generateWeeklyDiet,
  getThisMonday,
  getNextMonday,
} from "@/lib/diet/weekly-diet-generator";
import { weeklyDietCache } from "@/lib/diet/weekly-diet-cache";
import type { WeeklyDietGenerationOptions } from "@/types/weekly-diet";
import type {
  MealComposition,
  MealType,
  RecipeDetailForDiet,
} from "@/types/recipe";

/**
 * 주간 날짜 배열 생성 (월~일)
 */
function generateWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * ISO 8601 주차 정보 계산
 */
function getWeekInfo(dateString: string): { year: number; weekNumber: number } {
  const date = new Date(dateString);

  // ISO 8601 주차 계산
  const dayOfWeek = date.getDay() || 7; // 일요일=7로 변환
  const nearestThursday = new Date(date);
  nearestThursday.setDate(date.getDate() + 4 - dayOfWeek);

  const year = nearestThursday.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const weekNumber = Math.ceil(
    ((nearestThursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return { year, weekNumber };
}

export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/diet/weekly/generate");
    console.time("[weekly] total");

    // 1. 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await createClerkSupabaseClient();
      console.log("✅ Supabase 클라이언트 생성 완료");
    } catch (supabaseError: unknown) {
      console.error("❌ Supabase 클라이언트 생성 실패:", supabaseError);
      const error = supabaseError as Error;
      console.error("에러 타입:", error?.constructor?.name);
      console.error("에러 메시지:", error?.message);
      console.error("에러 스택:", error?.stack);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to initialize database connection",
          details: error?.message,
        },
        { status: 500 },
      );
    }

    // 2. 요청 body 파싱
    const body = await request.json();
    const {
      weekStartDate, // 'YYYY-MM-DD' (월요일)
      weekType = "this", // 'this' | 'next'
    } = body;

    console.log("요청 주차:", weekType);
    console.log("시작 날짜:", weekStartDate);

    // 3. 사용자 ID 조회 (없으면 생성)
    console.log("🔍 사용자 조회 중...", { clerkUserId });

    // PGRST301 에러를 피하기 위해 service-role 클라이언트 사용
    const serviceSupabase = getServiceRoleClient();

    const { data: users } = await serviceSupabase
      .from("users")
      .select("id, clerk_id, name")
      .eq("clerk_id", clerkUserId)
      .limit(1);

    let userData = users && users.length > 0 ? users[0] : null;

    // 사용자가 없으면 자동 생성 (service-role 클라이언트 사용하여 RLS 우회)
    if (!userData) {
      console.log("ℹ️ 사용자가 DB에 없음. 자동 생성 중...");

      const { data: newUsers, error: insertError } = await serviceSupabase
        .from("users")
        .insert({
          clerk_id: clerkUserId,
          name: "사용자", // 기본 이름
        })
        .select("id, clerk_id, name");

      if (insertError || !newUsers || newUsers.length === 0) {
        console.error("❌ 사용자 생성 실패:", insertError);
        console.error("에러 코드:", insertError?.code);
        console.error("에러 메시지:", insertError?.message);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to create user",
            details: insertError?.message,
          },
          { status: 500 },
        );
      }

      userData = newUsers[0];
      console.log("✅ 사용자 생성 완료:", userData);
    } else {
      console.log("✅ 사용자 조회 완료:", userData);
    }

    if (!userData) {
      console.error("❌ 사용자 데이터 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData.id;

    // 4. 건강 프로필 조회 (service-role 클라이언트 사용)
    console.log("🔍 건강 프로필 조회 중...", { userId });
    console.time("[weekly] fetch profile");
    const { data: profiles, error: profileError } = await serviceSupabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", userId)
      .limit(1);
    console.timeEnd("[weekly] fetch profile");

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (profileError) {
      console.error("❌ 건강 프로필 조회 실패:", profileError);
      console.error("에러 코드:", profileError?.code);
      console.error("에러 메시지:", profileError?.message);
      console.error("에러 상세:", profileError?.details);
      console.error("에러 힌트:", profileError?.hint);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch health profile",
          details: profileError?.message,
          code: profileError?.code,
        },
        { status: 500 },
      );
    }

    if (!profile) {
      console.warn("⚠️ 건강 프로필 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "Health profile not found. Please create one first." },
        { status: 400 },
      );
    }

    // 5. 가족 구성원 조회 (service-role 클라이언트 사용)
    const { data: familyMembers } = await serviceSupabase
      .from("family_members")
      .select("*")
      .eq("user_id", userId);

    console.log(`가족 구성원: ${familyMembers?.length || 0}명`);

    // 6. 주차 시작 날짜 계산
    const calculatedStartDate = weekStartDate
      ? weekStartDate
      : weekType === "next"
        ? getNextMonday()
        : getThisMonday();

    console.log("계산된 시작 날짜:", calculatedStartDate);

    // 6-1. 기존 식단 조회하여 반찬/국/찌개 제외 목록 생성
    const dates = generateWeekDates(calculatedStartDate);
    console.time("[weekly] fetch existing plans for exclusions");
    const { data: existingPlans, error: existingPlansError } =
      await serviceSupabase
        .from("diet_plans")
        .select("plan_date, meal_type, composition_summary, recipe_title")
        .eq("user_id", userId)
        .in("plan_date", dates);
    console.timeEnd("[weekly] fetch existing plans for exclusions");

    const existingUsedByCategory = {
      rice: new Set<string>(),
      side: new Set<string>(),
      soup: new Set<string>(),
      snack: new Set<string>(),
    };

    if (!existingPlansError && existingPlans) {
      console.log(
        `📋 기존 식단 ${existingPlans.length}개 조회됨 - 반찬/국/찌개 제외 목록 생성 중...`,
      );

      for (const plan of existingPlans) {
        // composition_summary에서 반찬/국 추출
        if (plan.composition_summary) {
          try {
            const summary =
              typeof plan.composition_summary === "string"
                ? JSON.parse(plan.composition_summary)
                : plan.composition_summary;

            // 반찬 추출
            if (summary.sides && Array.isArray(summary.sides)) {
              summary.sides.forEach((side: string) => {
                if (side) existingUsedByCategory.side.add(side);
              });
            }

            // 국/찌개 추출
            if (summary.soup && Array.isArray(summary.soup)) {
              summary.soup.forEach((soup: string) => {
                if (soup) existingUsedByCategory.soup.add(soup);
              });
            }

            // 밥 추출
            if (summary.rice && Array.isArray(summary.rice)) {
              summary.rice.forEach((rice: string) => {
                if (rice) existingUsedByCategory.rice.add(rice);
              });
            }
          } catch (e) {
            console.warn("⚠️ composition_summary 파싱 실패:", e);
          }
        }

        // 간식 추출
        if (plan.meal_type === "snack" && plan.recipe_title) {
          existingUsedByCategory.snack.add(plan.recipe_title);
        }
      }

      console.log("📋 기존 식단 제외 목록:", {
        rice: Array.from(existingUsedByCategory.rice),
        side: Array.from(existingUsedByCategory.side),
        soup: Array.from(existingUsedByCategory.soup),
        snack: Array.from(existingUsedByCategory.snack),
      });
    }

    // 6-2. 주차 정보 계산 (생성/저장 전에 필요)
    const weekInfo = getWeekInfo(calculatedStartDate);

    // ✅ 중요(데이터 보호):
    // - 주간 생성/저장에 실패해도 "오늘의 식단이 사라지는" 문제가 발생하면 안 됩니다.
    // - 그래서 여기서는 기존 diet_plans를 미리 삭제하지 않습니다.
    // - 삭제/교체는 "새 데이터 준비 완료 + 저장 직전" 단계에서 안전하게(백업 후) 수행합니다.

    // 7. 주간 식단 생성 (기존 식단 제외 목록 포함)
    console.log("🍱 주간 식단 생성 시작...");
    console.time("[weekly] generateWeeklyDiet");
    const options: WeeklyDietGenerationOptions = {
      userId,
      weekStartDate: calculatedStartDate,
      profile,
      familyMembers: familyMembers || undefined,
      avoidRecentRecipes: true,
      diversityLevel: "medium",
      existingUsedByCategory, // 기존 식단 제외 목록 전달
    };

    let weeklyDiet;
    try {
      weeklyDiet = await generateWeeklyDiet(options);
      console.log("✅ 주간 식단 생성 완료");
    } catch (generateError: unknown) {
      console.error("❌ 주간 식단 생성 중 오류 발생:", generateError);
      const error = generateError as Error;
      console.error("에러 메시지:", error?.message);
      console.error("에러 스택:", error?.stack);
      throw generateError; // 에러를 다시 throw하여 상위 catch에서 처리
    } finally {
      console.timeEnd("[weekly] generateWeeklyDiet");
    }

    // 8. 데이터베이스에 저장
    console.log("\n💾 주간 식단 저장 중...");

    // 8-1. 주간 식단 메타데이터 저장 - service-role 클라이언트 사용
    // 기존 주간 식단 메타데이터는 유니크 제약(user_id, week_year, week_number) 때문에 교체 필요합니다.
    // 단, 식단 레코드(diet_plans) 삭제는 실패 시 데이터 유실이 발생할 수 있으므로 뒤에서 별도 처리합니다.
    const { error: deleteWeeklyPlanError } = await serviceSupabase
      .from("weekly_diet_plans")
      .delete()
      .eq("user_id", userId)
      .eq("week_year", weekInfo.year)
      .eq("week_number", weekInfo.weekNumber);

    if (deleteWeeklyPlanError) {
      console.warn(
        "⚠️ 기존 주간 식단 삭제 실패 (무시):",
        deleteWeeklyPlanError,
      );
    } else {
      console.log("✅ 기존 주간 식단 삭제 완료");
    }

    const { data: savedPlan, error: savePlanError } = await serviceSupabase
      .from("weekly_diet_plans")
      .insert({
        user_id: userId,
        week_start_date: weeklyDiet.metadata.week_start_date,
        week_year: weeklyDiet.metadata.week_year,
        week_number: weeklyDiet.metadata.week_number,
        is_family: weeklyDiet.metadata.is_family,
        total_recipes_count: weeklyDiet.metadata.total_recipes_count,
        generation_duration_ms: weeklyDiet.metadata.generation_duration_ms,
      })
      .select()
      .single();

    if (savePlanError || !savedPlan) {
      console.error("❌ 주간 식단 저장 실패:", savePlanError);
      console.error("에러 코드:", savePlanError?.code);
      console.error("에러 메시지:", savePlanError?.message);
      console.error("에러 상세:", savePlanError?.details);
      console.error("에러 힌트:", savePlanError?.hint);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to save weekly diet plan",
          details: savePlanError?.message,
          code: savePlanError?.code,
        },
        { status: 500 },
      );
    }

    const weeklyPlanId = savedPlan.id;
    console.log("주간 식단 ID:", weeklyPlanId);

    // 8-2. 일별 식단 저장 (diet_plans 테이블에)
    // ✅ 성능 개선:
    // - generateWeeklyDiet 내부에서 개인 식단은 generateAndSaveDietPlan으로 이미 저장됩니다.
    // - 여기서 diet_plans를 다시 삭제→삽입하면 시간이 크게 늘고, 실패 시 복구 로직이 추가로 필요합니다.
    // - 따라서 dailyPlansPersisted=true이면 재저장을 건너뜁니다.
    console.log("💾 일별 식단 저장 상태:", {
      dailyPlansPersisted: weeklyDiet.dailyPlansPersisted,
    });
    if (!weeklyDiet.dailyPlansPersisted) {
      console.time("[weekly] persist diet_plans (fallback path)");
      const dietPlanRecords: Array<{
        user_id: string;
        plan_date: string;
        meal_type: string;
        recipe_id: string | null;
        recipe_title: string;
        recipe_description: string;
        calories: number;
        carbs_g: number;
        protein_g: number;
        fat_g: number;
        sodium_mg: number;
        composition_summary: Record<string, string[]> | null;
        is_unified: boolean;
        family_member_id: string | null;
      }> = [];

      for (const [date, dailyPlan] of Object.entries(weeklyDiet.dailyPlans)) {
        // ✅ 간식은 끼니에 포함하지 않으므로 주간 저장 대상에서 제외합니다.
        const meals = ["breakfast", "lunch", "dinner"] as const;

        for (const mealType of meals) {
          const meal = dailyPlan[mealType];

          if (!meal) continue;

          // MealComposition | RecipeDetailForDiet 타입인 경우 저장
          const mealRecords = buildDietPlanRecords({
            date,
            mealType,
            meal: meal as MealComposition | RecipeDetailForDiet | undefined,
            userId,
          });
          dietPlanRecords.push(...mealRecords);
        }
      }

      if (dietPlanRecords.length > 0) {
        console.log(`💾 ${dietPlanRecords.length}개 식단 레코드 저장 시도...`);

        const dates = generateWeekDates(weeklyDiet.metadata.week_start_date);
        const { data: backupPlans, error: backupError } = await serviceSupabase
          .from("diet_plans")
          .select("*")
          .eq("user_id", userId)
          .is("family_member_id", null)
          .in("plan_date", dates);

        if (backupError) {
          console.warn("⚠️ 기존 식단 백업 조회 실패(복구 불가):", backupError);
        } else {
          console.log(`💾 기존 식단 백업 완료: ${backupPlans?.length || 0}개`);
        }

        const { error: deleteError } = await serviceSupabase
          .from("diet_plans")
          .delete()
          .eq("user_id", userId)
          .is("family_member_id", null)
          .in("plan_date", dates);

        if (deleteError) {
          console.warn("⚠️ 기존 식단 삭제 실패 (무시):", deleteError);
        } else {
          console.log("✅ 기존 식단 삭제 완료");
        }

        const { error: dietPlanError, data: insertedData } =
          await serviceSupabase
            .from("diet_plans")
            .insert(dietPlanRecords)
            .select("id, plan_date, meal_type");

        if (dietPlanError) {
          console.error("⚠️ 일별 식단 저장 실패:", dietPlanError);
          console.error("에러 코드:", dietPlanError?.code);
          console.error("에러 메시지:", dietPlanError?.message);
          console.error("에러 상세:", dietPlanError?.details);

          // 🔁 복구 시도
          if (!backupError && backupPlans && backupPlans.length > 0) {
            console.warn("🔁 저장 실패로 인해 기존 식단 복구를 시도합니다...");
            const { error: restoreError } = await serviceSupabase
              .from("diet_plans")
              .insert(backupPlans);

            if (restoreError) {
              console.error("❌ 기존 식단 복구 실패:", restoreError);
            } else {
              console.log(`✅ 기존 식단 복구 완료: ${backupPlans.length}개`);
            }
          }
        } else {
          console.log(
            `✅ 일별 식단 ${insertedData?.length || dietPlanRecords.length}개 저장 완료`,
          );
        }
      } else {
        console.warn("⚠️ 저장할 식단 레코드가 없습니다");
      }
      console.timeEnd("[weekly] persist diet_plans (fallback path)");
    } else {
      console.log(
        "✅ generateWeeklyDiet에서 diet_plans가 이미 저장되어 재저장을 건너뜁니다.",
      );
    }

    // 8-3. 장보기 리스트 저장 - service-role 클라이언트 사용
    if (weeklyDiet.shoppingList.length > 0) {
      console.time("[weekly] persist shopping list");
      const shoppingRecords = weeklyDiet.shoppingList.map((item) => ({
        weekly_diet_plan_id: weeklyPlanId,
        ingredient_name: item.ingredient_name,
        total_quantity: item.total_quantity,
        unit: item.unit,
        category: item.category,
        recipes_using: item.recipes_using,
        is_purchased: false,
      }));

      const { error: shoppingError } = await serviceSupabase
        .from("weekly_shopping_lists")
        .insert(shoppingRecords);

      if (shoppingError) {
        console.error("⚠️ 장보기 리스트 저장 실패:", shoppingError);
        console.error("에러 코드:", shoppingError?.code);
        console.error("에러 메시지:", shoppingError?.message);
      } else {
        console.log(`✅ 장보기 리스트 ${shoppingRecords.length}개 저장 완료`);
      }
      console.timeEnd("[weekly] persist shopping list");
    }

    // 8-4. 영양 통계 저장 - service-role 클라이언트 사용
    if (weeklyDiet.nutritionStats.length > 0) {
      console.time("[weekly] persist nutrition stats");
      const statsRecords = weeklyDiet.nutritionStats.map((stat) => ({
        weekly_diet_plan_id: weeklyPlanId,
        // DB 스키마(complete_schema.sql)는 day_of_week가 0~6(0=일요일) 체크를 가집니다.
        // 일부 로직은 1~7(7=일요일)로 생성하므로, 저장 전에 0~6으로 정규화합니다.
        day_of_week: stat.day_of_week === 7 ? 0 : stat.day_of_week,
        date: stat.date,
        total_calories: stat.total_calories,
        total_carbohydrates: stat.total_carbohydrates,
        total_protein: stat.total_protein,
        total_fat: stat.total_fat,
        total_sodium: stat.total_sodium,
        meal_count: stat.meal_count,
      }));

      const { error: statsError } = await serviceSupabase
        .from("weekly_nutrition_stats")
        .insert(statsRecords);

      if (statsError) {
        console.error("⚠️ 영양 통계 저장 실패:", statsError);
        console.error("에러 코드:", statsError?.code);
        console.error("에러 메시지:", statsError?.message);
      } else {
        console.log(`✅ 영양 통계 ${statsRecords.length}개 저장 완료`);
      }
      console.timeEnd("[weekly] persist nutrition stats");
    }

    console.log("✅ 주간 식단 생성 및 저장 완료");

    // 캐시 무효화 (새로운 식단이 생성되었으므로)
    try {
      weeklyDietCache.clearCache(clerkUserId, weekType);
      console.log("🗑️ 캐시 무효화 완료:", clerkUserId, weekType);
    } catch (cacheError) {
      console.warn("⚠️ 캐시 무효화 실패:", cacheError);
      // 캐시 실패는 주 식단 생성 실패로 처리하지 않음
    }

    console.groupEnd();

    return NextResponse.json({
      success: true,
      weeklyPlanId,
      weekStartDate: calculatedStartDate,
      weekYear: weeklyDiet.metadata.week_year,
      weekNumber: weeklyDiet.metadata.week_number,
      totalRecipes: weeklyDiet.metadata.total_recipes_count,
      generationTimeMs: weeklyDiet.metadata.generation_duration_ms,
    });
  } catch (error: unknown) {
    console.error("❌ 주간 식단 생성 실패:", error);
    const err = error as Error;
    console.error("에러 타입:", err?.constructor?.name || typeof error);
    console.error("에러 메시지:", err?.message || String(error));
    if (err?.stack) {
      console.error("에러 스택:", err.stack);
    }
    console.groupEnd();
    return NextResponse.json(
      {
        error: error instanceof Error ? err.message : "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 },
    );
  } finally {
    console.timeEnd("[weekly] total");
  }
}

const MEAL_LABEL_MAP: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

interface BuildDietPlanRecordParams {
  date: string;
  mealType: MealType;
  meal: MealComposition | RecipeDetailForDiet | undefined;
  userId: string;
}

type NutritionLike = Record<string, number | string | null | undefined>;

function buildDietPlanRecords({
  date,
  mealType,
  meal,
  userId,
}: BuildDietPlanRecordParams): Array<{
  user_id: string;
  plan_date: string;
  meal_type: string;
  recipe_id: string | null;
  recipe_title: string;
  recipe_description: string;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  sodium_mg: number;
  potassium_mg: number | null;
  phosphorus_mg: number | null;
  gi_index: number | null;
  composition_summary: Record<string, string[]> | null;
  is_unified: boolean;
  family_member_id: string | null;
}> {
  if (!meal) {
    return [];
  }

  if (isMealCompositionMeal(meal) && mealType !== "snack") {
    const record = buildCompositionMealRecord({
      date,
      mealType,
      meal,
      userId,
    });
    return record ? [record] : [];
  }

  const record = buildSingleRecipeRecord({
    date,
    mealType,
    recipe: meal as RecipeDetailForDiet,
    userId,
    summaryKey: mealType === "snack" ? "snack" : "items",
  });
  return record ? [record] : [];
}

function buildCompositionMealRecord({
  date,
  mealType,
  meal,
  userId,
}: {
  date: string;
  mealType: MealType;
  meal: MealComposition;
  userId: string;
}) {
  const summaryItems = getMealCompositionSummaryItems(meal);
  const nutrition = meal.totalNutrition || {};

  const summaryPayload: Record<string, string[]> = {
    items: summaryItems,
    rice: meal.rice?.title ? [meal.rice.title] : [],
    sides: (meal.sides || []).map((side) => side.title).filter(Boolean),
    soup: meal.soup?.title ? [meal.soup.title] : [],
  };

  return {
    user_id: userId,
    plan_date: date,
    meal_type: mealType,
    recipe_id: findFirstRecipeId(meal),
    recipe_title:
      summaryItems.length > 0
        ? summaryItems.join(" · ")
        : `${MEAL_LABEL_MAP[mealType]} 식사`,
    recipe_description: `${MEAL_LABEL_MAP[mealType]} 식사 구성`,
    calories: toInt(getNutritionValue(nutrition, "calories"), 0),
    carbs_g: getNutritionValue(nutrition, "carbohydrates", "carbs"),
    protein_g: getNutritionValue(nutrition, "protein"),
    fat_g: getNutritionValue(nutrition, "fat"),
    sodium_mg: toInt(getNutritionValue(nutrition, "sodium"), 0),
    potassium_mg: toIntOrNull(getNutritionValue(nutrition, "potassium")),
    phosphorus_mg: toIntOrNull(getNutritionValue(nutrition, "phosphorus")),
    gi_index: getNutritionValue(nutrition, "gi") || null,
    composition_summary: summaryPayload,
    is_unified: false,
    family_member_id: null,
  };
}

function buildSingleRecipeRecord({
  date,
  mealType,
  recipe,
  userId,
  summaryKey,
}: {
  date: string;
  mealType: MealType;
  recipe: RecipeDetailForDiet;
  userId: string;
  summaryKey: string;
}) {
  if (!recipe) {
    return null;
  }

  const nutrition = recipe.nutrition || {};
  const summaryItems = recipe.title ? [recipe.title] : [];
  const summaryPayload: Record<string, string[]> = {
    items: summaryItems,
  };
  summaryPayload[summaryKey] = summaryItems;

  return {
    user_id: userId,
    plan_date: date,
    meal_type: mealType,
    recipe_id: recipe.id ?? null,
    recipe_title: recipe.title || `${MEAL_LABEL_MAP[mealType]} 식사`,
    recipe_description:
      recipe.description || `${MEAL_LABEL_MAP[mealType]} 식사`,
    calories: toInt(getNutritionValue(nutrition, "calories"), 0),
    carbs_g: getNutritionValue(nutrition, "carbohydrates", "carbs"),
    protein_g: getNutritionValue(nutrition, "protein"),
    fat_g: getNutritionValue(nutrition, "fat"),
    sodium_mg: toInt(getNutritionValue(nutrition, "sodium"), 0),
    potassium_mg: toIntOrNull(getNutritionValue(nutrition, "potassium")),
    phosphorus_mg: toIntOrNull(getNutritionValue(nutrition, "phosphorus")),
    gi_index: getNutritionValue(nutrition, "gi") || null,
    composition_summary: summaryPayload,
    is_unified: false,
    family_member_id: null,
  };
}

function getMealCompositionSummaryItems(meal: MealComposition): string[] {
  if (meal.compositionSummary?.length) {
    return meal.compositionSummary;
  }

  const items: string[] = [];
  if (meal.rice?.title) {
    items.push(meal.rice.title);
  }
  if (meal.sides?.length) {
    items.push(...meal.sides.map((side) => side.title));
  }
  if (meal.soup?.title) {
    items.push(meal.soup.title);
  }

  return items;
}

function findFirstRecipeId(meal: MealComposition): string | null {
  if (meal.rice?.id) {
    return meal.rice.id;
  }

  if (meal.sides?.length) {
    const sideWithId = meal.sides.find((side) => Boolean(side?.id));
    if (sideWithId?.id) {
      return sideWithId.id;
    }
  }

  if (meal.soup?.id) {
    return meal.soup.id;
  }

  return null;
}

function isMealCompositionMeal(
  meal: MealComposition | RecipeDetailForDiet | undefined,
): meal is MealComposition {
  return Boolean(
    meal &&
    typeof meal === "object" &&
    "totalNutrition" in meal &&
    "sides" in meal,
  );
}

function getNutritionValue(
  nutrition: NutritionLike,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = nutrition?.[key];
    if (value !== undefined && value !== null) {
      return normalizeNutritionValue(value);
    }
  }
  return 0;
}

function normalizeNutritionValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed =
    typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
