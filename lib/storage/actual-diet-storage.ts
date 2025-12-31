/**
 * @file lib/storage/actual-diet-storage.ts
 * @description 실제 섭취 식단 기록 저장소
 *
 * 사용자가 실제로 먹은 식단을 기록하고 관리하는 기능 제공
 * AI 분석 결과를 기반으로 실제 섭취 영양소를 추적합니다.
 */

import { getIndexedDBManager, STORES } from "./indexeddb-manager";
import type { NutritionInfo } from "@/types/health";

export interface ActualDietRecord {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  photoId?: string; // 식사 사진 ID (연결)
  foods: Array<{
    name: string;
    quantity?: string; // "1인분", "200g" 등
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium?: number;
  }>;
  nutrition: NutritionInfo; // 총 영양소
  source: "photo_analysis" | "manual_entry"; // 기록 출처
  syncStatus?: "pending" | "synced" | "failed";
  createdAt: string;
  updatedAt: string;
}

/**
 * 실제 섭취 식단 기록 저장
 */
export async function saveActualDietRecord(
  userId: string,
  date: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  foods: ActualDietRecord["foods"],
  photoId?: string,
  source: "photo_analysis" | "manual_entry" = "photo_analysis"
): Promise<string> {
  const manager = getIndexedDBManager();
  await manager.init();

  // 총 영양소 계산
  const nutrition: NutritionInfo = foods.reduce(
    (acc, food) => ({
      calories: (acc.calories || 0) + food.calories,
      protein: (acc.protein || 0) + food.protein,
      carbohydrates: (acc.carbohydrates || 0) + food.carbs,
      fat: (acc.fat || 0) + food.fat,
      sodium: (acc.sodium || 0) + (food.sodium || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      sodium: 0,
    }
  );

  const record: ActualDietRecord = {
    id: crypto.randomUUID(),
    userId,
    date,
    mealType,
    photoId,
    foods,
    nutrition,
    source,
    syncStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return manager.save(STORES.ACTUAL_DIET_RECORDS, record);
}

/**
 * 날짜별 실제 섭취 식단 조회
 */
export async function getActualDietRecordsByDate(
  userId: string,
  date: string
): Promise<ActualDietRecord[]> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allRecords = await manager.getAll<ActualDietRecord>(
    STORES.ACTUAL_DIET_RECORDS
  );
  return allRecords.filter(
    (record) => record.userId === userId && record.date === date
  );
}

/**
 * 날짜 범위로 실제 섭취 식단 조회
 */
export async function getActualDietRecordsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ActualDietRecord[]> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allRecords = await manager.getAll<ActualDietRecord>(
    STORES.ACTUAL_DIET_RECORDS
  );
  return allRecords.filter(
    (record) =>
      record.userId === userId &&
      record.date >= startDate &&
      record.date <= endDate
  );
}

/**
 * 일주일간 실제 섭취 영양소 집계
 */
export async function getWeeklyActualNutrition(
  userId: string,
  weekStartDate: string
): Promise<{
  total: NutritionInfo;
  daily: Array<{
    date: string;
    nutrition: NutritionInfo;
  }>;
  average: NutritionInfo;
}> {
  const records = await getActualDietRecordsByDateRange(
    userId,
    weekStartDate,
    getWeekEndDate(weekStartDate)
  );

  // 일별 집계
  const dailyMap = new Map<string, NutritionInfo>();

  records.forEach((record) => {
    const existing = dailyMap.get(record.date) || {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      sodium: 0,
    };

    dailyMap.set(record.date, {
      calories: (existing.calories || 0) + (record.nutrition.calories || 0),
      protein: (existing.protein || 0) + (record.nutrition.protein || 0),
      carbohydrates: (existing.carbohydrates || 0) + (record.nutrition.carbohydrates || 0),
      fat: (existing.fat || 0) + (record.nutrition.fat || 0),
      sodium: (existing.sodium || 0) + (record.nutrition.sodium || 0),
    });
  });

  // 주간 총합
  const total: NutritionInfo = Array.from(dailyMap.values()).reduce(
    (acc, daily) => ({
      calories: (acc.calories || 0) + (daily.calories || 0),
      protein: (acc.protein || 0) + (daily.protein || 0),
      carbohydrates: (acc.carbohydrates || 0) + (daily.carbohydrates || 0),
      fat: (acc.fat || 0) + (daily.fat || 0),
      sodium: (acc.sodium || 0) + (daily.sodium || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      sodium: 0,
    }
  );

  // 일평균
  const dayCount = dailyMap.size || 1;
  const average: NutritionInfo = {
    calories: Math.round((total.calories || 0) / dayCount),
    protein: Math.round(((total.protein || 0) / dayCount) * 10) / 10,
    carbohydrates: Math.round(((total.carbohydrates || 0) / dayCount) * 10) / 10,
    fat: Math.round(((total.fat || 0) / dayCount) * 10) / 10,
    sodium: Math.round((total.sodium || 0) / dayCount),
  };

  return {
    total,
    daily: Array.from(dailyMap.entries()).map(([date, nutrition]) => ({
      date,
      nutrition,
    })),
    average,
  };
}

/**
 * 주차 종료일 계산
 */
function getWeekEndDate(weekStartDate: string): string {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split("T")[0];
}

