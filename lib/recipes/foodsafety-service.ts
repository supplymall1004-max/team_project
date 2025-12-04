/**
 * @file foodsafety-service.ts
 * @description 식약처 API 데이터를 DB 형식으로 변환하는 서비스
 *
 * 주요 기능:
 * 1. 식약처 API 데이터를 RecipeDetail 형식으로 변환
 * 2. 재료 정보 파싱 (RCP_PARTS_DTLS → RecipeIngredient[])
 * 3. 조리 방법 파싱 (MANUAL01~20 → RecipeStep[])
 * 4. DB 저장 로직
 */

import type {
  RecipeDetail,
  RecipeIngredient,
  RecipeStep,
  IngredientCategory,
} from "@/types/recipe";
import type { FoodSafetyRecipeRow } from "./foodsafety-api";
import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 재료 정보 파싱
 * RCP_PARTS_DTLS 형식: "재료1:양1, 재료2:양2, ..." 또는 "재료1 양1, 재료2 양2, ..."
 */
function parseIngredients(
  rcpPartsDtls: string,
  recipeId: string
): RecipeIngredient[] {
  if (!rcpPartsDtls || rcpPartsDtls.trim() === "") {
    return [];
  }

  const ingredients: RecipeIngredient[] = [];
  const lines = rcpPartsDtls.split("\n").filter((line) => line.trim() !== "");

  let displayOrder = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 여러 형식 지원:
    // 1. "재료명:양 단위" (예: "돼지고기:200g")
    // 2. "재료명 양 단위" (예: "돼지고기 200g")
    // 3. "재료명" (양 없음)

    let ingredientName = trimmed;
    let quantity: number | null = null;
    let unit: string | null = null;
    let category: IngredientCategory = "기타";

    // 콜론으로 구분된 형식
    if (trimmed.includes(":")) {
      const [name, amount] = trimmed.split(":").map((s) => s.trim());
      ingredientName = name;
      const parsed = parseAmount(amount);
      quantity = parsed.quantity;
      unit = parsed.unit;
    } else {
      // 공백으로 구분된 형식
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        // 마지막 부분이 숫자+단위인지 확인
        const lastPart = parts[parts.length - 1];
        const parsed = parseAmount(lastPart);
        if (parsed.quantity !== null) {
          ingredientName = parts.slice(0, -1).join(" ");
          quantity = parsed.quantity;
          unit = parsed.unit;
        } else {
          ingredientName = trimmed;
        }
      }
    }

    // 카테고리 자동 분류
    category = categorizeIngredient(ingredientName);

    ingredients.push({
      id: `${recipeId}-ingredient-${displayOrder}`,
      recipe_id: recipeId,
      ingredient_name: ingredientName,
      quantity,
      unit,
      category,
      is_optional: false,
      preparation_note: null,
      display_order: displayOrder,
      created_at: new Date().toISOString(),
      // 하위 호환성
      name: ingredientName,
      notes: null,
      order_index: displayOrder,
    });

    displayOrder++;
  }

  return ingredients;
}

/**
 * 양 파싱 (예: "200g" → { quantity: 200, unit: "g" })
 */
function parseAmount(amountStr: string): {
  quantity: number | null;
  unit: string | null;
} {
  if (!amountStr) {
    return { quantity: null, unit: null };
  }

  const trimmed = amountStr.trim();
  const match = trimmed.match(/^([\d.]+)\s*([가-힣a-zA-Z]+)?$/);

  if (match) {
    const quantity = parseFloat(match[1]);
    const unit = match[2] || null;
    return { quantity: isNaN(quantity) ? null : quantity, unit };
  }

  return { quantity: null, unit: null };
}

/**
 * 재료 카테고리 자동 분류
 */
