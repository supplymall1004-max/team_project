/**
 * @file food-image-links.ts
 * @description docs/foodjpg.md에서 음식 이미지 링크를 로드하는 모듈
 */

export interface FoodImageSource {
  category: FoodImageCategory;
  /**
   * Unsplash의 고정 URL (이미지 최적화 파라미터 포함).
   * Next Image remotePatterns에 해당 호스트가 포함되어야 합니다.
   */
  url: string;
  title: string;
  author: string;
  authorProfile: string;
  source: string;
  description: string;
}

export type FoodImageCategory =
  | "rice"
  | "side"
  | "soup"
  | "stew"
  | "fruit"
  | "snack"
  | "salad"
  | "dessert"
  | "drink"
  | "default";

/**
 * 빌드 시점에 docs/foodjpg.md에서 파싱된 음식 이미지 링크들
 * 직접 하드코딩하여 클라이언트/서버 모두에서 사용 가능하도록 함
 */
export const FOOD_IMAGE_DIRECT_LINKS: Record<string, string> = {
  // 밥 종류
  '흰쌀밥': '/images/food/흰쌀밥.jpg',
  '현미밥': '/images/food/현미밥.jpg',
  '잡곡밥': '/images/food/잡곡밥.jpg',

  // 반찬 종류
  '시금치나물': '/images/food/시금치나물.jpg',
  '콩나물무침': '/images/food/콩나물무침.jpg',
  '고구마줄기볶음': '/images/food/고구마줄기볶음.jpg',
  '두부조림': '/images/food/두부조림.jpg',
  '감자조림': '/images/food/감자조림.jpg',
  '계란찜': '/images/food/계란찜.jpg',
  '김치': '/images/food/김치.jpg',
  '깍두기': '/images/food/깍두기.jpg',
  '오이소박이': '/images/food/side.svg',
  '도토리묵': '/images/food/side.svg',
  '미역줄기볶음': '/images/food/side.svg',
  '호박볶음': '/images/food/side.svg',
  '어묵볶음': '/images/food/side.svg',
  '멸치볶음': '/images/food/side.svg',
  '진미채볶음': '/images/food/side.svg',
  '감자채볶음': '/images/food/side.svg',
  '고사리나물': '/images/food/side.svg',
  '취나물': '/images/food/side.svg',
  '도라지나물': '/images/food/side.svg',
  '쑥갓나물': '/images/food/side.svg',
  '참나물': '/images/food/side.svg',
  '고춧잎장아찌': '/images/food/side.svg',
  '오이지': '/images/food/side.svg',
  '총각김치': '/images/food/side.svg',
  '파김치': '/images/food/side.svg',
  '열무김치': '/images/food/side.svg',
  '갓김치': '/images/food/side.svg',
  '동치미': '/images/food/side.svg',
  '보쌈김치': '/images/food/side.svg',

  // 국/찌개 종류
  '순두부찌개': '/images/food/순두부찌개.jpg',
  '김치찌개': '/images/food/김치찌개.jpg',
  '된장찌개': '/images/food/soup.svg',
  '청국장찌개': '/images/food/soup.svg',
  '부대찌개': '/images/food/soup.svg',
  '돼지고기찌개': '/images/food/soup.svg',
  '소고기찌개': '/images/food/soup.svg',
  '감자탕': '/images/food/soup.svg',
  '뼈해장국': '/images/food/soup.svg',
  '육개장': '/images/food/soup.svg',
  '시래기국': '/images/food/soup.svg',
  '콩비지찌개': '/images/food/soup.svg',
  '미역국': '/images/food/soup.svg',
  '북어국': '/images/food/soup.svg',
  '황태국': '/images/food/soup.svg',
  '떡국': '/images/food/soup.svg',
  '만두국': '/images/food/soup.svg',
  '토란국': '/images/food/soup.svg',
  '감자국': '/images/food/soup.svg',
  '고사리국': '/images/food/soup.svg',
  '버섯국': '/images/food/soup.svg',
  '쇠고기무국': '/images/food/soup.svg',
  '소고기무국': '/images/food/soup.svg',
  '달걀국': '/images/food/soup.svg',
  '김치국': '/images/food/soup.svg',
  '된장국': '/images/food/soup.svg',

  // 과일 종류
  '배': '/images/food/배.jpg',
  '사과': '/images/food/사과.jpg',
  '바나나': '/images/food/바나나.jpg',
  '복숭아': '/images/food/dessert.svg',
  '수박': '/images/food/수박.jpg',
  '옥수수': '/images/food/옥수수.jpg',
  '포도': '/images/food/fruit.svg',
  '딸기': '/images/food/fruit.svg',
  '키위': '/images/food/fruit.svg',
  '오렌지': '/images/food/fruit.svg',
  '귤': '/images/food/fruit.svg',
  '레몬': '/images/food/fruit.svg',
  '자몽': '/images/food/fruit.svg',
  '망고': '/images/food/fruit.svg',
  '파인애플': '/images/food/fruit.svg',
  '체리': '/images/food/fruit.svg',
  '블루베리': '/images/food/fruit.svg',
  '라즈베리': '/images/food/fruit.svg',
  '블랙베리': '/images/food/fruit.svg',
  '크랜베리': '/images/food/fruit.svg',
  '살구': '/images/food/fruit.svg',
  '자두': '/images/food/fruit.svg',
  '무화과': '/images/food/fruit.svg',
  '대추': '/images/food/fruit.svg',
  '감': '/images/food/fruit.svg',
  '홍시': '/images/food/fruit.svg',
  '유자': '/images/food/fruit.svg',
};

