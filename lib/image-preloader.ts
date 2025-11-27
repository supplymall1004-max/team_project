/**
 * @file lib/image-preloader.ts
 * @description 이미지 프리로딩 및 로딩 최적화 유틸리티
 *
 * 주요 기능:
 * 1. Intersection Observer 기반 프리로딩
 * 2. 이미지 URL 배치 로딩
 * 3. 로딩 상태 관리
 * 4. 오류 처리 및 재시도
 */

import { searchFoodImage } from "@/actions/food-images";
import type { CachedFoodImage } from "@/lib/food-image-service";

export interface ImagePreloadOptions {
  threshold?: number; // 교차점 임계값 (0-1)
  rootMargin?: string; // 루트 마진
  maxConcurrent?: number; // 최대 동시 로딩 수
  timeout?: number; // 타임아웃 (ms)
  retries?: number; // 최대 재시도 횟수
}

export interface ImageLoadState {
  url: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error?: string;
  loadTime?: number;
  retries: number;
}

export interface PreloadResult {
  url: string;
  success: boolean;
  loadTime: number;
  error?: string;
}

/**
 * 이미지 프리로더 클래스
 */
export class ImagePreloader {
  private observer: IntersectionObserver | null = null;
  private loadingQueue: Set<string> = new Set();
  private loadStates: Map<string, ImageLoadState> = new Map();
  private options: Required<ImagePreloadOptions>;

  constructor(options: ImagePreloadOptions = {}) {
    this.options = {
      threshold: options.threshold ?? 0.1,
      rootMargin: options.rootMargin ?? '50px',
      maxConcurrent: options.maxConcurrent ?? 3,
      timeout: options.timeout ?? 10000,
      retries: options.retries ?? 2,
    };
  }

