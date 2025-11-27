/**
 * @file recipe-image.ts
 * @description 레시피 이미지 URL 생성 유틸리티
 *
 * 주요 기능:
 * 1. thumbnail_url이 있으면 그대로 반환
 * 2. 없으면 레시피 이름/카테고리 기반 무료 이미지 URL 반환
 * 3. 공통 이미지 라이브러리(data/food-image-links.ts) 재사용
 */

import {
  FOOD_IMAGE_LIBRARY,
  FOOD_IMAGE_DIRECT_LINKS,
  FoodImageCategory,
} from "@/data/food-image-links";
import { SEASONAL_FRUITS } from "@/lib/diet/seasonal-fruits";

/**
 * 레시피 이름을 기반으로 카테고리 판단
 */
export function getRecipeCategory(title: string): FoodImageCategory {
  const lowerTitle = title.toLowerCase();

  // 밥류 - 우선순위 높음
  if (
    lowerTitle.includes("밥") ||
    lowerTitle.includes("rice") ||
    lowerTitle.includes("쌀") ||
    lowerTitle.includes("현미") ||
    lowerTitle.includes("흰쌀") ||
    lowerTitle.includes("잡곡")
  ) {
    return "rice";
  }

  // 찌개류
  if (
    lowerTitle.includes("찌개") ||
    lowerTitle.includes("stew") ||
    lowerTitle.includes("김치찌개") ||
    lowerTitle.includes("된장찌개") ||
    lowerTitle.includes("순두부찌개") ||
    lowerTitle.includes("부대찌개")
  ) {
    return "stew";
  }

  // 국/탕류
  if (
    lowerTitle.includes("국") ||
    lowerTitle.includes("탕") ||
    lowerTitle.includes("soup") ||
    lowerTitle.includes("된장국") ||
    lowerTitle.includes("미역국") ||
    lowerTitle.includes("콩나물국") ||
    lowerTitle.includes("북어국") ||
    lowerTitle.includes("무국") ||
    lowerTitle.includes("육개장") ||
    lowerTitle.includes("감자탕")
  ) {
    return "soup";
  }

  // 반찬류 (나물, 무침, 볶음, 조림, 구이, 튀김 등)
  if (
    lowerTitle.includes("나물") ||
    lowerTitle.includes("무침") ||
    lowerTitle.includes("볶음") ||
    lowerTitle.includes("조림") ||
    lowerTitle.includes("구이") ||
    lowerTitle.includes("튀김") ||
    lowerTitle.includes("전") ||
    lowerTitle.includes("찐") ||
    lowerTitle.includes("namul") ||
    lowerTitle.includes("muchim") ||
    lowerTitle.includes("stir-fry") ||
    lowerTitle.includes("grilled") ||
    lowerTitle.includes("fried") ||
    lowerTitle.includes("pan-fried") ||
    // 특정 반찬들
    lowerTitle.includes("시금치") ||
    lowerTitle.includes("콩나물") ||
    lowerTitle.includes("고구마줄기") ||
    lowerTitle.includes("가지") ||
    lowerTitle.includes("오이") ||
    lowerTitle.includes("감자") ||
    lowerTitle.includes("두부") ||
    lowerTitle.includes("계란") ||
    lowerTitle.includes("애호박") ||
    lowerTitle.includes("무생채") ||
    lowerTitle.includes("부추") ||
    lowerTitle.includes("미나리") ||
    lowerTitle.includes("시래기") ||
    lowerTitle.includes("고사리") ||
    lowerTitle.includes("도라지") ||
    lowerTitle.includes("우엉") ||
    lowerTitle.includes("당근") ||
    lowerTitle.includes("양파") ||
    lowerTitle.includes("대파") ||
    lowerTitle.includes("마늘") ||
    lowerTitle.includes("생강")
  ) {
    return "side";
  }

  // 과일류
  if (
    lowerTitle.includes("과일") ||
    lowerTitle.includes("fruit") ||
    lowerTitle.includes("berry") ||
    lowerTitle.includes("사과") ||
    lowerTitle.includes("바나나") ||
    lowerTitle.includes("오렌지") ||
    lowerTitle.includes("포도") ||
    lowerTitle.includes("키위") ||
    lowerTitle.includes("딸기") ||
    lowerTitle.includes("블루베리") ||
    lowerTitle.includes("레몬") ||
    lowerTitle.includes("자몽") ||
    lowerTitle.includes("망고") ||
    lowerTitle.includes("파인애플") ||
    lowerTitle.includes("수박") ||
    lowerTitle.includes("멜론") ||
    lowerTitle.includes("참외") ||
    lowerTitle.includes("복숭아") ||
    lowerTitle.includes("배") ||
    lowerTitle.includes("감") ||
    lowerTitle.includes("귤") ||
    lowerTitle.includes("유자")
  ) {
    return "fruit";
  }

  // 샐러드류
  if (
    lowerTitle.includes("샐러드") ||
    lowerTitle.includes("salad") ||
    lowerTitle.includes("나물무침") ||
    lowerTitle.includes("야채") ||
    lowerTitle.includes("vegetable")
  ) {
    return "salad";
  }

  // 간식류
  if (
    lowerTitle.includes("간식") ||
    lowerTitle.includes("snack") ||
    lowerTitle.includes("bar") ||
    lowerTitle.includes("쿠키") ||
    lowerTitle.includes("빵") ||
    lowerTitle.includes("케이크") ||
    lowerTitle.includes("초콜릿") ||
    lowerTitle.includes("사탕") ||
    lowerTitle.includes("젤리") ||
    lowerTitle.includes("아이스크림") ||
    lowerTitle.includes("요거트") ||
    lowerTitle.includes("치즈")
  ) {
    return "snack";
  }

  // 디저트류
  if (
    lowerTitle.includes("디저트") ||
    lowerTitle.includes("dessert") ||
    lowerTitle.includes("케이크") ||
    lowerTitle.includes("브런치") ||
    lowerTitle.includes("타르트") ||
    lowerTitle.includes("푸딩") ||
    lowerTitle.includes("무스") ||
    lowerTitle.includes("크림") ||
    lowerTitle.includes("커피") ||
    lowerTitle.includes("차") ||
    lowerTitle.includes("음료")
  ) {
    return "dessert";
  }

  // 음료류
  if (
    lowerTitle.includes("주스") ||
    lowerTitle.includes("차") ||
    lowerTitle.includes("음료") ||
    lowerTitle.includes("drink") ||
    lowerTitle.includes("tea") ||
    lowerTitle.includes("커피") ||
    lowerTitle.includes("라떼") ||
    lowerTitle.includes("에스프레소") ||
    lowerTitle.includes("카푸치노") ||
    lowerTitle.includes("우유") ||
    lowerTitle.includes("두유") ||
    lowerTitle.includes("스무디") ||
    lowerTitle.includes("에이드")
  ) {
    return "drink";
  }

  // 기본값
  return "default";
}