/**
 * foodjpg.md에서 제공된 음식명별 직접 이미지 URL 매핑
 * 하위 호환성을 위한 동기 함수
 */
export function getFoodImageDirectLinks(): Record<string, string> {
  return FOOD_IMAGE_DIRECT_LINKS;
}

/**
 * 특정 음식의 이미지 URL을 가져옵니다.
 *
 * @param foodName 음식 이름
 * @returns 이미지 URL 또는 null
 */
export function getFoodImageUrl(foodName: string): string | null {
  return FOOD_IMAGE_DIRECT_LINKS[foodName.trim()] || null;
}

/**
 * 카테고리별 대표 이미지 사전.
 * 필요한 경우 항목을 추가/수정하여 새로운 음식군과 매칭할 수 있습니다.
 */
export const FOOD_IMAGE_LIBRARY: Record<FoodImageCategory, FoodImageSource> = {
  rice: {
    category: "rice",
    url: "/images/food/rice.svg",
    title: "Korean Rice Bowl",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "따뜻한 흰쌀밥 한 그릇",
  },
  side: {
    category: "side",
    url: "/images/food/side.svg",
    title: "Korean Side Dishes",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "다양한 나물과 반찬",
  },
  soup: {
    category: "soup",
    url: "/images/food/soup.svg",
    title: "Korean Soup Bowl",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "국·탕류 따끈한 한 그릇",
  },
  stew: {
    category: "stew",
    url: "/images/food/soup.svg",
    title: "Hot Korean Stew",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "얼큰한 찌개 한 그릇",
  },
  fruit: {
    category: "fruit",
    url: "/images/food/fruit.svg",
    title: "Seasonal Fruits",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "다채로운 과일 볼",
  },
  snack: {
    category: "snack",
    url: "/images/food/snack.svg",
    title: "Light Snack",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "간단한 티타임 간식",
  },
  salad: {
    category: "salad",
    url: "/images/food/salad.svg",
    title: "Fresh Salad",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "샐러드 & 가벼운 식단",
  },
  dessert: {
    category: "dessert",
    url: "/images/food/dessert.svg",
    title: "Dessert Plate",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "디저트 & 브런치",
  },
  drink: {
    category: "drink",
    url: "/images/food/drink.svg",
    title: "Healthy Drink",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "주스/발효음료",
  },
  default: {
    category: "default",
    url: "/images/food/default.svg",
    title: "Korean Soup Bowl",
    author: "Local SVG",
    authorProfile: "",
    source: "",
    description: "따끈한 국 한 그릇",
  },
};

/**
 * foodjpg.md에서 제공된 이미지 로딩 실패 시 폴백 이미지 URL
 */
export const FOOD_IMAGE_FALLBACK_URL = 'https://lh3.googleusercontent.com/gg-dl/ABS2GSmW6Fv_1xmqlfCBcmS-z8PnjsNkM7WcG7YvO0m1ZhjIrIlS3FSOeeWh2kYNmksS2SEVcz8aqH7GDBpZ_Wk5Q9vAZ5saCnxMc9MODojquMCJ2ubFMc8_hddXswpCPFyDuaANsiZr-xX87As5wlsAfaXCr-B998rJqaxZXUWrxpRDOuWa=s1024-rj';

