/**
 * @file lib/storage/diet-storage.ts
 * @description 식단 데이터 저장소
 *
 * 일일 식단 및 주간 식단을 로컬 스토리지에 저장/조회하는 기능 제공
 */

import { getIndexedDBManager, STORES } from "./indexeddb-manager";
import type { DailyDietPlan } from "@/types/health";
import type { WeeklyDiet } from "@/types/weekly-diet";

export interface StoredDietPlan extends DailyDietPlan {
  id: string;
  userId: string;
  planDate: string; // 'YYYY-MM-DD'
  syncStatus?: "pending" | "synced" | "failed";
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWeeklyDietPlan {
  id: string;
  userId: string;
  weekStartDate: string; // 'YYYY-MM-DD'
  weekYear: number;
  weekNumber: number;
  isFamily: boolean;
  data: WeeklyDiet;
  syncStatus?: "pending" | "synced" | "failed";
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 일일 식단 저장
 */
export async function saveDietPlan(
  userId: string,
  planDate: string,
  dietPlan: DailyDietPlan
): Promise<string> {
  const manager = getIndexedDBManager();
  await manager.init();

  const storedPlan: StoredDietPlan = {
    ...dietPlan,
    id: (typeof window !== 'undefined' ? window.crypto.randomUUID() : ''),
    userId,
    planDate,
    syncStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return manager.save(STORES.DIET_PLANS, storedPlan);
}

/**
 * 일일 식단 조회
 */
export async function getDietPlan(
  userId: string,
  planDate: string
): Promise<StoredDietPlan | null> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allPlans = await manager.getAll<StoredDietPlan>(STORES.DIET_PLANS);
  const plan = allPlans.find(
    (p) => p.userId === userId && p.planDate === planDate
  );

  return plan || null;
}

/**
 * 날짜 범위로 일일 식단 조회
 */
export async function getDietPlansByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<StoredDietPlan[]> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allPlans = await manager.getAll<StoredDietPlan>(STORES.DIET_PLANS);
  return allPlans.filter(
    (p) =>
      p.userId === userId &&
      p.planDate >= startDate &&
      p.planDate <= endDate
  );
}

/**
 * 주간 식단 저장
 */
export async function saveWeeklyDiet(
  userId: string,
  weeklyDiet: WeeklyDiet
): Promise<string> {
  const manager = getIndexedDBManager();
  await manager.init();

  const storedPlan: StoredWeeklyDietPlan = {
    id: weeklyDiet.metadata.id || (typeof window !== 'undefined' ? window.crypto.randomUUID() : ''),
    userId,
    weekStartDate: weeklyDiet.metadata.week_start_date,
    weekYear: weeklyDiet.metadata.week_year,
    weekNumber: weeklyDiet.metadata.week_number,
    isFamily: weeklyDiet.metadata.is_family,
    data: weeklyDiet,
    syncStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return manager.save(STORES.WEEKLY_DIET_PLANS, storedPlan);
}

/**
 * 주간 식단 조회
 */
export async function getWeeklyDiet(
  userId: string,
  weekStartDate: string
): Promise<StoredWeeklyDietPlan | null> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allPlans = await manager.getAll<StoredWeeklyDietPlan>(
    STORES.WEEKLY_DIET_PLANS
  );
  const plan = allPlans.find(
    (p) => p.userId === userId && p.weekStartDate === weekStartDate
  );

  return plan || null;
}