function getCategoryImage(category: FoodImageCategory) {
  return FOOD_IMAGE_LIBRARY[category] ?? FOOD_IMAGE_LIBRARY.default;
}

/**
 * 레시피 이미지 URL 생성
 *
 * @param recipeTitle 레시피 제목
 * @param thumbnailUrl 데이터베이스에 저장된 썸네일 URL (선택)
 * @returns 이미지 URL
 */
export function getRecipeImageUrl(
  recipeTitle: string,
  thumbnailUrl?: string | null
): string {
  if (thumbnailUrl && thumbnailUrl.trim()) {
    return thumbnailUrl;
  }

  const category = getRecipeCategory(recipeTitle);
  return getCategoryImage(category).url;
}

// 개발 환경에서 이미지 관련성 테스트를 위한 함수
export function testImageRelevance() {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🧪 이미지 관련성 테스트");

  const testCases = [
    { title: "흰쌀밥", imageUrl: "https://example.com/rice-bowl.jpg" },
    { title: "콩나물 무침", imageUrl: "https://example.com/bean-sprouts.jpg" },
    { title: "된장찌개", imageUrl: "https://example.com/random-food.jpg" },
    { title: "김치찌개", imageUrl: undefined },
  ];

  for (const testCase of testCases) {
    const relevance = calculateImageRelevance(testCase.title, testCase.imageUrl);
    const finalUrl = getRecipeImageUrlEnhanced(testCase.title, testCase.imageUrl);
    console.log(`"${testCase.title}": 관련성 ${relevance}점, 최종 URL: ${finalUrl}`);
  }

  console.groupEnd();
}

