/**
 * @file actions/food-images.ts
 * @description 음식 이미지 관련 서버 액션들
 *
 * 클라이언트 컴포넌트에서 서버 사이드 로직을 안전하게 호출하기 위한 액션들
 */

"use server";

import { foodImageService } from "@/lib/food-image-service";
import type { CachedFoodImage } from "@/lib/food-image-service";

/**
 * 음식 이미지를 검색하는 서버 액션
 *
 * @param foodName 음식 이름
 * @returns 검색된 이미지 또는 null
 */
export async function searchFoodImage(foodName: string): Promise<CachedFoodImage | null> {
  try {
    console.log(`🍽️ [Server Action] 음식 이미지 검색 시작: ${foodName}`);
    const startTime = Date.now();
    
    const image = await foodImageService.getFoodImage(foodName);
    
    const duration = Date.now() - startTime;
    console.log(`🍽️ [Server Action] 검색 완료: ${foodName} - ${image ? '성공' : '실패'} (${duration}ms)`);
    
    if (image) {
      console.log(`🍽️ [Server Action] 이미지 URL: ${image.image_url}`);
    }
    
    return image;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`🍽️ [Server Action] 이미지 검색 실패: ${foodName}`, {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    return null;
  }
}

/**
 * 여러 음식의 이미지를 한 번에 검색하는 서버 액션
 *
 * @param foodNames 음식 이름 배열
 * @returns 음식명별 이미지 맵
 */
export async function searchMultipleFoodImages(foodNames: string[]): Promise<Record<string, CachedFoodImage | null>> {
  try {
    console.log(`🍽️ [Server Action] 다중 음식 이미지 검색: ${foodNames.join(', ')}`);
    const results = await foodImageService.getMultipleFoodImages(foodNames);
    const successCount = Object.values(results).filter(Boolean).length;
    console.log(`🍽️ [Server Action] 다중 검색 결과: ${successCount}/${foodNames.length}개 성공`);
    return results;
  } catch (error) {
    console.error(`🍽️ [Server Action] 다중 이미지 검색 실패:`, error);
    return {};
  }
}
