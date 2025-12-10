/**
 * @file mfds-recipe-fetcher.ts
 * @description 식약처 API에서 레시피 대량 조회 및 관리 (개선됨)
 *
 * 주요 기능:
 * 1. 식약처 API에서 레시피 목록을 대량으로 가져오기
 * 2. 페이지네이션 처리 (개선: 필요한 만큼만 가져오기)
 * 3. API 호출 실패 시 재시도 로직
 * 4. 레시피 중복 제거 (RCP_SEQ 기준)
 * 5. 기본 필터링 (영양소 데이터 없는 레시피 제외) - 새로 추가
 * 
 * 개선 사항:
 * - 한번에 가져오는 레시피 수 제한 (기본 100개 -> 필요시 더 가져오기)
 * - 영양소 정보가 없는 레시피 필터링
 * - 메모리 효율성 개선
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
  maxRecipes?: number; // 최대 조회할 레시피 수 (기본값: 100, 개선됨)
  batchSize?: number; // 한 번에 조회할 레시피 수 (기본값: 100, 개선됨)
  startFrom?: number; // 시작 인덱스 (기본값: 1)
  filterInvalidRecipes?: boolean; // 영양소 정보 없는 레시피 필터링 여부 (기본값: true)
}

/**
 * 레시피가 유효한지 확인 (영양소 정보 체크)
 */
function isValidRecipe(recipe: FoodSafetyRecipeRow): boolean {
  // 칼로리, 탄수화물, 단백질, 지방 중 하나라도 있으면 유효
  const hasCalories = recipe.INFO_ENG && recipe.INFO_ENG.trim() !== "" && recipe.INFO_ENG !== "0";
  const hasCarbs = recipe.INFO_CAR && recipe.INFO_CAR.trim() !== "" && recipe.INFO_CAR !== "0";
  const hasProtein = recipe.INFO_PRO && recipe.INFO_PRO.trim() !== "" && recipe.INFO_PRO !== "0";
  const hasFat = recipe.INFO_FAT && recipe.INFO_FAT.trim() !== "" && recipe.INFO_FAT !== "0";
  
  return hasCalories || hasCarbs || hasProtein || hasFat;
}

/**
 * 식약처 API에서 레시피를 대량으로 가져옵니다 (개선됨).
 * 
 * 개선 사항:
 * - 기본 maxRecipes를 100으로 제한 (필요시 더 요청)
 * - 영양소 정보 없는 레시피 필터링
 * - 조기 종료 조건 개선
 */
export async function fetchMfdsRecipesInBatches(
  options: FetchMfdsRecipesOptions = {}
): Promise<MfdsRecipeWithNutrition[]> {
  const {
    maxRecipes = 100, // 기본값 100으로 감소 (개선)
    batchSize = 100, // 배치 크기도 100으로 감소 (개선)
    startFrom = 1,
    filterInvalidRecipes = true, // 기본적으로 필터링 활성화 (개선)
  } = options;

  console.group("[MFDS Recipe Fetcher] 레시피 조회 시작 (최적화됨)");
  console.log("옵션:", { maxRecipes, batchSize, startFrom, filterInvalidRecipes });

  const allRecipes: MfdsRecipeWithNutrition[] = [];
  const seenRcpSeqs = new Set<string>(); // 중복 제거용
  let currentIdx = startFrom;
  let totalFetched = 0;
  let totalFiltered = 0; // 필터링된 레시피 수

  try {
    while (totalFetched < maxRecipes) {
      const endIdx = Math.min(currentIdx + batchSize - 1, currentIdx + maxRecipes - totalFetched - 1);

      console.log(`📥 [${currentIdx}~${endIdx}] 범위 레시피 조회 중...`);

      const result = await fetchFoodSafetyRecipes({
        startIdx: currentIdx,
        endIdx: endIdx,
        maxRetries: 3,
        retryDelay: 1000,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        console.warn(`⚠️ [${currentIdx}~${endIdx}] 범위에서 레시피를 가져오지 못했습니다.`);
        break; // 더 이상 데이터가 없으면 종료
      }

      // 레시피 변환 및 필터링
      let batchAdded = 0;
      for (const recipe of result.data) {
        if (seenRcpSeqs.has(recipe.RCP_SEQ)) {
          continue; // 이미 본 레시피는 건너뛰기
        }

        // 영양소 정보 없는 레시피 필터링 (개선)
        if (filterInvalidRecipes && !isValidRecipe(recipe)) {
          totalFiltered++;
          continue;
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
        batchAdded++;

        if (totalFetched >= maxRecipes) {
          break;
        }
      }

      console.log(`✓ 배치에서 ${batchAdded}개 추가됨 (필터링: ${totalFiltered}개)`);

      // 다음 배치로 이동
      currentIdx = endIdx + 1;

      // API 응답에 더 이상 데이터가 없으면 종료
      if (result.data.length < batchSize) {
        console.log("📍 더 이상 조회할 레시피가 없습니다.");
        break;
      }

      // 목표 개수를 달성했으면 조기 종료 (개선)
      if (totalFetched >= maxRecipes) {
        console.log(`✅ 목표 개수(${maxRecipes}개) 달성`);
        break;
      }

      // API 호출 제한을 고려한 짧은 대기 시간
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ 총 ${allRecipes.length}개의 레시피 조회 완료 (필터링: ${totalFiltered}개)`);
    console.groupEnd();

    return allRecipes;
  } catch (error) {
    console.error("❌ 레시피 대량 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 식약처 API에서 특정 개수의 레시피만 가져옵니다 (빠른 조회용, 개선됨).
 * 
 * 개선 사항:
 * - 기본 limit을 50으로 감소 (필요한 만큼만)
 * - 배치 크기 최적화
 * - 필터링 기본 활성화
 */
export async function fetchMfdsRecipesQuick(
  limit: number = 50 // 기본값 50으로 감소 (개선)
): Promise<MfdsRecipeWithNutrition[]> {
  return fetchMfdsRecipesInBatches({
    maxRecipes: limit,
    batchSize: Math.min(limit, 100), // 배치 크기 최대 100으로 제한 (개선)
    startFrom: 1,
    filterInvalidRecipes: true, // 필터링 활성화 (개선)
  });
}