const SPECIFIC_RECIPE_CATEGORIES: Record<string, FoodImageCategory> = {
  // 밥류
  "흰쌀밥": "rice",
  "white-rice": "rice",
  "흰쌀밥 한 그릇": "rice",
  "white rice bowl": "rice",
  "현미밥": "rice",
  "brown-rice": "rice",
  "현미밥 한 그릇": "rice",
  "brown rice bowl": "rice",
  "잡곡밥": "rice",
  "mixed-grain-rice": "rice",
  "잡곡밥 한 그릇": "rice",
  "mixed grain rice": "rice",

  // 반찬류 - 나물/무침류
  "시금치나물": "side",
  "spinach-namul": "side",
  "spinach namul": "side",
  "콩나물무침": "side",
  "bean-sprout-namul": "side",
  "bean sprout namul": "side",
  "고구마줄기볶음": "side",
  "sweet-potato-stems": "side",
  "sweet potato stems": "side",
  "가지나물": "side",
  "eggplant-namul": "side",
  "eggplant namul": "side",
  "오이무침": "side",
  "cucumber-muchim": "side",
  "cucumber muchim": "side",
  "무생채": "side",
  "radish-salad": "side",
  "radish muchim": "side",
  "부추무침": "side",
  "chives muchim": "side",
  "미나리무침": "side",
  "water dropwort muchim": "side",
  "시래기나물": "side",
  "dried radish greens namul": "side",
  "고사리나물": "side",
  "bracken fern namul": "side",
  "도라지나물": "side",
  "balloon flower namul": "side",
  "우엉조림": "side",
  "burdock stew": "side",

  // 반찬류 - 볶음/조림류
  "감자조림": "side",
  "potato-stew": "side",
  "potato jorim": "side",
  "두부조림": "side",
  "tofu-stew": "side",
  "tofu jorim": "side",
  "계란찜": "side",
  "egg-custard": "side",
  "steamed egg": "side",
  "애호박볶음": "side",
  "zucchini-stir-fry": "side",
  "zucchini bokkeum": "side",
  "당근볶음": "side",
  "carrot stir-fry": "side",
  "양파볶음": "side",
  "onion stir-fry": "side",
  "마늘종볶음": "side",
  "garlic chives stir-fry": "side",

  // 국/탕류
  "된장국": "soup",
  "doenjang-soup": "soup",
  "doenjang soup": "soup",
  "미역국": "soup",
  "seaweed-soup": "soup",
  "seaweed soup": "soup",
  "콩나물국": "soup",
  "bean-sprout-soup": "soup",
  "bean sprout soup": "soup",
  "북어국": "soup",
  "dried-pollack-soup": "soup",
  "dried pollack soup": "soup",
  "무국": "soup",
  "radish-soup": "soup",
  "radish soup": "soup",
  "육개장": "soup",
  "yukgaejang": "soup",
  "beef radish soup": "soup",
  "감자탕": "soup",
  "gamjatang": "soup",
  "pork spine stew": "soup",

  // 찌개류
  "김치찌개": "stew",
  "kimchi-stew": "stew",
  "kimchi jjigae": "stew",
  "된장찌개": "stew",
  "doenjang-stew": "stew",
  "doenjang jjigae": "stew",
  "순두부찌개": "stew",
  "soft-tofu-stew": "stew",
  "soondubu jjigae": "stew",
  "부대찌개": "stew",
  "budae jjigae": "stew",
  "army stew": "stew",
  "고추장찌개": "stew",
  "gochujang jjigae": "stew",
  "청국장찌개": "stew",
  "cheonggukjang jjigae": "stew",

  // 과일류
  "사과": "fruit",
  "apple": "fruit",
  "바나나": "fruit",
  "banana": "fruit",
  "오렌지": "fruit",
  "orange": "fruit",
  "포도": "fruit",
  "grapes": "fruit",
  "키위": "fruit",
  "kiwi": "fruit",
  "딸기": "fruit",
  "strawberry": "fruit",
  "블루베리": "fruit",
  "blueberry": "fruit",
  "레몬": "fruit",
  "lemon": "fruit",
  "자몽": "fruit",
  "grapefruit": "fruit",
  "망고": "fruit",
  "mango": "fruit",
  "파인애플": "fruit",
  "pineapple": "fruit",
  "수박": "fruit",
  "watermelon": "fruit",
  "멜론": "fruit",
  "melon": "fruit",
  "참외": "fruit",
  "oriental melon": "fruit",
  "복숭아": "fruit",
  "peach": "fruit",
  "배": "fruit",
  "pear": "fruit",
  "감": "fruit",
  "persimmon": "fruit",
  "귤": "fruit",
  "tangerine": "fruit",
  "유자": "fruit",
  "yuzu": "fruit",

  // 샐러드류
  "야채샐러드": "salad",
  "vegetable salad": "salad",
  "그린샐러드": "salad",
  "green salad": "salad",
  "토마토샐러드": "salad",
  "tomato salad": "salad",

  // 간식류
  "쿠키": "snack",
  "cookie": "snack",
  "빵": "snack",
  "bread": "snack",
  "케이크": "snack",
  "cake": "snack",
  "초콜릿": "snack",
  "chocolate": "snack",
  "사탕": "snack",
  "candy": "snack",
  "젤리": "snack",
  "jelly": "snack",
  "아이스크림": "snack",
  "ice cream": "snack",
  "요거트": "snack",
  "yogurt": "snack",
  "치즈": "snack",
  "cheese": "snack",

  // 음료류
  "커피": "drink",
  "coffee": "drink",
  "라떼": "drink",
  "latte": "drink",
  "에스프레소": "drink",
  "espresso": "drink",
  "카푸치노": "drink",
  "cappuccino": "drink",
  "우유": "drink",
  "milk": "drink",
  "두유": "drink",
  "soy milk": "drink",
  "스무디": "drink",
  "smoothie": "drink",
  "에이드": "drink",
  "ade": "drink",
  "주스": "drink",
  "juice": "drink",
  "차": "drink",
  "tea": "drink",
};

