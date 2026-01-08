/**
 * @file scripts/extract-recipe-metadata.ts
 * @description 기존 레시피 메타데이터 추출 및 저장 스크립트
 *
 * 주요 기능:
 * 1. 기존 레시피 목록 조회
 * 2. 재료 정보에서 메인 재료 추출
 * 3. 조리법 정보 추출 (foodsafety_rcp_way2 활용)
 * 4. 영양소 기반 강점 분석
 * 5. 메타데이터 저장
 *
 * 사용법:
 * npx tsx scripts/extract-recipe-metadata.ts
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

interface RecipeRow {
  id: string;
  title: string;
  foodsafety_rcp_way2?: string | null; // 조리법
  foodsafety_rcp_pat2?: string | null; // 요리종류
  calories?: number | null;
  carbohydrates?: number | null;
  protein?: number | null;
  fat?: number | null;
  sodium?: number | null;
  main_ingredients?: string[] | null;
  cooking_method?: string | null;
  nutrition_focus?: string[] | null;
}

interface IngredientRow {
  ingredient_name: string;
  category: string;
  quantity: number | null;
}

/**
 * 메인 재료 추출 (재료 목록에서)
 */
function extractMainIngredients(ingredients: IngredientRow[]): string[] {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  // 주요 재료 카테고리 우선순위
  const priorityCategories = ['육류', '해산물', '유제품', '곡물'];
  
  // 카테고리별 재료 그룹화
  const byCategory = new Map<string, IngredientRow[]>();
  for (const ing of ingredients) {
    const category = ing.category || '기타';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(ing);
  }

  const mainIngredients: string[] = [];

  // 우선순위 카테고리에서 메인 재료 추출
  for (const category of priorityCategories) {
    const categoryIngredients = byCategory.get(category);
    if (categoryIngredients && categoryIngredients.length > 0) {
      // 첫 번째 재료를 메인 재료로 간주
      const mainIng = categoryIngredients[0].ingredient_name.trim();
      // 재료명에서 수량 제거 (예: "닭고기 200g" → "닭고기")
      const cleaned = mainIng.split(/\s+/)[0];
      if (cleaned && !mainIngredients.includes(cleaned)) {
        mainIngredients.push(cleaned);
      }
    }
  }

  // 우선순위 카테고리에 없으면 첫 번째 재료 사용
  if (mainIngredients.length === 0 && ingredients.length > 0) {
    const firstIng = ingredients[0].ingredient_name.trim();
    const cleaned = firstIng.split(/\s+/)[0];
    if (cleaned) {
      mainIngredients.push(cleaned);
    }
  }

  return mainIngredients;
}

/**
 * 조리법 추출
 */
function extractCookingMethod(rcpWay2: string | null | undefined): string | null {
  if (!rcpWay2) {
    return null;
  }

  // 조리법 매핑
  const cookingMethodMap: Record<string, string> = {
    '끓이기': '끓이기',
    '찌기': '찌기',
    '굽기': '구이',
    '볶기': '볶음',
    '튀기기': '튀김',
    '무치기': '무침',
    '비빔': '비빔',
    '조리기': '조림',
    '데치기': '데침',
    '삶기': '삶기',
  };

  // 직접 매칭
  for (const [key, value] of Object.entries(cookingMethodMap)) {
    if (rcpWay2.includes(key)) {
      return value;
    }
  }

  // 매칭 실패 시 원본 반환
  return rcpWay2;
}

/**
 * 영양소 강점 분석
 */
function extractNutritionFocus(
  calories: number | null,
  protein: number | null,
  carbs: number | null,
  fat: number | null
): string[] {
  const focus: string[] = [];

  // 단백질 강점 (20g 이상)
  if (protein && protein >= 20) {
    focus.push('단백질');
  }

  // 고칼로리 (500kcal 이상) - 에너지 강점
  if (calories && calories >= 500) {
    focus.push('에너지');
  }

  // 저지방 (10g 이하) - 건강식
  if (fat !== null && fat <= 10) {
    focus.push('저지방');
  }

  // 고탄수화물 (50g 이상) - 주식 강점
  if (carbs && carbs >= 50) {
    focus.push('탄수화물');
  }

  return focus;
}

