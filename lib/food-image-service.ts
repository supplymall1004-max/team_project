/**
 * @file food-image-service.ts
 * @description 음식 이미지 검색 및 캐싱 서비스
 *
 * 이 서비스는 Pixabay API를 사용하여 음식 이미지를 검색하고,
 * Supabase 데이터베이스에 캐싱하여 재사용합니다.
 *
 * 주요 기능:
 * - 캐시 우선 조회 (Cache-first strategy)
 * - API 검색 및 캐싱
 * - 품질 기반 이미지 선택
 * - 캐시 만료 관리
 *
 * @dependencies
 * - lib/food-image-search.ts: Pixabay API 클라이언트
 * - lib/supabase/: Supabase 클라이언트들
 */

import { getFoodImageUrl } from '@/data/food-image-links';

export interface CachedFoodImage {
  id: string;
  food_name: string;
  image_url: string;
  thumbnail_url?: string;
  source: string;
  source_id?: string;
  width?: number;
  height?: number;
  quality_score: number;
  tags?: string[];
  photographer?: string;
  photographer_url?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

/**
 * 음식 이미지 서비스 클래스
 * docs/foodjpg.md에서 직접 이미지 링크를 제공합니다.
 */
export class FoodImageService {

  /**
   * 특정 음식의 이미지를 가져옵니다.
   * docs/foodjpg.md에서 직접 링크를 가져옵니다.
   *
   * @param foodName 음식 이름
   * @returns 이미지 정보 또는 null
   */
  async getFoodImage(foodName: string): Promise<CachedFoodImage | null> {
    console.log(`🍽️ 음식 이미지 요청: ${foodName}`);

    try {
      const imageUrl = getFoodImageUrl(foodName);
      if (!imageUrl) {
        console.log(`🍽️ ${foodName}의 이미지를 찾을 수 없습니다.`);
        return null;
      }

      console.log(`🍽️ ${foodName} 이미지 발견: ${imageUrl}`);

      const image: CachedFoodImage = {
        id: `foodjpg-${Date.now()}`,
        food_name: foodName,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        source: 'foodjpg',
        source_id: 'foodjpg-md',
        quality_score: 100, // foodjpg.md 링크는 최고 품질로 간주
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      };

      return image;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🍽️ 음식 이미지 가져오기 실패 (${foodName}):`, {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      return null;
    }
  }

  /**
   * 여러 음식의 이미지를 한 번에 가져옵니다.
   *
   * @param foodNames 음식 이름 배열
   * @returns 음식명별 이미지 맵
   */
  async getMultipleFoodImages(foodNames: string[]): Promise<Record<string, CachedFoodImage | null>> {
    console.log(`🍽️ 다중 음식 이미지 요청: ${foodNames.join(', ')}`);

    const results: Record<string, CachedFoodImage | null> = {};

    for (const foodName of foodNames) {
      const imageUrl = getFoodImageUrl(foodName);
      if (imageUrl) {
        console.log(`🍽️ ${foodName} 이미지 발견`);
        results[foodName] = {
          id: `foodjpg-${Date.now()}-${foodName}`,
          food_name: foodName,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          source: 'foodjpg',
          source_id: 'foodjpg-md',
          quality_score: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        };
      } else {
        console.log(`🍽️ ${foodName}의 이미지를 찾을 수 없습니다.`);
        results[foodName] = null;
      }
    }

    return results;
  }

  /**
   * 캐시 통계를 조회합니다. (더미 데이터 반환)
   * 이미지 로딩 로직이 제거되었으므로 빈 통계를 반환합니다.
   *
   * @returns 빈 캐시 통계 정보
   */
  async getCacheStats(): Promise<{
    totalImages: number;
    totalFoods: number;
    oldestImage: string | null;
    newestImage: string | null;
    averageQuality: number;
    cacheHitRate: number;
    storageSize: number;
    qualityDistribution: Record<string, number>;
  }> {
    console.log('🍽️ 캐시 통계 조회: 이미지 로딩 로직이 제거되어 빈 통계를 반환합니다.');

    return {
      totalImages: 0,
      totalFoods: 0,
      oldestImage: null,
      newestImage: null,
      averageQuality: 0,
      cacheHitRate: 0,
      storageSize: 0,
      qualityDistribution: {},
    };
  }

  /**
   * 캐시 정리를 수행합니다. (더미 구현)
   * 이미지 로딩 로직이 제거되었으므로 아무 작업도 수행하지 않습니다.
   *
   * @returns 빈 정리 결과
   */
  async scheduledCacheCleanup(): Promise<{ expiredDeleted: number; lruDeleted: number; totalDeleted: number }> {
    console.log('🍽️ 캐시 정리: 이미지 로딩 로직이 제거되어 정리 작업을 생략합니다.');

    return {
      expiredDeleted: 0,
      lruDeleted: 0,
      totalDeleted: 0,
    };
  }

}

// 싱글톤 인스턴스
export const foodImageService = new FoodImageService();
