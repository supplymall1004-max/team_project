/**
 * @file lib/mfds/recipe-api-converter.ts
 * @description 식약처 API 응답을 MfdsRecipe 타입으로 변환하는 유틸리티
 *
 * Vercel 배포 환경에서 파일 시스템 접근이 제한되므로,
 * 식약처 API를 통해 레시피를 가져와서 변환합니다.
 */

import type { FoodSafetyRecipeRow } from '@/lib/recipes/foodsafety-api';
import type { MfdsRecipe, MfdsIngredient, MfdsRecipeStep, MfdsNutritionInfo, MfdsRecipeImages, MfdsRecipeFrontmatter } from '@/types/mfds-recipe';

/**
 * 식약처 API 응답을 MfdsRecipe로 변환
 */
export function convertFoodSafetyToMfdsRecipe(row: FoodSafetyRecipeRow): MfdsRecipe {
  // Frontmatter 생성
  const frontmatter: MfdsRecipeFrontmatter = {
    rcp_seq: row.RCP_SEQ,
    rcp_nm: row.RCP_NM,
    rcp_way2: row.RCP_WAY2,
    rcp_pat2: row.RCP_PAT2,
  };

  // 재료 파싱
  const ingredients: MfdsIngredient[] = parseIngredients(row.RCP_PARTS_DTLS);

  // 조리 단계 파싱
  const steps: MfdsRecipeStep[] = parseSteps(row);

  // 영양 정보 파싱
  const nutrition: MfdsNutritionInfo = {
    calories: parseFloat(row.INFO_ENG) || null,
    carbohydrates: parseFloat(row.INFO_CAR) || null,
    protein: parseFloat(row.INFO_PRO) || null,
    fat: parseFloat(row.INFO_FAT) || null,
    sodium: parseFloat(row.INFO_NA) || null,
    fiber: parseFloat(row.INFO_FIBER || '0') || null,
  };

  // 이미지 정보 파싱
  const images: MfdsRecipeImages = {
    mainImageUrl: row.ATT_FILE_NO_MAIN || null,
    mainImageOriginalUrl: row.ATT_FILE_NO_MAIN || null,
    mainImageLocalPath: null,
    mkImageUrl: row.ATT_FILE_NO_MK || null,
    mkImageOriginalUrl: row.ATT_FILE_NO_MK || null,
    mkImageLocalPath: null,
  };

  return {
    frontmatter,
    title: row.RCP_NM,
    description: `${row.RCP_PAT2} 요리로, ${row.RCP_WAY2} 방식으로 조리합니다.`,
    ingredients,
    steps,
    nutrition,
    images,
    rawContent: '', // API 응답에는 원본 마크다운이 없음
  };
}

/**
 * 재료 문자열 파싱
 * 형식: "재료1 재료2 | 양념1 양념2"
 */
function parseIngredients(partsDtls: string): MfdsIngredient[] {
  const ingredients: MfdsIngredient[] = [];
  
  if (!partsDtls || !partsDtls.trim()) {
    return ingredients;
  }

  // 파이프(|)로 구분된 섹션 분리
  const sections = partsDtls.split('|').map(s => s.trim());
  
  for (const section of sections) {
    // 각 섹션의 재료들을 공백으로 분리
    const items = section.split(/\s+/).filter(item => item.trim().length > 0);
    
    for (const item of items) {
      if (item.trim()) {
        ingredients.push({
          name: item.trim(),
        });
      }
    }
  }

  return ingredients;
}

/**
 * 조리 단계 파싱
 */
function parseSteps(row: FoodSafetyRecipeRow): MfdsRecipeStep[] {
  const steps: MfdsRecipeStep[] = [];
  
  // MANUAL01 ~ MANUAL20까지 순회
  for (let i = 1; i <= 20; i++) {
    const manualKey = `MANUAL${String(i).padStart(2, '0')}` as keyof FoodSafetyRecipeRow;
    const imgKey = `MANUAL_IMG${String(i).padStart(2, '0')}` as keyof FoodSafetyRecipeRow;
    
    const description = row[manualKey];
    const imageUrl = row[imgKey];
    
    if (description && typeof description === 'string' && description.trim()) {
      steps.push({
        step: i,
        description: description.trim(),
        imageUrl: imageUrl && typeof imageUrl === 'string' ? imageUrl.trim() : null,
        originalImageUrl: imageUrl && typeof imageUrl === 'string' ? imageUrl.trim() : null,
        localImagePath: null,
      });
    }
  }

  return steps;
}