/**
 * 레시피 메타데이터 추출 및 저장
 */
async function extractAndSaveMetadata(recipe: RecipeRow, ingredients: IngredientRow[]): Promise<boolean> {
  try {
    console.group(`📝 메타데이터 추출: ${recipe.title}`);

    // 메인 재료 추출
    const mainIngredients = extractMainIngredients(ingredients);
    console.log(`  메인 재료: ${mainIngredients.join(', ')}`);

    // 조리법 추출
    const cookingMethod = extractCookingMethod(recipe.foodsafety_rcp_way2);
    console.log(`  조리법: ${cookingMethod || '없음'}`);

    // 영양소 강점 추출
    const nutritionFocus = extractNutritionFocus(
      recipe.calories || null,
      recipe.protein || null,
      recipe.carbohydrates || null,
      recipe.fat || null
    );
    console.log(`  영양소 강점: ${nutritionFocus.join(', ') || '없음'}`);

    // 변경사항이 있는지 확인
    const hasChanges =
      JSON.stringify(mainIngredients.sort()) !== JSON.stringify((recipe.main_ingredients || []).sort()) ||
      cookingMethod !== (recipe.cooking_method || null) ||
      JSON.stringify(nutritionFocus.sort()) !== JSON.stringify((recipe.nutrition_focus || []).sort());

    if (!hasChanges) {
      console.log(`  ℹ️ 변경사항 없음, 건너뜀`);
      console.groupEnd();
      return true;
    }

    // 메타데이터 업데이트
    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('recipes')
      .update({
        main_ingredients: mainIngredients.length > 0 ? mainIngredients : null,
        cooking_method: cookingMethod,
        nutrition_focus: nutritionFocus.length > 0 ? nutritionFocus : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipe.id);

    if (error) {
      console.error(`  ❌ 업데이트 실패:`, error);
      console.groupEnd();
      return false;
    }

    console.log(`  ✅ 메타데이터 저장 완료`);
    console.groupEnd();
    return true;
  } catch (error) {
    console.error(`  ❌ 오류 발생:`, error);
    console.groupEnd();
    return false;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.group("📊 레시피 메타데이터 추출 시작");
  console.log(new Date().toISOString());

  try {
    const supabase = getServiceRoleClient();

    // 1. 모든 레시피 조회 (메타데이터가 없거나 불완전한 레시피 우선)
    console.log("\n🔍 레시피 목록 조회 중...");
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, foodsafety_rcp_way2, foodsafety_rcp_pat2, calories, carbohydrates, protein, fat, sodium, main_ingredients, cooking_method, nutrition_focus')
      .order('created_at', { ascending: false })
      .limit(1000); // 한 번에 최대 1000개 처리

    if (recipesError) {
      throw new Error(`레시피 조회 실패: ${recipesError.message}`);
    }

    if (!recipes || recipes.length === 0) {
      console.log("⚠️ 조회된 레시피가 없습니다");
      console.groupEnd();
      return;
    }

    console.log(`✅ ${recipes.length}개의 레시피 조회 완료`);

    // 2. 각 레시피의 메타데이터 추출 및 저장
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const recipe of recipes as RecipeRow[]) {
      // 재료 정보 조회
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('ingredient_name, category, quantity')
        .eq('recipe_id', recipe.id)
        .order('display_order', { ascending: true });

      if (ingredientsError) {
        console.error(`❌ 재료 조회 실패 (${recipe.title}):`, ingredientsError);
        failCount++;
        continue;
      }

      if (!ingredients || ingredients.length === 0) {
        console.log(`⚠️ 재료 정보 없음, 건너뜀: ${recipe.title}`);
        skipCount++;
        continue;
      }

      // 메타데이터 추출 및 저장
      const success = await extractAndSaveMetadata(recipe, ingredients as IngredientRow[]);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // API 레이트 리밋 방지를 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 3. 결과 요약
    console.log("\n=== 레시피 메타데이터 추출 완료 ===");
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`⚠️ 건너뜀: ${skipCount}개`);
    console.log(`📊 총 처리: ${recipes.length}개`);
    console.groupEnd();
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    console.groupEnd();
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });
}

export { main, extractMainIngredients, extractCookingMethod, extractNutritionFocus };