function categorizeIngredient(ingredientName: string): IngredientCategory {
  const name = ingredientName.toLowerCase();

  // 곡물
  if (
    name.includes("쌀") ||
    name.includes("밥") ||
    name.includes("rice") ||
    name.includes("보리") ||
    name.includes("밀") ||
    name.includes("옥수수") ||
    name.includes("콩")
  ) {
    return "곡물";
  }

  // 채소
  if (
    name.includes("나물") ||
    name.includes("시금치") ||
    name.includes("콩나물") ||
    name.includes("배추") ||
    name.includes("양배추") ||
    name.includes("상추") ||
    name.includes("당근") ||
    name.includes("양파") ||
    name.includes("마늘") ||
    name.includes("생강") ||
    name.includes("대파") ||
    name.includes("부추") ||
    name.includes("미나리") ||
    name.includes("고사리") ||
    name.includes("도라지") ||
    name.includes("우엉") ||
    name.includes("오이") ||
    name.includes("가지") ||
    name.includes("애호박") ||
    name.includes("무") ||
    name.includes("감자") ||
    name.includes("고구마")
  ) {
    return "채소";
  }

  // 과일
  if (
    name.includes("과일") ||
    name.includes("사과") ||
    name.includes("배") ||
    name.includes("귤") ||
    name.includes("오렌지") ||
    name.includes("포도") ||
    name.includes("딸기") ||
    name.includes("바나나") ||
    name.includes("수박") ||
    name.includes("참외") ||
    name.includes("복숭아")
  ) {
    return "과일";
  }

  // 육류
  if (
    name.includes("고기") ||
    name.includes("돼지") ||
    name.includes("소고기") ||
    name.includes("닭") ||
    name.includes("오리") ||
    name.includes("양고기") ||
    name.includes("meat") ||
    name.includes("beef") ||
    name.includes("pork") ||
    name.includes("chicken")
  ) {
    return "육류";
  }

  // 해산물
  if (
    name.includes("생선") ||
    name.includes("고등어") ||
    name.includes("연어") ||
    name.includes("참치") ||
    name.includes("새우") ||
    name.includes("게") ||
    name.includes("오징어") ||
    name.includes("문어") ||
    name.includes("조개") ||
    name.includes("굴") ||
    name.includes("미역") ||
    name.includes("김") ||
    name.includes("해조류") ||
    name.includes("fish") ||
    name.includes("seafood")
  ) {
    return "해산물";
  }

  // 유제품
  if (
    name.includes("우유") ||
    name.includes("치즈") ||
    name.includes("버터") ||
    name.includes("요거트") ||
    name.includes("요구르트") ||
    name.includes("milk") ||
    name.includes("cheese") ||
    name.includes("butter")
  ) {
    return "유제품";
  }

  // 조미료
  if (
    name.includes("소금") ||
    name.includes("설탕") ||
    name.includes("후추") ||
    name.includes("고춧가루") ||
    name.includes("된장") ||
    name.includes("고추장") ||
    name.includes("간장") ||
    name.includes("식초") ||
    name.includes("참기름") ||
    name.includes("들기름") ||
    name.includes("올리브유") ||
    name.includes("식용유") ||
    name.includes("물엿") ||
    name.includes("꿀") ||
    name.includes("salt") ||
    name.includes("sugar") ||
    name.includes("pepper") ||
    name.includes("soy") ||
    name.includes("vinegar") ||
    name.includes("oil")
  ) {
    return "조미료";
  }

  return "기타";
}

/**
 * 조리 방법 파싱
 * MANUAL01~20을 RecipeStep[]로 변환
 */
function parseSteps(
  recipeRow: FoodSafetyRecipeRow,
  recipeId: string
): RecipeStep[] {
  const steps: RecipeStep[] = [];
  let stepNumber = 1;

  for (let i = 1; i <= 20; i++) {
    const manualKey = `MANUAL${i.toString().padStart(2, "0")}` as keyof FoodSafetyRecipeRow;
    const manualImgKey = `MANUAL_IMG${i.toString().padStart(2, "0")}` as keyof FoodSafetyRecipeRow;

    const content = recipeRow[manualKey];
    const imageUrl = recipeRow[manualImgKey];

    if (content && content.trim() !== "") {
      steps.push({
        id: `${recipeId}-step-${stepNumber}`,
        recipe_id: recipeId,
        step_number: stepNumber,
        content: content.trim(),
        image_url: imageUrl && imageUrl.trim() !== "" ? imageUrl.trim() : null,
        video_url: null,
        timer_minutes: null,
        created_at: new Date().toISOString(),
        foodsafety_manual_img:
          imageUrl && imageUrl.trim() !== "" ? imageUrl.trim() : null,
      });

      stepNumber++;
    }
  }

  return steps;
}

