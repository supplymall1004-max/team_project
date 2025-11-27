/**
 * @file hooks/use-image-preloader.ts
 * @description 이미지 프리로딩을 위한 React Hook
 *
 * 주요 기능:
 * 1. Intersection Observer 기반 자동 프리로딩
 * 2. 로딩 상태 관리
 * 3. 메모이제이션으로 성능 최적화
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { imagePreloader, preloadFoodImages } from '@/lib/image-preloader';
import type { ImageLoadState, PreloadResult } from '@/lib/image-preloader';
import type { CachedFoodImage } from '@/lib/food-image-service';

interface UseImagePreloaderOptions {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
  preloadFoodImages?: boolean;
  foodTitles?: string[];
}

interface UseImagePreloaderReturn {
  // 프리로딩 상태
  isPreloading: boolean;
  preloadProgress: number;
  preloadResults: PreloadResult[];

  // 이미지 로딩 상태
  getImageLoadState: (url: string) => ImageLoadState | undefined;
  getPreloaderStats: () => ReturnType<typeof imagePreloader.getStats>;

  // 수동 제어
  preloadImages: (urls: string[]) => Promise<PreloadResult[]>;
  preloadFoodImages: (titles: string[]) => Promise<CachedFoodImage[]>;

  // 관찰 제어
  observeElement: (element: Element) => void;
  unobserveElement: (element: Element) => void;
}

/**
 * 이미지 프리로딩 Hook
 */
export function useImagePreloader(options: UseImagePreloaderOptions = {}): UseImagePreloaderReturn {
  const {
    enabled = true,
    threshold = 0.1,
    rootMargin = '50px',
    preloadFoodImages: shouldPreloadFoodImages = false,
    foodTitles = [],
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadResults, setPreloadResults] = useState<PreloadResult[]>([]);

  const observerStartedRef = useRef(false);

  // Intersection Observer 초기화
  useEffect(() => {
    if (!enabled || observerStartedRef.current) return;

    console.log('[useImagePreloader] Intersection Observer 시작');
    imagePreloader.startObserving();
    observerStartedRef.current = true;

    return () => {
      console.log('[useImagePreloader] Intersection Observer 정리');
      imagePreloader.disconnect();
      observerStartedRef.current = false;
    };
  }, [enabled]);

  // 음식 이미지 프리로딩
  useEffect(() => {
    if (!enabled || !shouldPreloadFoodImages || foodTitles.length === 0) return;

    const loadFoodImages = async () => {
      setIsPreloading(true);
      setPreloadProgress(0);

      try {
        console.log('[useImagePreloader] 음식 이미지 프리로딩 시작:', foodTitles.length, '개');

        const images = await preloadFoodImages(foodTitles);

        // 이미지 URL 추출 및 프리로딩
        const imageUrls = images.map(img => img.image_url);
        const results = await imagePreloader.preloadImages(imageUrls);

        setPreloadResults(results);
        setPreloadProgress(100);

        console.log('[useImagePreloader] 음식 이미지 프리로딩 완료:', images.length, '개');

      } catch (error) {
        console.error('[useImagePreloader] 음식 이미지 프리로딩 실패:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    loadFoodImages();
  }, [enabled, shouldPreloadFoodImages, foodTitles.join(',')]);

  // 수동 이미지 프리로딩
  const preloadImages = useCallback(async (urls: string[]): Promise<PreloadResult[]> => {
    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      const results = await imagePreloader.preloadImages(urls);
      setPreloadResults(prev => [...prev, ...results]);
      setPreloadProgress(100);

      return results;
    } finally {
      setIsPreloading(false);
    }
  }, []);

  // 음식 이미지 프리로딩
  const preloadFoodImagesManual = useCallback(async (titles: string[]): Promise<CachedFoodImage[]> => {
    return preloadFoodImages(titles);
  }, []);

  // 요소 관찰
  const observeElement = useCallback((element: Element) => {
    imagePreloader.observe(element);
  }, []);

  const unobserveElement = useCallback((element: Element) => {
    imagePreloader.unobserve(element);
  }, []);

  // 이미지 로딩 상태 조회
  const getImageLoadState = useCallback((url: string) => {
    return imagePreloader.getLoadState(url);
  }, []);

  // 프리로더 통계 조회
  const getPreloaderStats = useCallback(() => {
    return imagePreloader.getStats();
  }, []);

  return {
    isPreloading,
    preloadProgress,
    preloadResults,
    getImageLoadState,
    getPreloaderStats,
    preloadImages,
    preloadFoodImages: preloadFoodImagesManual,
    observeElement,
    unobserveElement,
  };
}

/**
 * 카드 리스트용 이미지 프리로딩 Hook (최적화 버전)
 */
export function useCardImagePreloader(cardTitles: string[]) {
  const [preloadedImages, setPreloadedImages] = useState<Map<string, CachedFoodImage>>(new Map());

  const { preloadFoodImages, isPreloading, preloadProgress } = useImagePreloader({
    enabled: cardTitles.length > 0,
    preloadFoodImages: true,
    foodTitles: cardTitles,
  });

  // 프리로딩된 이미지를 맵에 저장
  useEffect(() => {
    if (cardTitles.length === 0) return;

    const loadImages = async () => {
      try {
        const images = await preloadFoodImages(cardTitles);
        const imageMap = new Map<string, CachedFoodImage>();

        images.forEach(img => {
          imageMap.set(img.food_name, img);
        });

        setPreloadedImages(imageMap);

        console.log('[useCardImagePreloader] 카드 이미지 프리로딩 완료:', images.length, '개');
      } catch (error) {
        console.error('[useCardImagePreloader] 카드 이미지 프리로딩 실패:', error);
      }
    };

    loadImages();
  }, [cardTitles.join(',')]);

  // 특정 카드의 프리로딩된 이미지 조회
  const getPreloadedImage = useCallback((title: string): CachedFoodImage | null => {
    return preloadedImages.get(title) || null;
  }, [preloadedImages]);

  return {
    preloadedImages,
    getPreloadedImage,
    isPreloading,
    preloadProgress,
  };
}

/**
 * 단일 이미지 로딩 상태 추적 Hook
 */
export function useImageLoadState(imageUrl: string | null | undefined) {
  const [loadState, setLoadState] = useState<ImageLoadState | null>(null);

  const { getImageLoadState } = useImagePreloader({ enabled: !!imageUrl });

  useEffect(() => {
    if (!imageUrl) {
      setLoadState(null);
      return;
    }

    const state = getImageLoadState(imageUrl);
    setLoadState(state || null);

    // 주기적으로 상태 확인
    const interval = setInterval(() => {
      const currentState = getImageLoadState(imageUrl);
      setLoadState(currentState || null);
    }, 500);

    return () => clearInterval(interval);
  }, [imageUrl, getImageLoadState]);

  return loadState;
}
