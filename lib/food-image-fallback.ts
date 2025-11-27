/**
 * @file food-image-fallback.ts
 * @description 음식 이미지 로딩 실패 시 폴백 처리 유틸리티
 *
 * 이미지 로딩에 실패했을 때 적절한 대체 이미지를 제공하고,
 * 사용자 경험을 개선하는 기능을 제공합니다.
 */

import { FOOD_IMAGE_LIBRARY, FOOD_IMAGE_FALLBACK_URL, FoodImageCategory } from "@/data/food-image-links";

export interface ImageFallbackOptions {
  foodName: string;
  onError?: (error: Error, attempt: number) => void;
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number; // 지수적 백오프 승수
  timeout?: number; // 각 요청 타임아웃 (ms)
}

/**
 * 음식명을 기반으로 적절한 폴백 이미지 선택
 * 
 * 우선순위:
 * 1. foodjpg.md에서 제공된 폴백 이미지 URL (FOOD_IMAGE_FALLBACK_URL)
 * 2. 카테고리별 기본 이미지
 * 3. 기본 폴백 이미지
 */
export function getFallbackImageForFood(foodName: string): string {
  // 1순위: foodjpg.md에서 제공된 폴백 이미지 URL
  if (FOOD_IMAGE_FALLBACK_URL) {
    return FOOD_IMAGE_FALLBACK_URL;
  }

  // 2순위: 음식명으로 카테고리 판단
  const category = categorizeFoodByName(foodName);

  // 해당 카테고리의 기본 이미지 반환
  const categoryImage = FOOD_IMAGE_LIBRARY[category];
  return categoryImage?.url || FOOD_IMAGE_LIBRARY.default.url;
}

/**
 * 음식명을 분석해서 카테고리 분류
 */
function categorizeFoodByName(foodName: string): FoodImageCategory {
  const lowerName = foodName.toLowerCase();

  // 밥류
  if (lowerName.includes('밥') || lowerName.includes('rice') ||
      lowerName.includes('쌀') || lowerName.includes('현미') ||
      lowerName.includes('잡곡')) {
    return 'rice';
  }

  // 찌개류
  if (lowerName.includes('찌개') || lowerName.includes('stew') ||
      lowerName.includes('김치찌개') || lowerName.includes('된장찌개') ||
      lowerName.includes('순두부찌개') || lowerName.includes('부대찌개')) {
    return 'stew';
  }

  // 국/탕류
  if (lowerName.includes('국') || lowerName.includes('탕') ||
      lowerName.includes('soup') || lowerName.includes('된장국') ||
      lowerName.includes('미역국') || lowerName.includes('육개장') ||
      lowerName.includes('감자탕')) {
    return 'soup';
  }

  // 반찬류 (나물, 무침, 볶음 등)
  if (lowerName.includes('나물') || lowerName.includes('무침') ||
      lowerName.includes('볶음') || lowerName.includes('조림') ||
      lowerName.includes('구이') || lowerName.includes('전') ||
      lowerName.includes('시금치') || lowerName.includes('콩나물') ||
      lowerName.includes('가지') || lowerName.includes('감자') ||
      lowerName.includes('두부') || lowerName.includes('계란')) {
    return 'side';
  }

  // 과일류
  if (lowerName.includes('과일') || lowerName.includes('fruit') ||
      lowerName.includes('사과') || lowerName.includes('바나나') ||
      lowerName.includes('오렌지') || lowerName.includes('포도') ||
      lowerName.includes('키위') || lowerName.includes('딸기') ||
      lowerName.includes('수박') || lowerName.includes('멜론')) {
    return 'fruit';
  }

  // 샐러드류
  if (lowerName.includes('샐러드') || lowerName.includes('salad') ||
      lowerName.includes('야채')) {
    return 'salad';
  }

  // 간식류
  if (lowerName.includes('간식') || lowerName.includes('snack') ||
      lowerName.includes('쿠키') || lowerName.includes('빵') ||
      lowerName.includes('케이크') || lowerName.includes('요거트') ||
      lowerName.includes('치즈')) {
    return 'snack';
  }

  // 디저트류
  if (lowerName.includes('디저트') || lowerName.includes('dessert') ||
      lowerName.includes('케이크') || lowerName.includes('커피') ||
      lowerName.includes('차')) {
    return 'dessert';
  }

  // 음료류
  if (lowerName.includes('주스') || lowerName.includes('차') ||
      lowerName.includes('음료') || lowerName.includes('drink') ||
      lowerName.includes('커피') || lowerName.includes('우유') ||
      lowerName.includes('스무디')) {
    return 'drink';
  }

  // 기본값
  return 'default';
}

