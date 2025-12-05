/**
 * @file mfds-recipe-fetcher.ts
 * @description 식약처 API에서 레시피 대량 조회 및 관리
 *
 * 주요 기능:
 * 1. 식약처 API에서 레시피 목록을 대량으로 가져오기
 * 2. 페이지네이션 처리
 * 3. API 호출 실패 시 재시도 로직
 * 4. 레시피 중복 제거 (RCP_SEQ 기준)
 */

import { fetchFoodSafetyRecipes, type FoodSafetyRecipeRow } from "@/lib/recipes/foodsafety-api";
import { parseIngredients } from "@/lib/services/mfds-recipe-api";

export interface MfdsRecipeWithNutrition extends FoodSafetyRecipeRow {
  parsedIngredients: string[]; // 파싱된 재료 목록
  nutrition: {
    calories: number;
    carbohydrate: number;
    protein: number;
    fat: number;
    sodium: number;
    potassium?: number;
    phosphorus?: number;
    gi?: number;
  };
}

export interface FetchMfdsRecipesOptions {
  maxRecipes?: number; // 최대 조회할 레시피 수 (기본값: 1000)
  batchSize?: number; // 한 번에 조회할 레시피 수 (기본값: 1000, API 제한)
  startFrom?: number; // 시작 인덱스 (기본값: 1)
}

/**
 * 식약처 API에서 레시피를 대량으로 가져옵니다.
 */
export async function fetchMfdsRecipesInBatches(
  options: FetchMfdsRecipesOptions = {}
): Promise<MfdsRecipeWithNutrition[]> {
  const {
    maxRecipes = 1000,
    batchSize = 1000,
    startFrom = 1,
  } = options;

  console.group("[MFDS Recipe Fetcher] 레시피 대량 조회 시작");
  console.log("옵션:", { maxRecipes, batchSize, startFrom });

  const allRecipes: MfdsRecipeWithNutrition[] = [];
  const seenRcpSeqs = new Set<string>(); // 중복 제거용
  let currentIdx = startFrom;
  let totalFetched = 0;

  try {
    while (totalFetched < maxRecipes) {
      const endIdx = Math.min(currentIdx + batchSize - 1, currentIdx + maxRecipes - totalFetched - 1);

      console.log(`[${currentIdx}~${endIdx}] 범위 레시피 조회 중...`);

      const result = await fetchFoodSafetyRecipes({
        startIdx: currentIdx,
        endIdx: endIdx,
        maxRetries: 3,
        retryDelay: 1000,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        console.warn(`[${currentIdx}~${endIdx}] 범위에서 레시피를 가져오지 못했습니다.`);
        break; // 더 이상 데이터가 없으면 종료
      }

      // 레시피 변환 및 중복 제거
      for (const recipe of result.data) {
        if (seenRcpSeqs.has(recipe.RCP_SEQ)) {
          continue; // 이미 본 레시피는 건너뛰기
        }

        seenRcpSeqs.add(recipe.RCP_SEQ);

        // 재료 파싱
        const parsedIngredients = parseIngredients(recipe as any);

        // 영양 정보 파싱
        const parseNumber = (value: string | undefined): number => {
          if (!value || value.trim() === "") return 0;
          const num = parseFloat(value.replace(/[^0-9.]/g, ""));
          return isNaN(num) ? 0 : num;
        };

        const nutrition = {
          calories: parseNumber(recipe.INFO_ENG),
          carbohydrate: parseNumber(recipe.INFO_CAR),
          protein: parseNumber(recipe.INFO_PRO),
          fat: parseNumber(recipe.INFO_FAT),
          sodium: parseNumber(recipe.INFO_NA),
          potassium: (recipe as any).INFO_K ? parseNumber((recipe as any).INFO_K) : undefined,
          phosphorus: (recipe as any).INFO_P ? parseNumber((recipe as any).INFO_P) : undefined,
          gi: (recipe as any).INFO_GI ? parseNumber((recipe as any).INFO_GI) : undefined,
        };

        allRecipes.push({
          ...recipe,
          parsedIngredients,
          nutrition,
        });

        totalFetched++;

        if (totalFetched >= maxRecipes) {
          break;
        }
      }

      // 다음 배치로 이동
      currentIdx = endIdx + 1;

      // API 응답에 더 이상 데이터가 없으면 종료
      if (result.data.length < batchSize) {
        console.log("더 이상 조회할 레시피가 없습니다.");
        break;
      }

      // API 호출 제한을 고려한 짧은 대기 시간
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ 총 ${allRecipes.length}개의 레시피 조회 완료`);
    console.groupEnd();

    return allRecipes;
  } catch (error) {
    console.error("❌ 레시피 대량 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 식약처 API에서 특정 개수의 레시피만 가져옵니다 (빠른 조회용).
 */
export async function fetchMfdsRecipesQuick(
  limit: number = 100
): Promise<MfdsRecipeWithNutrition[]> {
  return fetchMfdsRecipesInBatches({
    maxRecipes: limit,
    batchSize: Math.min(limit, 1000),
    startFrom: 1,
  });
}