/**
 * 난이도 추정 (조리 방법과 요리 종류 기반)
 */
function estimateDifficulty(
  rcpWay2: string,
  rcpPat2: string,
  stepCount: number
): number {
  // 기본 난이도: 3 (보통)
  let difficulty = 3;

  // 조리 방법에 따른 난이도 조정
  if (rcpWay2) {
    const way = rcpWay2.toLowerCase();
    if (way.includes("볶음") || way.includes("stir-fry")) {
      difficulty = 2; // 쉬움
    } else if (
      way.includes("끓이기") ||
      way.includes("boil") ||
      way.includes("찜") ||
      way.includes("steam")
    ) {
      difficulty = 2; // 쉬움
    } else if (
      way.includes("튀김") ||
      way.includes("fry") ||
      way.includes("구이") ||
      way.includes("grill")
    ) {
      difficulty = 4; // 어려움
    }
  }

  // 조리 단계 수에 따른 난이도 조정
  if (stepCount > 10) {
    difficulty = Math.min(difficulty + 1, 5); // 단계가 많으면 난이도 증가
  } else if (stepCount <= 3) {
    difficulty = Math.max(difficulty - 1, 1); // 단계가 적으면 난이도 감소
  }

  return difficulty;
}

/**
 * 조리 시간 추정 (단계 수 기반, 분 단위)
 */
function estimateCookingTime(stepCount: number): number {
  // 기본: 단계당 3분
  return Math.max(stepCount * 3, 10); // 최소 10분
}

/**
 * slug 생성 (레시피명 기반)
 */
