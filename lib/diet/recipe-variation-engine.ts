/**
 * @file lib/diet/recipe-variation-engine.ts
 * @description 레시피 변형 엔진 - 메인 재료 기반 변형 레시피 탐색 및 영양소 보완
 *
 * 주요 기능:
 * 1. 메인 재료 기반 레시피 그룹화
 * 2. 변형 레시피 탐색 (조리법/양념/조합)
 * 3. 영양소 부족분 계산
 * 4. 보완 반찬 선택
 *
 * @dependencies
 * - types/recipe.ts: RecipeDetailForDiet, VariationRecipe, NutritionGap
 * - lib/diet/recipe-metadata-queries.ts: 메타데이터 조회
 */

import type {
  RecipeDetailForDiet,
  VariationRecipe,
  NutritionGap,
  VariationLevel,
  RecipeMetadata,
} from "@/types/recipe";
import type { RecipeNutrition } from "@/types/recipe";
import { getRecipeMetadata } from "@/lib/diet/recipe-metadata-queries";

/**
 * 메인 재료 기반 레시피 그룹화
 * 
 * @param recipes 레시피 목록
 * @returns 메인 재료별로 그룹화된 레시피 맵
 */
export async function groupRecipesByMainIngredient(
  recipes: RecipeDetailForDiet[]
): Promise<Map<string, RecipeDetailForDiet[]>> {
  console.group("🔍 레시피 메인 재료 그룹화");
  
  const grouped = new Map<string, RecipeDetailForDiet[]>();
  
  for (const recipe of recipes) {
    // 메타데이터에서 메인 재료 추출 (우선)
    let mainIngredients: string[] = [];
    
    try {
      const metadata = await getRecipeMetadata(recipe.id || "");
      if (metadata && metadata.main_ingredients && metadata.main_ingredients.length > 0) {
        mainIngredients = metadata.main_ingredients;
      }
    } catch (error) {
      // 메타데이터 조회 실패 시 무시하고 재료 목록에서 추출
    }
    
    // 메타데이터가 없으면 재료 목록에서 추출
    if (mainIngredients.length === 0) {
      const extracted = extractMainIngredient(recipe);
      if (extracted) {
        mainIngredients = [extracted];
      }
    }
    
    // 각 메인 재료별로 그룹화
    for (const mainIngredient of mainIngredients) {
      if (!grouped.has(mainIngredient)) {
        grouped.set(mainIngredient, []);
      }
      grouped.get(mainIngredient)!.push(recipe);
    }
  }
  
  console.log(`✅ ${grouped.size}개의 메인 재료 그룹 생성`);
  console.groupEnd();
  
  return grouped;
}

/**
 * 레시피에서 메인 재료 추출
 */
function extractMainIngredient(recipe: RecipeDetailForDiet): string | null {
  // TODO: 향후 메타데이터에서 main_ingredients 배열 사용
  // 현재는 재료 목록에서 추출
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return null;
  }
  
  // 첫 번째 재료를 메인 재료로 간주 (향후 개선 필요)
  const firstIngredient = recipe.ingredients[0];
  if (firstIngredient && firstIngredient.name) {
    // 재료명에서 메인 재료 추출 (예: "닭고기 200g" → "닭고기")
    const name = firstIngredient.name.trim();
    const mainIngredient = name.split(/\s+/)[0];
    return mainIngredient;
  }
  
  return null;
}

/**
 * 변형 레시피 탐색
 * 
 * @param baseRecipe 기준 레시피
 * @param candidateRecipes 후보 레시피 목록
 * @param maxResults 최대 결과 수
 * @returns 변형 레시피 목록 (유사도 순)
 */
