/**
 * @file lib/recipes/metadata-generator.ts
 * @description 레시피 메타데이터 자동 생성 - 기존 레시피에 메타데이터 추가
 *
 * 주요 기능:
 * 1. 레시피 제목/설명에서 메인 재료 추출
 * 2. 조리법 자동 감지
 * 3. 영양소 강점 분석
 * 4. 연령대 적합성 판단
 *
 * @dependencies
 * - lib/supabase/service-role.ts: Supabase 클라이언트
 * - lib/diet/queries.ts: 레시피 조회
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getRecipesWithNutrition } from "@/lib/diet/queries";
import type { RecipeMetadata } from "@/types/recipe";

/**
 * 레시피 메타데이터 생성 결과
 */
export interface MetadataGenerationResult {
  totalProcessed: number;
  totalUpdated: number;
  errors: string[];
}

/**
 * 모든 레시피에 메타데이터 자동 생성
 * 
 * @param batchSize 배치 크기 (한 번에 처리할 레시피 수)
 * @returns 생성 결과
 */
export async function generateMetadataForAllRecipes(
  batchSize: number = 50
): Promise<MetadataGenerationResult> {
  console.group("📝 레시피 메타데이터 자동 생성");
  
  const result: MetadataGenerationResult = {
    totalProcessed: 0,
    totalUpdated: 0,
    errors: [],
  };
  
  try {
    // 모든 레시피 조회
    const recipes = await getRecipesWithNutrition();
    console.log(`총 ${recipes.length}개의 레시피 발견`);
    
    // 배치 처리
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      console.log(`배치 ${Math.floor(i / batchSize) + 1} 처리 중... (${batch.length}개)`);
      
      for (const recipe of batch) {
        try {
          const metadata = await generateMetadataForRecipe(recipe);
          
          if (metadata) {
            const updated = await saveMetadataToDatabase(recipe.id, metadata);
            if (updated) {
              result.totalUpdated++;
            }
          }
          
          result.totalProcessed++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`${recipe.title}: ${errorMsg}`);
          console.warn(`⚠️ 메타데이터 생성 실패 (${recipe.title}):`, error);
        }
      }
    }
    
    console.log(`✅ 메타데이터 생성 완료: ${result.totalUpdated}/${result.totalProcessed}개 업데이트`);
    console.groupEnd();
    
    return result;
  } catch (error) {
    console.error("❌ 메타데이터 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 단일 레시피에 대한 메타데이터 생성
 */
async function generateMetadataForRecipe(recipe: {
  id: string;
  title: string;
  description?: string | null;
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  sodium: number | null;
}): Promise<Partial<RecipeMetadata> | null> {
  const metadata: Partial<RecipeMetadata> = {
    main_ingredients: [],
    cooking_method: null,
    nutrition_focus: [],
    age_group_suitable: [],
  };
  
  // 1. 메인 재료 추출
  metadata.main_ingredients = extractMainIngredients(recipe.title, recipe.description || "");
  
  // 2. 조리법 추출
  metadata.cooking_method = extractCookingMethod(recipe.title, recipe.description || "");
  
  // 3. 영양소 강점 분석
  metadata.nutrition_focus = analyzeNutritionFocus({
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbohydrates: recipe.carbohydrates || 0,
    fat: recipe.fat || 0,
    sodium: recipe.sodium || 0,
  });
  
  // 4. 연령대 적합성 판단
  metadata.age_group_suitable = determineAgeGroupSuitability(metadata);
  
  return metadata;
}

/**
 * 제목/설명에서 메인 재료 추출
 */
function extractMainIngredients(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const ingredients: string[] = [];
  
  // 일반적인 메인 재료 패턴
  const commonIngredients = [
    "닭고기", "돼지고기", "소고기", "양고기", "오리고기",
    "고등어", "연어", "참치", "새우", "오징어", "문어", "전복",
    "두부", "콩", "계란", "달걀",
    "김치", "된장", "고추장", "멸치",
    "브로콜리", "시금치", "양배추", "배추",
  ];
  
  for (const ingredient of commonIngredients) {
    if (text.includes(ingredient.toLowerCase())) {
      ingredients.push(ingredient);
    }
  }
  
  // 제목에서 첫 번째 명사 추출 (간단한 휴리스틱)
  if (ingredients.length === 0) {
    const titleWords = title.split(/\s+/);
    if (titleWords.length > 0) {
      const firstWord = titleWords[0].replace(/[^\w가-힣]/g, "");
      if (firstWord.length > 1 && !firstWord.match(/^\d+$/)) {
        ingredients.push(firstWord);
      }
    }
  }
  
  return ingredients.slice(0, 3); // 최대 3개
}

/**
 * 제목/설명에서 조리법 추출
 */
function extractCookingMethod(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();
  
  const cookingMethods = [
    { keywords: ["볶음", "볶아", "볶은"], method: "볶음" },
    { keywords: ["조림", "조린", "조린"], method: "조림" },
    { keywords: ["구이", "구운", "굽기"], method: "구이" },
    { keywords: ["찜", "찐", "찐"], method: "찜" },
    { keywords: ["튀김", "튀긴", "튀기기"], method: "튀김" },
    { keywords: ["무침", "무친", "무치기"], method: "무침" },
    { keywords: ["나물", "나물"], method: "나물" },
    { keywords: ["국", "국물"], method: "끓이기" },
    { keywords: ["찌개", "찌개"], method: "끓이기" },
    { keywords: ["탕", "탕"], method: "끓이기" },
    { keywords: ["전", "전"], method: "부침" },
  ];
  
  for (const { keywords, method } of cookingMethods) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return method;
      }
    }
  }
  
  return null;
}

