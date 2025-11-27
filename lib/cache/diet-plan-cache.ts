/**
 * @file diet-plan-cache.ts
 * @description 브라우저 로컬 스토리지를 이용한 식단 캐시 유틸리티
 *
 * 캐시 전략:
 * - 사용자 ID + 날짜 조합으로 고유 키 생성
 * - 기본 TTL: 24시간 (1일 1식단 기준)
 * - 버전 필드를 포함하여 구조 변경 시 자동 무효화
 */

import { DailyDietPlan } from "@/types/recipe";

const DIET_PLAN_CACHE_PREFIX = "dietPlan";
const CACHE_VERSION = "v1";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

export interface DietPlanCacheEntry {
  userId: string;
  date: string;
  dietPlan: DailyDietPlan;
  storedAt: number;
  expiresAt: number;
  version: string;
}

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const buildCacheKey = (userId: string, date: string) =>
  `${DIET_PLAN_CACHE_PREFIX}:${userId}:${date}`;

const safeParse = (value: string | null): DietPlanCacheEntry | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as DietPlanCacheEntry;
  } catch {
    return null;
  }
};

export function getCachedDietPlan(
  userId: string,
  date: string
): DietPlanCacheEntry | null {
  if (!isBrowser()) return null;

  const key = buildCacheKey(userId, date);
  const parsed = safeParse(window.localStorage.getItem(key));
  if (!parsed) {
    window.localStorage.removeItem(key);
    return null;
  }

  const isExpired =
    parsed.version !== CACHE_VERSION || parsed.expiresAt < Date.now();

  if (isExpired) {
    window.localStorage.removeItem(key);
    return null;
  }

  return parsed;
}

export function setCachedDietPlan(
  userId: string,
  date: string,
  dietPlan: DailyDietPlan,
  ttlMs = DEFAULT_TTL_MS
) {
  if (!isBrowser()) return;

  const now = Date.now();
  const payload: DietPlanCacheEntry = {
    userId,
    date,
    dietPlan,
    storedAt: now,
    expiresAt: now + ttlMs,
    version: CACHE_VERSION,
  };

  const key = buildCacheKey(userId, date);
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearDietPlanCache(userId?: string, date?: string) {
  if (!isBrowser()) return;

  if (userId && date) {
    window.localStorage.removeItem(buildCacheKey(userId, date));
    return;
  }

  // prefix 기반 전체 삭제
  const keysToDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(`${DIET_PLAN_CACHE_PREFIX}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => window.localStorage.removeItem(key));
}