  /**
   * Intersection Observer 시작
   */
  startObserving(rootElement?: Element) {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const imageUrls = this.getImageUrlsFromElement(element);

            if (imageUrls.length > 0) {
              this.preloadImages(imageUrls);
            }

            // 옵저버에서 제거 (한 번만 로딩)
            this.observer?.unobserve(element);
          }
        });
      },
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin,
        root: rootElement,
      }
    );
  }

  /**
   * 요소 관찰 시작
   */
  observe(element: Element) {
    this.observer?.observe(element);
  }

  /**
   * 요소 관찰 중지
   */
  unobserve(element: Element) {
    this.observer?.unobserve(element);
  }

  /**
   * 모든 관찰 중지
   */
  disconnect() {
    this.observer?.disconnect();
    this.observer = null;
  }

  /**
   * 이미지들을 프리로드
   */
  async preloadImages(urls: string[]): Promise<PreloadResult[]> {
    const results: PreloadResult[] = [];

    // 이미 로딩 중이거나 완료된 URL은 필터링
    const urlsToLoad = urls.filter(url => {
      const state = this.loadStates.get(url);
      return !state || state.status === 'idle';
    });

    if (urlsToLoad.length === 0) {
      return results;
    }

    // 동시 로딩 제한
    const batches = this.chunkArray(urlsToLoad, this.options.maxConcurrent);

    for (const batch of batches) {
      const batchPromises = batch.map(url => this.loadSingleImage(url));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 단일 이미지 로딩 (재시도 로직 포함)
   */
  private async loadSingleImage(url: string): Promise<PreloadResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    // 이미 로딩 중이면 대기
    if (this.loadingQueue.has(url)) {
      return new Promise((resolve) => {
        const checkState = () => {
          const state = this.loadStates.get(url);
          if (state && (state.status === 'loaded' || state.status === 'error')) {
            resolve({
              url,
              success: state.status === 'loaded',
              loadTime: state.loadTime || 0,
              error: state.error,
            });
          } else {
            setTimeout(checkState, 100);
          }
        };
        checkState();
      });
    }

    this.loadingQueue.add(url);

    // 로딩 상태 초기화
    this.loadStates.set(url, {
      url,
      status: 'loading',
      retries: 0,
    });

    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        const result = await this.attemptImageLoad(url);

        const loadTime = Date.now() - startTime;
        const success = result.success;

        // 상태 업데이트
        this.loadStates.set(url, {
          url,
          status: success ? 'loaded' : 'error',
          error: result.error,
          loadTime,
          retries: attempt,
        });

        this.loadingQueue.delete(url);

        return {
          url,
          success,
          loadTime,
          error: result.error,
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[ImagePreloader] Attempt ${attempt + 1} failed for ${url}:`, lastError);

        // 재시도 전 잠시 대기
        if (attempt < this.options.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // 모든 재시도 실패
    const loadTime = Date.now() - startTime;
    this.loadStates.set(url, {
      url,
      status: 'error',
      error: lastError,
      loadTime,
      retries: this.options.retries,
    });

    this.loadingQueue.delete(url);

    return {
      url,
      success: false,
      loadTime,
      error: lastError,
    };
  }

  /**
   * 이미지 로딩 시도 (한 번)
   */
  private async attemptImageLoad(url: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        img.src = ''; // 로딩 취소
        resolve({ success: false, error: 'Timeout' });
      }, this.options.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve({ success: true });
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve({ success: false, error: 'Load failed' });
      };

      img.src = url;
    });
  }

  /**
   * 요소에서 이미지 URL 추출
   */
  private getImageUrlsFromElement(element: HTMLElement): string[] {
    const urls: string[] = [];

    // data-preload-images 속성에서 URL 가져오기
    const preloadAttr = element.getAttribute('data-preload-images');
    if (preloadAttr) {
      try {
        const parsed = JSON.parse(preloadAttr);
        if (Array.isArray(parsed)) {
          urls.push(...parsed.filter(url => typeof url === 'string'));
        }
      } catch (e) {
        console.warn('[ImagePreloader] Failed to parse data-preload-images:', e);
      }
    }

    // img 태그의 src 속성
    const imgElements = element.querySelectorAll('img');
    imgElements.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        urls.push(src);
      }
    });

    return [...new Set(urls)]; // 중복 제거
  }

  /**
   * 배열을 청크로 나누기
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 로딩 상태 조회
   */
  getLoadState(url: string): ImageLoadState | undefined {
    return this.loadStates.get(url);
  }

  /**
   * 모든 로딩 상태 조회
   */
  getAllLoadStates(): Map<string, ImageLoadState> {
    return new Map(this.loadStates);
  }

  /**
   * 로딩 통계 조회
   */
  getStats(): {
    total: number;
    loading: number;
    loaded: number;
    error: number;
    averageLoadTime: number;
  } {
    const states = Array.from(this.loadStates.values());
    const total = states.length;
    const loading = states.filter(s => s.status === 'loading').length;
    const loaded = states.filter(s => s.status === 'loaded').length;
    const error = states.filter(s => s.status === 'error').length;

    const loadTimes = states
      .filter(s => s.loadTime && s.status === 'loaded')
      .map(s => s.loadTime!);

    const averageLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      : 0;

    return {
      total,
      loading,
      loaded,
      error,
      averageLoadTime: Math.round(averageLoadTime),
    };
  }
}

// 싱글톤 인스턴스
export const imagePreloader = new ImagePreloader();

/**
 * React Hook: 이미지 프리로딩
 */
export function useImagePreloader() {
  return imagePreloader;
}

/**
 * 음식 이미지 프리로딩 헬퍼
 */
export async function preloadFoodImages(titles: string[]): Promise<CachedFoodImage[]> {
  console.log(`🍽️ [Preloader] ${titles.length}개 음식 이미지 프리로딩 시작`);

  const images: CachedFoodImage[] = [];

  // 최대 5개씩 병렬 처리
  const batchSize = 5;
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const promises = batch.map(async (title) => {
      try {
        const image = await searchFoodImage(title);
        return image;
      } catch (error) {
        console.warn(`🍽️ [Preloader] "${title}" 이미지 검색 실패:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    images.push(...results.filter((img): img is CachedFoodImage => img !== null));
  }

  console.log(`🍽️ [Preloader] ${images.length}개 이미지 프리로딩 완료`);
  return images;
}

/**
 * 이미지 URL 유효성 검증 (향상된 버전)
 */
export async function validateImageUrlEnhanced(
  url: string,
  options: {
    timeout?: number;
    retries?: number;
    userAgent?: string;
  } = {}
): Promise<{ valid: boolean; responseTime?: number; error?: string }> {
  const { timeout = 5000, retries = 2, userAgent } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'HEAD',
        headers: userAgent ? { 'User-Agent': userAgent } : undefined,
        signal: AbortSignal.timeout(timeout),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return { valid: true, responseTime };
      } else {
        return {
          valid: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (isLastAttempt) {
        return {
          valid: false,
          error: errorMessage
        };
      }

      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return { valid: false, error: 'Max retries exceeded' };
}
