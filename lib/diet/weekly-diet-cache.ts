/**
 * @file lib/diet/weekly-diet-cache.ts
 * @description 주간 식단 데이터 캐싱 유틸리티
 *
 * 주간 식단 데이터를 로컬 스토리지에 캐시하고 관리합니다.
 * 캐시는 일요일 오후 6시 생성 시점으로부터 7일간 유효합니다.
 */

import type { WeeklyDietPlan, WeeklyNutritionStats, ShoppingListItem } from "@/types/weekly-diet";
import type { MealType } from "@/types/recipe";

export interface CachedWeeklyDiet {
  metadata: WeeklyDietPlan;
  dailyPlans: DietPlanEntry[];
  shoppingList: ShoppingListItem[];
  nutritionStats: WeeklyNutritionStats[];
  weekStartDate: string;
  cachedAt: string; // 캐시된 시점
  weekYear: number;
  weekNumber: number;
}

export interface DietPlanEntry {
  id?: string;
  plan_date: string;
  meal_type: MealType | string;
  recipe_id?: string | null;
  recipe_title: string;
  recipe_description?: string | null;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  sodium: number;
  recipe_thumbnail_url?: string | null;
  recipe?: RecipePreview | null;
  composition_summary?: Record<string, string[]> | null;
}

export interface RecipePreview {
  id?: string;
  title?: string | null;
  thumbnail_url?: string | null;
  slug?: string | null;
}

class WeeklyDietCache {
  private readonly CACHE_KEY_PREFIX = 'weekly_diet_cache_';
  private readonly CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7일

  /**
   * 캐시 키 생성
   */
  private getCacheKey(userId: string, weekType: 'this' | 'next'): string {
    return `${this.CACHE_KEY_PREFIX}${userId}_${weekType}`;
  }

  /**
   * 캐시된 주간 식단 데이터 조회
   */
  getCachedWeeklyDiet(userId: string, weekType: 'this' | 'next'): CachedWeeklyDiet | null {
    if (typeof window === 'undefined') return null;

    try {
      const cacheKey = this.getCacheKey(userId, weekType);
      const cachedData = localStorage.getItem(cacheKey);

      if (!cachedData) {
        console.log(`[WeeklyDietCache] 캐시 없음: ${cacheKey}`);
        return null;
      }

      const parsed: CachedWeeklyDiet = JSON.parse(cachedData);
      const cachedAt = new Date(parsed.cachedAt);
      const now = new Date();

      // 캐시 유효성 검사 (7일 이내인지)
      const timeDiff = now.getTime() - cachedAt.getTime();
      if (timeDiff > this.CACHE_DURATION_MS) {
        console.log(`[WeeklyDietCache] 캐시 만료: ${cacheKey} (${Math.round(timeDiff / (1000 * 60 * 60))}시간 경과)`);
        this.clearCache(userId, weekType);
        return null;
      }

      // 현재 주차 정보와 캐시된 주차 정보 비교
      const currentWeekInfo = this.getCurrentWeekInfo();
      if (weekType === 'this' &&
          (parsed.weekYear !== currentWeekInfo.year || parsed.weekNumber !== currentWeekInfo.weekNumber)) {
        console.log(`[WeeklyDietCache] 주차 변경으로 캐시 무효화: ${cacheKey}`);
        console.log(`캐시: ${parsed.weekYear}-W${parsed.weekNumber}, 현재: ${currentWeekInfo.year}-W${currentWeekInfo.weekNumber}`);
        this.clearCache(userId, weekType);
        return null;
      }

      console.log(`[WeeklyDietCache] 캐시 히트: ${cacheKey} (${Math.round(timeDiff / (1000 * 60))}분 경과)`);
      return parsed;
    } catch (error) {
      console.error('[WeeklyDietCache] 캐시 조회 오류:', error);
      return null;
    }
  }

  /**
   * 주간 식단 데이터 캐시 저장
   */
  setCachedWeeklyDiet(
    userId: string,
    weekType: 'this' | 'next',
    data: {
      metadata: WeeklyDietPlan;
      dailyPlans: DietPlanEntry[];
      shoppingList: ShoppingListItem[];
      nutritionStats: WeeklyNutritionStats[];
      weekStartDate: string;
    }
  ): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheKey = this.getCacheKey(userId, weekType);
      const weekInfo = this.getCurrentWeekInfo();

      const cachedData: CachedWeeklyDiet = {
        ...data,
        cachedAt: new Date().toISOString(),
        weekYear: weekInfo.year,
        weekNumber: weekInfo.weekNumber,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      console.log(`[WeeklyDietCache] 캐시 저장: ${cacheKey}`);
    } catch (error) {
      console.error('[WeeklyDietCache] 캐시 저장 오류:', error);
    }
  }

  /**
   * 특정 사용자의 캐시 삭제
   */
  clearCache(userId: string, weekType?: 'this' | 'next'): void {
    if (typeof window === 'undefined') return;

    try {
      if (weekType) {
        const cacheKey = this.getCacheKey(userId, weekType);
        localStorage.removeItem(cacheKey);
        console.log(`[WeeklyDietCache] 캐시 삭제: ${cacheKey}`);
      } else {
        // 모든 주차 타입의 캐시 삭제
        const cacheKeyThis = this.getCacheKey(userId, 'this');
        const cacheKeyNext = this.getCacheKey(userId, 'next');
        localStorage.removeItem(cacheKeyThis);
        localStorage.removeItem(cacheKeyNext);
        console.log(`[WeeklyDietCache] 모든 캐시 삭제: ${userId}`);
      }
    } catch (error) {
      console.error('[WeeklyDietCache] 캐시 삭제 오류:', error);
    }
  }

  /**
   * 현재 주차 정보 계산
   */
  private getCurrentWeekInfo(): { year: number; weekNumber: number } {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 1=월요일, 7=일요일

    // 이번 주 월요일 계산
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);

    // ISO 주차 계산
    const nearestThursday = new Date(monday);
    nearestThursday.setDate(monday.getDate() + 3); // 목요일로 이동

    const year = nearestThursday.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const weekNumber = Math.ceil(
      ((nearestThursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );

    return { year, weekNumber };
  }

  /**
   * 캐시 통계 조회 (디버깅용)
   */
  getCacheStats(userId: string): {
    thisWeek: boolean;
    nextWeek: boolean;
    cacheSize: number;
  } {
    if (typeof window === 'undefined') {
      return { thisWeek: false, nextWeek: false, cacheSize: 0 };
    }

    const thisWeekKey = this.getCacheKey(userId, 'this');
    const nextWeekKey = this.getCacheKey(userId, 'next');

    const thisWeekData = localStorage.getItem(thisWeekKey);
    const nextWeekData = localStorage.getItem(nextWeekKey);

    let cacheSize = 0;
    if (thisWeekData) cacheSize += thisWeekData.length;
    if (nextWeekData) cacheSize += nextWeekData.length;

    return {
      thisWeek: !!thisWeekData,
      nextWeek: !!nextWeekData,
      cacheSize,
    };
  }
}

// 싱글톤 인스턴스
export const weeklyDietCache = new WeeklyDietCache();