export async function findVariationRecipes(
  baseRecipe: RecipeDetailForDiet,
  candidateRecipes: RecipeDetailForDiet[],
  maxResults: number = 5
): Promise<VariationRecipe[]> {
  console.group("🔍 변형 레시피 탐색");
  console.log(`기준 레시피: ${baseRecipe.title}`);
  console.log(`후보 레시피 수: ${candidateRecipes.length}`);
  
  // 기준 레시피 메타데이터 조회
  let baseMetadata: RecipeMetadata | null = null;
  try {
    baseMetadata = await getRecipeMetadata(baseRecipe.id || "");
  } catch (error) {
    console.warn("⚠️ 기준 레시피 메타데이터 조회 실패, 재료 기반으로 진행");
  }
  
  const variations: VariationRecipe[] = [];
  
  for (const candidate of candidateRecipes) {
    // 같은 레시피는 제외
    if (candidate.id === baseRecipe.id || candidate.title === baseRecipe.title) {
      continue;
    }
    
    // 후보 레시피 메타데이터 조회
    let candidateMetadata: RecipeMetadata | null = null;
    try {
      candidateMetadata = await getRecipeMetadata(candidate.id || "");
    } catch (error) {
      // 메타데이터 없으면 무시하고 계속 진행
    }
    
    // 유사도 계산 (메타데이터 활용)
    const similarity = await calculateSimilarityWithMetadata(
      baseRecipe,
      candidate,
      baseMetadata,
      candidateMetadata
    );
    
    if (similarity.score > 0.3) { // 최소 유사도 임계값
      variations.push({
        recipe: candidate,
        similarity_score: similarity.score,
        variation_type: similarity.variationType,
        difference_description: similarity.differenceDescription,
      });
    }
  }
  
  // 유사도 순으로 정렬
  variations.sort((a, b) => b.similarity_score - a.similarity_score);
  
  const results = variations.slice(0, maxResults);
  console.log(`✅ ${results.length}개의 변형 레시피 발견`);
  console.groupEnd();
  
  return results;
}

/**
 * 두 레시피 간 유사도 계산 (메타데이터 활용)
 */
async function calculateSimilarityWithMetadata(
  recipe1: RecipeDetailForDiet,
  recipe2: RecipeDetailForDiet,
  metadata1: RecipeMetadata | null,
  metadata2: RecipeMetadata | null
): Promise<{
  score: number;
  variationType: 'cooking_method' | 'seasoning' | 'combination';
  differenceDescription: string;
}> {
  let score = 0;
  let variationType: 'cooking_method' | 'seasoning' | 'combination' = 'combination';
  const differences: string[] = [];
  
  // 1. 메인 재료 유사도 (40% 가중치)
  let mainIngredientSimilarity = 0;
  if (metadata1 && metadata2) {
    // 메타데이터에서 메인 재료 비교
    const set1 = new Set(metadata1.main_ingredients || []);
    const set2 = new Set(metadata2.main_ingredients || []);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    mainIngredientSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  } else {
    // 메타데이터가 없으면 재료 목록에서 계산
    mainIngredientSimilarity = calculateIngredientSimilarity(
      recipe1.ingredients,
      recipe2.ingredients
    );
  }
  score += mainIngredientSimilarity * 0.4;
  
  // 2. 조리법 유사도 (30% 가중치)
  let cookingMethodSimilarity = 0.5; // 기본값
  if (metadata1 && metadata2 && metadata1.cooking_method && metadata2.cooking_method) {
    cookingMethodSimilarity = metadata1.cooking_method === metadata2.cooking_method ? 1.0 : 0.0;
    if (cookingMethodSimilarity < 1.0) {
      differences.push(`조리법: ${metadata1.cooking_method} → ${metadata2.cooking_method}`);
    }
  }
  score += cookingMethodSimilarity * 0.3;
  
  // 3. 영양소 유사도 (20% 가중치)
  const nutritionSimilarity = calculateNutritionSimilarity(
    recipe1.nutrition,
    recipe2.nutrition
  );
  score += nutritionSimilarity * 0.2;
  
  // 4. 전체 재료 유사도 (10% 가중치)
  const ingredientSimilarity = calculateIngredientSimilarity(
    recipe1.ingredients,
    recipe2.ingredients
  );
  score += ingredientSimilarity * 0.1;
  
  // 변형 타입 판단
  if (mainIngredientSimilarity > 0.7 && cookingMethodSimilarity < 1.0) {
    variationType = 'cooking_method';
    if (differences.length === 0) {
      differences.push('조리법이 다릅니다');
    }
  } else if (mainIngredientSimilarity > 0.5 && ingredientSimilarity > 0.5) {
    variationType = 'seasoning';
    differences.push('양념이 다릅니다');
  } else {
    variationType = 'combination';
    differences.push('재료 조합이 다릅니다');
  }
  
  return {
    score: Math.min(score, 1.0),
    variationType,
    differenceDescription: differences.join(', '),
  };
}

/**
 * 재료 유사도 계산
 */