function getSpecificRecipeImageUrl(title: string): string | null {
  const normalized = title.toLowerCase();

  // 1. 제철 과일 확인 (우선순위 높음)
  const seasonalFruit = SEASONAL_FRUITS.find((fruit) =>
    normalized.includes(fruit.name.toLowerCase()) ||
    normalized.includes(fruit.id.toLowerCase())
  );
  if (seasonalFruit && seasonalFruit.imageUrl) {
    return seasonalFruit.imageUrl;
  }

  // 2. 특정 레시피 카테고리 확인
  const category = SPECIFIC_RECIPE_CATEGORIES[normalized];
  if (category) {
    return getCategoryImage(category).url;
  }
  return null;
}

/**
 * 레시피 이름과 이미지 URL의 관련성 점수 계산
 * 0-100 사이의 점수로 관련성 평가
 */
function calculateImageRelevance(recipeTitle: string, imageUrl?: string): number {
  if (!imageUrl) return 0;

  const title = recipeTitle.toLowerCase();
  const url = imageUrl.toLowerCase();

  // 기본 점수
  let score = 20; // 기본 관련성

  // 주요 재료 키워드 매칭
  const ingredients = extractIngredientsFromTitle(title);
  for (const ingredient of ingredients) {
    if (url.includes(ingredient)) {
      score += 25; // 재료가 URL에 포함되면 높은 점수
    }
  }

  // 레시피 타입 매칭
  const recipeTypeKeywords = getRecipeTypeKeywords(title);
  for (const keyword of recipeTypeKeywords) {
    if (url.includes(keyword)) {
      score += 15; // 레시피 타입이 URL에 포함되면 중간 점수
    }
  }

  // 음식 카테고리 매칭
  const category = getRecipeCategory(recipeTitle);
  const categoryKeywords = getCategoryKeywords(category);
  for (const keyword of categoryKeywords) {
    if (url.includes(keyword)) {
      score += 10; // 카테고리 키워드가 URL에 포함되면 낮은 점수
    }
  }

  // Unsplash나 일반 이미지 URL일 경우 추가 점수
  if (url.includes('unsplash') || url.includes('pexels') || url.includes('food')) {
    score += 20; // 음식 관련 이미지 호스트일 경우 추가 점수
  }

  // 점수 제한 (0-100)
  return Math.min(Math.max(score, 0), 100);
}