/**
 * 이미지 URL의 유효성을 확인하고 적절한 폴백 제공 (개선된 버전)
 *
 * 개선사항:
 * - 지수적 백오프 적용
 * - 네트워크 타임아웃 처리
 * - 더 나은 에러 분류 및 처리
 * - 시도별 콜백 호출
 */
export async function validateAndFallbackImage(
  imageUrl: string,
  foodName: string,
  options: ImageFallbackOptions = { foodName }
): Promise<string> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    timeout = 5000
  } = options;

  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🍽️ 이미지 유효성 확인 시작 (${foodName}) - 시도 ${attempt + 1}/${maxRetries + 1}`);

      // 타임아웃 적용된 fetch 요청
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(imageUrl, {
        method: 'HEAD',
        signal: controller.signal,
        next: { revalidate: 0 }, // 캐시 무시
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Content-Type 확인 (이미지인지 검증)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          console.log(`🍽️ 이미지 유효성 확인 성공 (${foodName}) - ${contentType}`);
          return imageUrl; // 유효한 이미지
        } else {
          console.warn(`🍽️ 잘못된 콘텐츠 타입 (${foodName}): ${contentType}`);
        }
      } else if (response.status === 404) {
        console.warn(`🍽️ 이미지 없음 (${foodName}): 404 Not Found`);
        break; // 404는 재시도해도 의미 없음
      } else if (response.status >= 500) {
        console.warn(`🍽️ 서버 오류 (${foodName}): ${response.status} - 재시도 가능`);
      } else {
        console.warn(`🍽️ 클라이언트 오류 (${foodName}): ${response.status}`);
        break; // 4xx 오류는 재시도해도 의미 없음
      }
    } catch (error) {
      console.warn(`🍽️ 이미지 유효성 확인 중 오류 (${foodName}):`, error);

      // 에러 타입별 처리
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`🍽️ 네트워크 타임아웃 (${foodName}): ${timeout}ms 초과`);
        } else if (error.message.includes('fetch')) {
          console.warn(`🍽️ 네트워크 오류 (${foodName}): 연결 실패`);
        }
      }

      // 에러 콜백 호출 (시도 번호 포함)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)), attempt + 1);
      }
    }

    // 마지막 시도가 아니면 지수적 백오프 적용하여 대기 후 재시도
    if (attempt < maxRetries) {
      console.log(`🍽️ 재시도 대기 (${foodName}): ${currentDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier; // 지수적 백오프
    }
  }

  // 모든 시도 실패 시 폴백 이미지 반환
  const fallbackUrl = getFallbackImageForFood(foodName);
  console.log(`🍽️ 폴백 이미지 사용 (${foodName}): ${fallbackUrl}`);
  return fallbackUrl;
}

/**
 * 이미지 요소에 폴백 처리를 적용하는 헬퍼 함수
 */
export function applyImageFallback(
  imgElement: HTMLImageElement,
  foodName: string,
  originalUrl: string
): void {
  imgElement.onerror = () => {
    console.error(`🍽️ 이미지 로딩 실패 (${foodName}): ${originalUrl}`);

    // 폴백 이미지로 교체
    const fallbackUrl = getFallbackImageForFood(foodName);
    imgElement.src = fallbackUrl;

    // 폴백 이미지까지 실패하면 플레이스홀더 표시
    imgElement.onerror = () => {
      console.error(`🍽️ 폴백 이미지 로딩 실패 (${foodName}): ${fallbackUrl}`);

      // 부모 요소에 플레이스홀더 표시
      if (imgElement.parentElement) {
        imgElement.parentElement.innerHTML = `
          <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div class="text-center">
              <div class="text-4xl mb-2">🍽️</div>
              <p class="text-xs text-orange-600">${foodName}</p>
            </div>
          </div>
        `;
      }
    };
  };
}

/**
 * React 컴포넌트에서 사용할 이미지 에러 핸들러
 */
export function createImageErrorHandler(foodName: string) {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = event.target as HTMLImageElement;
    applyImageFallback(imgElement, foodName, imgElement.src);
  };
}

/**
 * 이미지 프리로딩 함수 (성능 최적화용)
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 여러 이미지를 동시에 프리로딩
 */
export async function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => preloadImage(url));
  return Promise.all(promises);
}


