/**
 * @file recipe-merger.ts
 * @description DB 레시피와 식약처 정적 파일 레시피 병합 로직 (레거시)
 *
 * ⚠️ 주의: 이 파일은 더 이상 사용되지 않습니다.
 * 모든 레시피 병합은 lib/diet/queries.ts에서 직접 배열 병합([...dbRecipes, ...mfdsRecipes])을 통해 수행됩니다.
 * 
 * 주요 기능 (레거시):
 * 1. DB 레시피와 식약처 정적 파일 레시피를 병합
 * 2. 중복 제거 (slug 또는 foodsafety_rcp_seq 기준)
 * 3. 영양 정보 통합 (DB 우선, 없으면 정적 파일 데이터 사용)
 * 4. 재료 정보 통합
 */

import type { RecipeListItem } from "@/types/recipe";
// 레거시 타입: 실제로는 사용되지 않지만 타입 정의를 위해 유지
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MfdsRecipeWithNutrition } from "./mfds-recipe-fetcher";

export interface MergedRecipe extends RecipeListItem {
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
  fiber?: number | null; // 식이섬유
  potassium?: number | null; // 칼륨
  phosphorus?: number | null; // 인
  gi?: number | null; // GI 지수
  parsedIngredients?: string[]; // 파싱된 재료 목록
  source: "db" | "mfds" | "merged"; // 레시피 출처
}

/**
 * DB 레시피와 식약처 정적 파일 레시피를 병합합니다 (레거시).
 * 
 * ⚠️ 주의: 이 함수는 더 이상 사용되지 않습니다.
 * lib/diet/queries.ts에서 직접 배열 병합([...dbRecipes, ...mfdsRecipes])을 사용합니다.
 */