/**
 * 레시피 제목에서 주요 재료 추출
 */
function extractIngredientsFromTitle(title: string): string[] {
  const ingredients: string[] = [];

  // 한글 재료 키워드
  const koreanIngredients = [
    '쌀', '밥', '흰쌀', '보리', '현미', '잡곡',
    '콩나물', '시금치', '가지', '오이', '무', '생채', '무침',
    '된장', '김치', '순두부', '부대', '고추장', '청국장',
    '미역', '북어', '육개장', '감자탕',
    '감자', '두부', '계란', '애호박', '당근', '양파', '마늘', '생강',
    '사과', '바나나', '오렌지', '포도', '키위', '딸기', '레몬', '망고',
    '커피', '차', '주스', '우유'
  ];

  for (const ingredient of koreanIngredients) {
    if (title.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  }

  // 영문 재료 키워드
  const englishIngredients = [
    'rice', 'white', 'brown', 'barley', 'bean', 'sprout',
    'spinach', 'eggplant', 'cucumber', 'radish', 'kimchi',
    'tofu', 'egg', 'zucchini', 'carrot', 'onion', 'garlic', 'ginger',
    'apple', 'banana', 'orange', 'grape', 'kiwi', 'strawberry', 'lemon', 'mango',
    'coffee', 'tea', 'juice', 'milk'
  ];

  for (const ingredient of englishIngredients) {
    if (title.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  }

  return ingredients;
}

/**
 * 레시피 제목에서 레시피 타입 키워드 추출
 */
function getRecipeTypeKeywords(title: string): string[] {
  const keywords: string[] = [];

  const typeKeywords = [
    '찌개', '국', '탕', '찐', '볶음', '조림', '구이', '튀김', '전',
    '무침', '나물', '생채', '샐러드', '밥', '밥', '밥',
    'stew', 'soup', 'steam', 'stir-fry', 'braised', 'grilled', 'fried', 'pancake',
    'salad', 'rice', 'rice', 'rice'
  ];

  for (const keyword of typeKeywords) {
    if (title.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

/**
 * 카테고리별 키워드 반환
 */
function getCategoryKeywords(category: FoodImageCategory): string[] {
  const categoryKeywords: Record<FoodImageCategory, string[]> = {
    rice: ['rice', '밥', '쌀', 'bowl', '그릇'],
    side: ['side', '반찬', 'namul', '나물', 'muchim', '무침', 'stir-fry', '볶음'],
    soup: ['soup', '국', '탕', 'broth', '국물'],
    stew: ['stew', '찌개', 'jjigae', 'jjigae'],
    fruit: ['fruit', '과일', 'fresh', '신선'],
    snack: ['snack', '간식', 'cookie', '쿠키', 'bread', '빵'],
    salad: ['salad', '샐러드', 'vegetable', '야채', 'green'],
    dessert: ['dessert', '디저트', 'cake', '케이크', 'sweet', '달콤'],
    drink: ['drink', '음료', 'beverage', 'juice', '주스', 'coffee', '커피'],
    default: ['food', '음식', 'dish', '요리']
  };

  return categoryKeywords[category] || categoryKeywords.default;
}

/**
 * 레시피 제목에서 foodjpg.md의 직접 링크를 찾는 함수 (부분 매칭 지원)
 */
function findDirectLinkFromTitle(recipeTitle: string): string | null {
  const trimmedTitle = recipeTitle.trim();
  
  // 1. 정확한 매칭 시도
  if (FOOD_IMAGE_DIRECT_LINKS[trimmedTitle]) {
    return FOOD_IMAGE_DIRECT_LINKS[trimmedTitle];
  }
  
  // 2. 부분 매칭 시도 (레시피 제목에 음식명이 포함되어 있는지 확인)
  for (const [foodName, imageUrl] of Object.entries(FOOD_IMAGE_DIRECT_LINKS)) {
    if (trimmedTitle.includes(foodName)) {
      console.log(`[RecipeImage] 부분 매칭 발견: "${trimmedTitle}"에 "${foodName}" 포함`);
      return imageUrl;
    }
  }
  
  return null;
}

/**
 * 개선된 레시피 이미지 URL 생성 (이미지 관련성 검증 포함)
 * 
 * 우선순위:
 * 1. FOOD_IMAGE_DIRECT_LINKS (foodjpg.md에서 제공된 직접 링크) - 최우선
 * 2. 썸네일 URL (관련성 높을 때)
 * 3. 특정 레시피 이미지
 * 4. 카테고리 기반 이미지
 */
export function getRecipeImageUrlEnhanced(
  recipeTitle: string,
  thumbnailUrl?: string | null
): string {
  console.groupCollapsed("[RecipeImage] 이미지 URL 결정");
  console.log("레시피 제목:", recipeTitle);
  console.log("썸네일 URL:", thumbnailUrl);

  // 1. foodjpg.md에서 제공된 직접 링크 확인 (최우선, 부분 매칭 지원)
  const directLink = findDirectLinkFromTitle(recipeTitle);
  if (directLink) {
    console.log("✅ foodjpg.md 직접 링크 사용:", directLink);
    console.groupEnd();
    return directLink;
  }

  // 2. 썸네일 URL이 있고 관련성이 높으면 사용
  if (thumbnailUrl && thumbnailUrl.trim()) {
    const relevanceScore = calculateImageRelevance(recipeTitle, thumbnailUrl);
    console.log("썸네일 이미지 관련성 점수:", relevanceScore);

    if (relevanceScore >= 50) { // 50점 이상이면 관련성 높음으로 판단
      console.log("✅ 썸네일 이미지 사용 (관련성 높음)");
      console.groupEnd();
      return thumbnailUrl;
    } else {
      console.log("⚠️ 썸네일 이미지 관련성 낮음, 대체 이미지 사용");
    }
  }

  // 3. 특정 레시피 이미지 확인
  const specificImageUrl = getSpecificRecipeImageUrl(recipeTitle);
  if (specificImageUrl) {
    console.log("✅ 특정 레시피 이미지 사용:", specificImageUrl);
    console.groupEnd();
    return specificImageUrl;
  }

  // 4. 카테고리 기반 이미지 사용
  const category = getRecipeCategory(recipeTitle);
  const categoryImageUrl = getCategoryImage(category).url;
  console.log("✅ 카테고리 기반 이미지 사용:", category, categoryImageUrl);
  console.groupEnd();
  return categoryImageUrl;
}

