/**
 * @file image-cache.ts
 * @description 레시피 이미지 로컬 캐시 유틸리티
 *
 * 캐시 전략:
 * - 레시피 slug(또는 제목) 기반 키 생성
 * - 기본 TTL: 72시간 (이미지 변경 주기 대비 적당한 기간)
 * - 이미지 소스/캐시 히트 여부를 함께 저장하여 로깅 시 재사용
 */

export interface RecipeImageCacheEntry {
  recipeId: string;
  imageUrl: string;
  imageSource: string;
  cacheHit: boolean;
  storedAt: number;
  expiresAt: number;
  version: string;
}

const IMAGE_CACHE_PREFIX = "recipeImage";
const IMAGE_CACHE_VERSION = "v1";
const DEFAULT_IMAGE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 72시간

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeKey = (recipeId: string) =>
  recipeId.trim().toLowerCase().replace(/\s+/g, "-");

const buildCacheKey = (recipeId: string) =>
  `${IMAGE_CACHE_PREFIX}:${normalizeKey(recipeId)}`;

const safeParse = (value: string | null): RecipeImageCacheEntry | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as RecipeImageCacheEntry;
  } catch {
    return null;
  }
};

export function getCachedRecipeImage(
  recipeId: string
): RecipeImageCacheEntry | null {
  if (!isBrowser()) return null;

  const key = buildCacheKey(recipeId);
  const parsed = safeParse(window.localStorage.getItem(key));
  if (!parsed) {
    window.localStorage.removeItem(key);
    return null;
  }

  const isExpired =
    parsed.version !== IMAGE_CACHE_VERSION || parsed.expiresAt < Date.now();

  if (isExpired) {
    window.localStorage.removeItem(key);
    return null;
  }

  return parsed;
}

export function setCachedRecipeImage(
  recipeId: string,
  imageUrl: string,
  imageSource: string,
  cacheHit: boolean,
  ttlMs = DEFAULT_IMAGE_TTL_MS
) {
  if (!isBrowser()) return;

  const now = Date.now();
  const payload: RecipeImageCacheEntry = {
    recipeId,
    imageUrl,
    imageSource,
    cacheHit,
    storedAt: now,
    expiresAt: now + ttlMs,
    version: IMAGE_CACHE_VERSION,
  };

  window.localStorage.setItem(buildCacheKey(recipeId), JSON.stringify(payload));
}

export function clearRecipeImageCache(recipeId?: string) {
  if (!isBrowser()) return;

  if (recipeId) {
    window.localStorage.removeItem(buildCacheKey(recipeId));
    return;
  }

  const keysToDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(`${IMAGE_CACHE_PREFIX}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => window.localStorage.removeItem(key));
}





