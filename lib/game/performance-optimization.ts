/**
 * @file lib/game/performance-optimization.ts
 * @description 게임 요소 성능 최적화 유틸리티
 *
 * 게임 요소들의 성능을 최적화하기 위한 유틸리티 함수들입니다.
 *
 * 주요 기능:
 * 1. 데이터 페칭 최적화 (캐싱, 배치 처리)
 * 2. 리스트 렌더링 최적화 (가상화)
 * 3. 애니메이션 성능 최적화
 * 4. 메모리 관리
 *
 * @dependencies
 * - react: useMemo, useCallback
 */

/**
 * 데이터 페칭 최적화: 배치 처리
 * 여러 API 호출을 하나의 배치로 묶어서 처리
 */
export async function batchFetchGameData<T>(
  fetchers: Array<() => Promise<T>>,
  batchSize: number = 3
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < fetchers.length; i += batchSize) {
    const batch = fetchers.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((fetcher) => fetcher()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 리스트 가상화를 위한 아이템 높이 계산
 */
export function calculateItemHeight(
  itemCount: number,
  containerHeight: number,
  minItemHeight: number = 80
): number {
  const calculatedHeight = Math.floor(containerHeight / itemCount);
  return Math.max(calculatedHeight, minItemHeight);
}

/**
 * 디바운스 함수 (성능 최적화)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 쓰로틀 함수 (성능 최적화)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 메모이제이션 키 생성
 */
export function createMemoKey(...args: any[]): string {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      return JSON.stringify(arg);
    }
    return String(arg);
  }).join('|');
}

/**
 * 애니메이션 성능 최적화: will-change 속성 관리
 */
export function optimizeAnimation(element: HTMLElement | null, enable: boolean = true): void {
  if (!element) return;
  
  if (enable) {
    element.style.willChange = 'transform, opacity';
  } else {
    element.style.willChange = 'auto';
  }
}

/**
 * 이미지 지연 로딩 최적화
 */
export function createLazyImageLoader(
  imageUrl: string,
  placeholder?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(imageUrl);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    if (placeholder) {
      img.src = placeholder;
    }
    
    img.src = imageUrl;
  });
}

/**
 * 게임 데이터 캐싱 전략
 */
export class GameDataCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

// 전역 캐시 인스턴스
export const gameDataCache = new GameDataCache();