function calculateIngredientSimilarity(
  ingredients1: RecipeDetailForDiet['ingredients'],
  ingredients2: RecipeDetailForDiet['ingredients']
): number {
  if (!ingredients1 || !ingredients2 || ingredients1.length === 0 || ingredients2.length === 0) {
    return 0;
  }
  
  const names1 = new Set(ingredients1.map(i => i.name.toLowerCase().trim()));
  const names2 = new Set(ingredients2.map(i => i.name.toLowerCase().trim()));
  
  // 교집합 계산
  let intersection = 0;
  for (const name of names1) {
    if (names2.has(name)) {
      intersection++;
    }
  }
  
  // 합집합 계산
  const union = new Set([...names1, ...names2]).size;
  
  // Jaccard 유사도
  return union > 0 ? intersection / union : 0;
}

/**
 * 영양소 유사도 계산
 */
function calculateNutritionSimilarity(
  nutrition1: RecipeNutrition,
  nutrition2: RecipeNutrition
): number {
  const nutrients = ['calories', 'protein', 'carbs', 'fat'] as const;
  let totalDiff = 0;
  
  for (const nutrient of nutrients) {
    const val1 = nutrition1[nutrient] || 0;
    const val2 = nutrition2[nutrient] || 0;
    const max = Math.max(val1, val2, 1); // 0으로 나누기 방지
    const diff = Math.abs(val1 - val2) / max;
    totalDiff += diff;
  }
  
  // 평균 차이를 유사도로 변환
  const avgDiff = totalDiff / nutrients.length;
  return Math.max(0, 1 - avgDiff);
}

/**
 * 영양소 부족분 계산
 * 
 * @param current 현재 섭취 영양소
 * @param target 목표 영양소
 * @returns 영양소 부족분
 */
export function calculateNutritionGap(
  current: RecipeNutrition,
  target: RecipeNutrition
): NutritionGap {
  const gap: NutritionGap = {
    protein: Math.max(0, (target.protein || 0) - (current.protein || 0)),
    calcium: Math.max(0, (target.calcium || 0) - (current.calcium || 0)),
    iron: Math.max(0, (target.iron || 0) - (current.iron || 0)),
    vitaminD: Math.max(0, (target.vitaminD || 0) - (current.vitaminD || 0)),
    total: 0,
  };
  
  // 총 부족 점수 계산 (정규화)
  const proteinScore = gap.protein / Math.max(target.protein || 1, 1);
  const calciumScore = gap.calcium / Math.max(target.calcium || 1, 1);
  const ironScore = gap.iron / Math.max(target.iron || 1, 1);
  const vitaminDScore = gap.vitaminD / Math.max(target.vitaminD || 1, 1);
  
  gap.total = (proteinScore + calciumScore + ironScore + vitaminDScore) / 4;
  
  return gap;
}

/**
 * 보완 반찬 선택
 * 
 * @param nutritionGap 영양소 부족분
 * @param candidateSides 후보 반찬 목록
 * @param maxResults 최대 결과 수
 * @returns 보완 반찬 목록 (보완 효과 순)
 */
export function selectComplementarySides(
  nutritionGap: NutritionGap,
  candidateSides: RecipeDetailForDiet[],
  maxResults: number = 3
): RecipeDetailForDiet[] {
  console.group("🔍 보완 반찬 선택");
  console.log("영양소 부족분:", nutritionGap);
  
  // 각 반찬의 보완 효과 계산
  const scoredSides = candidateSides.map(side => {
    const score = calculateComplementaryScore(nutritionGap, side.nutrition);
    return { side, score };
  });
  
  // 보완 효과 순으로 정렬
  scoredSides.sort((a, b) => b.score - a.score);
  
  const results = scoredSides.slice(0, maxResults).map(item => item.side);
  console.log(`✅ ${results.length}개의 보완 반찬 선택`);
  console.groupEnd();
  
  return results;
}

/**
 * 보완 효과 점수 계산
 */
function calculateComplementaryScore(
  gap: NutritionGap,
  nutrition: RecipeNutrition
): number {
  let score = 0;
  
  // 단백질 보완
  if (gap.protein > 0 && nutrition.protein > 0) {
    score += Math.min(nutrition.protein / gap.protein, 1) * 0.3;
  }
  
  // 칼슘 보완
  if (gap.calcium > 0 && (nutrition as any).calcium > 0) {
    score += Math.min((nutrition as any).calcium / gap.calcium, 1) * 0.3;
  }
  
  // 철분 보완
  if (gap.iron > 0 && (nutrition as any).iron > 0) {
    score += Math.min((nutrition as any).iron / gap.iron, 1) * 0.2;
  }
  
  // 비타민 D 보완
  if (gap.vitaminD > 0 && (nutrition as any).vitaminD > 0) {
    score += Math.min((nutrition as any).vitaminD / gap.vitaminD, 1) * 0.2;
  }
  
  return score;
}