export function mergeRecipes(
  dbRecipes: (RecipeListItem & {
    calories: number | null;
    carbohydrates: number | null;
    protein: number | null;
    fat: number | null;
    sodium: number | null;
  })[],
  mfdsRecipes: MfdsRecipeWithNutrition[]
): MergedRecipe[] {
  console.group("[Recipe Merger] 레시피 병합 시작");
  console.log(`DB 레시피: ${dbRecipes.length}개`);
  console.log(`식약처 정적 파일 레시피: ${mfdsRecipes.length}개`);

  const mergedMap = new Map<string, MergedRecipe>();
  const mfdsRcpSeqMap = new Map<string, MfdsRecipeWithNutrition>();

  // 1. 식약처 정적 파일 레시피를 RCP_SEQ로 인덱싱
  for (const mfdsRecipe of mfdsRecipes) {
    mfdsRcpSeqMap.set(mfdsRecipe.RCP_SEQ, mfdsRecipe);
  }

  // 2. DB 레시피를 먼저 추가 (우선순위 높음)
  for (const dbRecipe of dbRecipes) {
    const key = dbRecipe.id;
    const mfdsRcpSeq = (dbRecipe as any).foodsafety_rcp_seq;

    // DB 레시피를 기본으로 추가
    mergedMap.set(key, {
      ...dbRecipe,
      fiber: null,
      potassium: null,
      phosphorus: null,
      gi: null,
      parsedIngredients: mfdsRcpSeq && mfdsRcpSeqMap.has(mfdsRcpSeq)
        ? mfdsRcpSeqMap.get(mfdsRcpSeq)!.parsedIngredients
        : undefined,
      source: mfdsRcpSeq ? "merged" : "db",
    });

    // DB 레시피에 식약처 정보가 있으면 영양 정보 보완
    if (mfdsRcpSeq && mfdsRcpSeqMap.has(mfdsRcpSeq)) {
      const mfdsRecipe = mfdsRcpSeqMap.get(mfdsRcpSeq)!;
      const merged = mergedMap.get(key)!;

      // DB에 없는 영양 정보는 정적 파일 데이터로 채움
      if (merged.calories === null && mfdsRecipe.nutrition.calories > 0) {
        merged.calories = mfdsRecipe.nutrition.calories;
      }
      if (merged.carbohydrates === null && mfdsRecipe.nutrition.carbohydrate > 0) {
        merged.carbohydrates = mfdsRecipe.nutrition.carbohydrate;
      }
      if (merged.protein === null && mfdsRecipe.nutrition.protein > 0) {
        merged.protein = mfdsRecipe.nutrition.protein;
      }
      if (merged.fat === null && mfdsRecipe.nutrition.fat > 0) {
        merged.fat = mfdsRecipe.nutrition.fat;
      }
      if (merged.sodium === null && mfdsRecipe.nutrition.sodium > 0) {
        merged.sodium = mfdsRecipe.nutrition.sodium;
      }

      // 식이섬유 추가
      if (mfdsRecipe.nutrition.fiber !== undefined && mfdsRecipe.nutrition.fiber > 0) {
        merged.fiber = mfdsRecipe.nutrition.fiber;
      }

      // 칼륨, 인, GI 지수 추가
      if (mfdsRecipe.nutrition.potassium) {
        merged.potassium = mfdsRecipe.nutrition.potassium;
      }
      if (mfdsRecipe.nutrition.phosphorus) {
        merged.phosphorus = mfdsRecipe.nutrition.phosphorus;
      }
      if (mfdsRecipe.nutrition.gi) {
        merged.gi = mfdsRecipe.nutrition.gi;
      }

      merged.parsedIngredients = mfdsRecipe.parsedIngredients;
    }
  }

  // 3. DB에 없는 식약처 정적 파일 레시피 추가
  for (const mfdsRecipe of mfdsRecipes) {
    // 이미 DB에 있는 레시피는 건너뛰기
    let alreadyExists = false;
    for (const dbRecipe of dbRecipes) {
      const mfdsRcpSeq = (dbRecipe as any).foodsafety_rcp_seq;
      if (mfdsRcpSeq === mfdsRecipe.RCP_SEQ) {
        alreadyExists = true;
        break;
      }
    }

    if (alreadyExists) {
      continue;
    }

    // 식약처 정적 파일 레시피를 MergedRecipe 형식으로 변환
    const slug = `foodsafety-${mfdsRecipe.RCP_SEQ}`;
    const key = slug;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        id: slug,
        slug: slug,
        title: mfdsRecipe.RCP_NM,
        thumbnail_url: mfdsRecipe.ATT_FILE_NO_MAIN || null,
        difficulty: 2, // 기본값
        cooking_time_minutes: 30, // 기본값
        rating_count: 0,
        average_rating: 0,
        user: { name: "식약처" },
        calories: mfdsRecipe.nutrition.calories || null,
        carbohydrates: mfdsRecipe.nutrition.carbohydrate || null,
        protein: mfdsRecipe.nutrition.protein || null,
        fat: mfdsRecipe.nutrition.fat || null,
        sodium: mfdsRecipe.nutrition.sodium || null,
        fiber: mfdsRecipe.nutrition.fiber || null,
        potassium: mfdsRecipe.nutrition.potassium || null,
        phosphorus: mfdsRecipe.nutrition.phosphorus || null,
        gi: mfdsRecipe.nutrition.gi || null,
        parsedIngredients: mfdsRecipe.parsedIngredients,
        source: "mfds",
        created_at: new Date().toISOString(),
      });
    }
  }

  const mergedRecipes = Array.from(mergedMap.values());

  console.log(`✅ 병합 완료: 총 ${mergedRecipes.length}개 레시피`);
  console.log(`  - DB 레시피: ${dbRecipes.length}개`);
  console.log(`  - 식약처 정적 파일 레시피: ${mfdsRecipes.length}개`);
  console.log(`  - 병합된 레시피: ${mergedRecipes.filter(r => r.source === "merged").length}개`);
  console.log(`  - 새로 추가된 식약처 레시피: ${mergedRecipes.filter(r => r.source === "mfds").length}개`);
  console.groupEnd();

  return mergedRecipes;
}

/**
 * 레시피 목록에서 중복을 제거합니다 (RCP_SEQ 기준).
 */
export function deduplicateRecipesByRcpSeq(
  recipes: MergedRecipe[]
): MergedRecipe[] {
  const seen = new Set<string>();
  const deduplicated: MergedRecipe[] = [];

  for (const recipe of recipes) {
    // foodsafety_rcp_seq가 있으면 그것으로 중복 체크
    const rcpSeq = (recipe as any).foodsafety_rcp_seq;
    if (rcpSeq) {
      if (seen.has(rcpSeq)) {
        continue;
      }
      seen.add(rcpSeq);
    }

    // ID로도 중복 체크
    if (seen.has(recipe.id)) {
      continue;
    }
    seen.add(recipe.id);

    deduplicated.push(recipe);
  }

  return deduplicated;
}

