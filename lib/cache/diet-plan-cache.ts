/**
 * @file diet-plan-cache.ts
 * @description 브라우저 로컬 스토리지를 이용한 식단 캐시 유틸리티
 *
 * 캐시 전략:
 * - 사용자 ID + 생성 날짜 조합으로 고유 키 생성
 * - 건강 맞춤 식단: 전날 오후 6시 생성 후 금일 오후 6시까지 유지
 * - 수동 생성 식단: 24시간 유지
 * - 버전 필드를 포함하여 구조 변경 시 자동 무효화
 */

import type { DailyDietPlan } from "@/types/health";

const DIET_PLAN_CACHE_PREFIX = "dietPlan";
const CACHE_VERSION = "v2"; // 캐시 전략 변경으로 버전 업
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const AI_DIET_EXPIRY_HOUR = 18; // 오후 6시

export interface DietPlanCacheEntry {
  userId: string;
  date: string;
  creationDate: string; // 식단 생성 날짜 (키로 사용)
  dietPlan: DailyDietPlan;
  storedAt: number;
  expiresAt: number;
  version: string;
  isAiGenerated?: boolean; // AI 생성 여부
}

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

/**
 * 건강 맞춤 식단의 캐시 만료 시간 계산
 * 생성 날짜의 다음 날 오후 6시까지 유효
 */
function calculateAiDietExpiry(creationDate: string): number {
  const creation = new Date(creationDate + 'T00:00:00');
  const expiry = new Date(creation);
  expiry.setDate(expiry.getDate() + 1); // 다음 날
  expiry.setHours(AI_DIET_EXPIRY_HOUR, 0, 0, 0); // 오후 6시

  return expiry.getTime();
}

/**
 * 현재 시간에 유효한 AI 식단 캐시 키 조회
 * 오늘 오후 6시 이전이면 어제 생성된 식단, 이후면 오늘 생성된 식단
 */
function getCurrentValidAiDietKey(userId: string): string | null {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 현재 오후 6시 이전인지 확인
  const isBefore6PM = now.getHours() < AI_DIET_EXPIRY_HOUR;

  // 우선순위: 오늘 오후 6시 이전이면 어제 생성된 식단, 이후면 오늘 생성된 식단
  const candidateKeys = isBefore6PM
    ? [yesterdayStr, today]
    : [today, yesterdayStr];

  for (const dateKey of candidateKeys) {
    const key = buildCacheKey(userId, dateKey);
    const cached = safeParse(window.localStorage.getItem(key));

    if (cached && cached.isAiGenerated) {
      const expiryTime = calculateAiDietExpiry(cached.creationDate);
      if (Date.now() < expiryTime) {
        return key;
      }
    }
  }

  return null;
}

const buildCacheKey = (userId: string, creationDate: string) =>
  `${DIET_PLAN_CACHE_PREFIX}:${userId}:${creationDate}`;

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

  // 먼저 건강 맞춤 식단 캐시를 확인 (요청 날짜와 관계없이 유효한 최신 건강 맞춤 식단 반환)
  const aiDietKey = getCurrentValidAiDietKey(userId);
  if (aiDietKey) {
    const aiCached = safeParse(window.localStorage.getItem(aiDietKey));
    if (aiCached && aiCached.isAiGenerated) {
      console.log(`[DietPlanCache] 건강 맞춤 식단 캐시 히트: ${aiDietKey}`);
      return aiCached;
    }
  }

  // AI 식단이 없으면 기존 날짜 기반 캐시 확인
  const key = buildCacheKey(userId, date);
  const parsed = safeParse(window.localStorage.getItem(key));
  if (!parsed) {
    window.localStorage.removeItem(key);
    return null;
  }

  // 수동 생성 식단의 경우 날짜 검증 (AI 식단은 생성 날짜 기반이므로 검증 생략)
  if (!parsed.isAiGenerated && parsed.date !== date) {
    console.log(`[DietPlanCache] 날짜 불일치로 캐시 무효화: 캐시 날짜=${parsed.date}, 요청 날짜=${date}`);
    window.localStorage.removeItem(key);
    return null;
  }

  const isExpired =
    parsed.version !== CACHE_VERSION || parsed.expiresAt < Date.now();

  if (isExpired) {
    console.log(`[DietPlanCache] 캐시 만료: ${key}`);
    window.localStorage.removeItem(key);
    return null;
  }

  return parsed;
}

export function setCachedDietPlan(
  userId: string,
  date: string,
  dietPlan: DailyDietPlan,
  ttlMs = DEFAULT_TTL_MS,
  isAiGenerated = false
) {
  if (!isBrowser()) return;

  const now = Date.now();
  const creationDate = new Date().toISOString().split('T')[0]; // 오늘 날짜를 생성 날짜로 사용

  let expiresAt: number;
  if (isAiGenerated) {
    // 건강 맞춤 식단: 생성 다음 날 오후 6시까지 유효
    expiresAt = calculateAiDietExpiry(creationDate);
  } else {
    // 수동 생성 식단: 기본 TTL 사용
    expiresAt = now + ttlMs;
  }

  const payload: DietPlanCacheEntry = {
    userId,
    date,
    creationDate,
    dietPlan,
    storedAt: now,
    expiresAt,
    version: CACHE_VERSION,
    isAiGenerated,
  };

  // 키 전략:
  // - AI 건강 맞춤 식단: 생성 날짜(creationDate) 기반으로 저장 (오늘/어제 식단 자동 선택 로직에서 사용)
  // - 수동 생성 식단: 요청 날짜(date) 기반으로 저장 (요청 날짜와 1:1 매칭)
  const key = buildCacheKey(userId, isAiGenerated ? creationDate : date);
  window.localStorage.setItem(key, JSON.stringify(payload));

  console.log(`[DietPlanCache] 캐시 저장: ${key}, AI생성=${isAiGenerated}, 만료=${new Date(expiresAt).toLocaleString()}`);
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

/**
 * 디버깅용: 모든 식단 캐시 정보 조회
 */
export function getAllDietPlanCacheInfo(userId?: string): Array<{
  key: string;
  userId: string;
  date: string;
  creationDate: string;
  isAiGenerated: boolean;
  storedAt: Date;
  expiresAt: Date;
  isExpired: boolean;
}> {
  if (!isBrowser()) return [];

  const result: Array<{
    key: string;
    userId: string;
    date: string;
    creationDate: string;
    isAiGenerated: boolean;
    storedAt: Date;
    expiresAt: Date;
    isExpired: boolean;
  }> = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(`${DIET_PLAN_CACHE_PREFIX}:`)) {
      const parsed = safeParse(window.localStorage.getItem(key));
      if (parsed && (!userId || parsed.userId === userId)) {
        result.push({
          key,
          userId: parsed.userId,
          date: parsed.date,
          creationDate: parsed.creationDate,
          isAiGenerated: parsed.isAiGenerated || false,
          storedAt: new Date(parsed.storedAt),
          expiresAt: new Date(parsed.expiresAt),
          isExpired: parsed.expiresAt < Date.now(),
        });
      }
    }
  }

  return result.sort((a, b) => b.storedAt.getTime() - a.storedAt.getTime());
}