function generateSlug(recipeName: string): string {
  return recipeName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 식약처 API 데이터를 RecipeDetail 형식으로 변환
 */
export function convertFoodSafetyToRecipeDetail(
  recipeRow: FoodSafetyRecipeRow,
  userId: string
): Omit<RecipeDetail, "user" | "rating_stats" | "user_rating"> {
  const recipeId = `foodsafety-${recipeRow.RCP_SEQ}`;
  const slug = generateSlug(recipeRow.RCP_NM);
  const ingredients = parseIngredients(recipeRow.RCP_PARTS_DTLS, recipeId);
  const steps = parseSteps(recipeRow, recipeId);
  const stepCount = steps.length;
  const difficulty = estimateDifficulty(
    recipeRow.RCP_WAY2,
    recipeRow.RCP_PAT2,
    stepCount
  );
  const cookingTimeMinutes = estimateCookingTime(stepCount);

  // 영양 정보 파싱 (문자열 → 숫자)
  const calories = parseFloat(recipeRow.INFO_ENG) || null;
  const carbs = parseFloat(recipeRow.INFO_CAR) || null;
  const protein = parseFloat(recipeRow.INFO_PRO) || null;
  const fat = parseFloat(recipeRow.INFO_FAT) || null;
  const sodium = parseFloat(recipeRow.INFO_NA) || null;
  const fiber = parseFloat(recipeRow.INFO_FIBER) || null;

  return {
    id: recipeId,
    user_id: userId,
    slug,
    title: recipeRow.RCP_NM,
    description: `${recipeRow.RCP_PAT2} | ${recipeRow.RCP_WAY2}`,
    thumbnail_url: recipeRow.ATT_FILE_NO_MAIN || null,
    difficulty,
    cooking_time_minutes: cookingTimeMinutes,
    servings: 1, // 기본값, 식약처 API에는 인분 정보가 없음
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // 식약처 API 필드
    foodsafety_rcp_seq: recipeRow.RCP_SEQ,
    foodsafety_rcp_way2: recipeRow.RCP_WAY2,
    foodsafety_rcp_pat2: recipeRow.RCP_PAT2,
    foodsafety_info_eng: calories,
    foodsafety_info_car: carbs,
    foodsafety_info_pro: protein,
    foodsafety_info_fat: fat,
    foodsafety_info_na: sodium,
    foodsafety_info_fiber: fiber,
    foodsafety_rcp_parts_dtls: recipeRow.RCP_PARTS_DTLS,
    foodsafety_att_file_no_main: recipeRow.ATT_FILE_NO_MAIN || null,
    foodsafety_att_file_no_mk: recipeRow.ATT_FILE_NO_MK || null,
    // 재료 및 단계
    ingredients,
    steps,
  };
}

/**
 * 식약처 API 레시피를 DB에 저장
 */
export async function saveFoodSafetyRecipeToDb(
  recipeRow: FoodSafetyRecipeRow,
  userId: string
): Promise<RecipeDetail | null> {
  console.group("[FoodSafetyService] 레시피 DB 저장");
  console.log("RCP_SEQ", recipeRow.RCP_SEQ);
  console.log("RCP_NM", recipeRow.RCP_NM);

  try {
    const supabase = createClerkSupabaseClient();
    const recipeDetail = convertFoodSafetyToRecipeDetail(recipeRow, userId);

    // 1. 레시피 기본 정보 저장
    const { data: savedRecipe, error: recipeError } = await supabase
      .from("recipes")
      .upsert(
        {
          id: recipeDetail.id,
          user_id: recipeDetail.user_id,
          slug: recipeDetail.slug,
          title: recipeDetail.title,
          description: recipeDetail.description,
          thumbnail_url: recipeDetail.thumbnail_url,
          difficulty: recipeDetail.difficulty,
          cooking_time_minutes: recipeDetail.cooking_time_minutes,
          servings: recipeDetail.servings,
          foodsafety_rcp_seq: recipeDetail.foodsafety_rcp_seq,
          foodsafety_rcp_way2: recipeDetail.foodsafety_rcp_way2,
          foodsafety_rcp_pat2: recipeDetail.foodsafety_rcp_pat2,
          foodsafety_info_eng: recipeDetail.foodsafety_info_eng,
          foodsafety_info_car: recipeDetail.foodsafety_info_car,
          foodsafety_info_pro: recipeDetail.foodsafety_info_pro,
          foodsafety_info_fat: recipeDetail.foodsafety_info_fat,
          foodsafety_info_na: recipeDetail.foodsafety_info_na,
          foodsafety_info_fiber: recipeDetail.foodsafety_info_fiber,
          foodsafety_rcp_parts_dtls: recipeDetail.foodsafety_rcp_parts_dtls,
          foodsafety_att_file_no_main: recipeDetail.foodsafety_att_file_no_main,
          foodsafety_att_file_no_mk: recipeDetail.foodsafety_att_file_no_mk,
        },
        {
          onConflict: "foodsafety_rcp_seq",
        }
      )
      .select()
      .single();

    if (recipeError) {
      console.error("레시피 저장 실패:", recipeError);
      throw recipeError;
    }

    // 2. 기존 재료 삭제 후 새로 저장
    await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeDetail.id);

    if (recipeDetail.ingredients.length > 0) {
      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(recipeDetail.ingredients);

      if (ingredientsError) {
        console.error("재료 저장 실패:", ingredientsError);
        // 재료 저장 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 3. 기존 단계 삭제 후 새로 저장
    await supabase.from("recipe_steps").delete().eq("recipe_id", recipeDetail.id);

    if (recipeDetail.steps.length > 0) {
      const { error: stepsError } = await supabase
        .from("recipe_steps")
        .insert(recipeDetail.steps);

      if (stepsError) {
        console.error("단계 저장 실패:", stepsError);
        // 단계 저장 실패는 치명적이지 않으므로 계속 진행
      }
    }

    console.log("✅ 레시피 저장 성공");
    console.groupEnd();

    // 저장된 레시피를 다시 조회하여 반환
    return {
      ...recipeDetail,
      user: { id: userId, name: "식약처" },
      rating_stats: { rating_count: 0, average_rating: 0 },
    };
  } catch (error) {
    console.error("❌ 레시피 저장 실패:", error);
    console.groupEnd();
    return null;
  }
}