/**
 * 영양소 강점 분석
 */
function analyzeNutritionFocus(nutrition: {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sodium: number;
}): string[] {
  const focus: string[] = [];
  
  // 단백질이 높으면 (20g 이상 또는 칼로리의 20% 이상)
  if (nutrition.protein >= 20 || (nutrition.calories > 0 && nutrition.protein * 4 >= nutrition.calories * 0.2)) {
    focus.push("단백질");
  }
  
  // 탄수화물이 높으면 (40g 이상 또는 칼로리의 50% 이상)
  if (nutrition.carbohydrates >= 40 || (nutrition.calories > 0 && nutrition.carbohydrates * 4 >= nutrition.calories * 0.5)) {
    focus.push("탄수화물");
  }
  
  // 지방이 낮으면 (저지방)
  if (nutrition.fat < 10) {
    focus.push("저지방");
  }
  
  // 나트륨이 낮으면 (저나트륨)
  if (nutrition.sodium < 500) {
    focus.push("저나트륨");
  }
  
  return focus;
}

/**
 * 연령대 적합성 판단
 */
function determineAgeGroupSuitability(metadata: Partial<RecipeMetadata>): string[] {
  const suitable: string[] = [];
  
  // 기본적으로 모든 연령대 적합
  suitable.push("성인");
  
  // 조리법이 부드러우면 어린이/청소년 적합
  if (metadata.cooking_method === "찜" || metadata.cooking_method === "조림") {
    suitable.push("어린이");
    suitable.push("청소년");
  }
  
  // 단백질이 높으면 청소년 적합
  if (metadata.nutrition_focus?.includes("단백질")) {
    if (!suitable.includes("청소년")) {
      suitable.push("청소년");
    }
  }
  
  return suitable;
}

/**
 * 메타데이터를 데이터베이스에 저장
 */
async function saveMetadataToDatabase(
  recipeId: string,
  metadata: Partial<RecipeMetadata>
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    
    const updateData: any = {};
    
    if (metadata.main_ingredients && metadata.main_ingredients.length > 0) {
      updateData.main_ingredients = metadata.main_ingredients;
    }
    
    if (metadata.cooking_method) {
      updateData.cooking_method = metadata.cooking_method;
    }
    
    if (metadata.nutrition_focus && metadata.nutrition_focus.length > 0) {
      updateData.nutrition_focus = metadata.nutrition_focus;
    }
    
    if (metadata.age_group_suitable && metadata.age_group_suitable.length > 0) {
      updateData.age_group_suitable = metadata.age_group_suitable;
    }
    
    if (Object.keys(updateData).length === 0) {
      return false; // 업데이트할 데이터 없음
    }
    
    const { error } = await supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId);
    
    if (error) {
      console.error(`❌ 메타데이터 저장 실패 (${recipeId}):`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 메타데이터 저장 실패 (${recipeId}):`, error);
    return false;
  }
}

