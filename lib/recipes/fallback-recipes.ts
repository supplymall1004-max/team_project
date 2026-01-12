/**
 * @file lib/recipes/fallback-recipes.ts
 * @description 폴백 한식 레시피 데이터베이스 (Edamam API 실패 시 사용)
 * 
 * 레시피 구성:
 * - rice: 밥류 (흰쌀밥, 현미밥, 잡곡밥)
 * - side: 반찬류 (나물, 볶음, 조림, 무침, 구이 등)
 * - soup: 국/탕류 (된장국, 미역국, 육개장 등)
 * - stew: 찌개류 (김치찌개, 된장찌개 등)
 */

import type { RecipeDetailForDiet } from "@/types/recipe";

type DishType = "rice" | "side" | "soup" | "stew";
type MealType = "breakfast" | "lunch" | "dinner";

interface FallbackRecipeTemplate {
  type: DishType;
  mealTypes: MealType[];
  recipes: RecipeDetailForDiet[];
}

// 밥류
const RICE_RECIPES: RecipeDetailForDiet[] = [
  {
    title: "흰쌀밥",
    description: "기본 흰쌀밥 한 공기",
    source: "fallback",
    ingredients: [
      { name: "쌀", amount: "100", unit: "g" },
      { name: "물", amount: "120", unit: "ml" },
    ],
    instructions: "쌀을 씻어 30분 불린 후 물을 넣고 밥솥에서 취사합니다.",
    nutrition: {
      calories: 310,
      protein: 5.5,
      carbs: 68.0,
      fat: 0.5,
      sodium: 0,
      fiber: 0.6,
    },
    dishType: ["rice"],
    mealType: ["breakfast", "lunch", "dinner"],
    emoji: "🍚",
  },
  {
    title: "현미밥",
    description: "건강한 현미밥 한 공기",
    source: "fallback",
    ingredients: [
      { name: "현미", amount: "100", unit: "g" },
      { name: "물", amount: "150", unit: "ml" },
    ],
    instructions: "현미를 씻어 2시간 이상 불린 후 물을 넣고 밥솥에서 취사합니다.",
    nutrition: {
      calories: 330,
      protein: 6.8,
      carbs: 72.0,
      fat: 2.3,
      sodium: 0,
      fiber: 3.5,
    },
    dishType: ["rice"],
    mealType: ["breakfast", "lunch", "dinner"],
    emoji: "🍚",
  },
  {
    title: "잡곡밥",
    description: "영양 가득한 잡곡밥 한 공기",
    source: "fallback",
    ingredients: [
      { name: "쌀", amount: "70", unit: "g" },
      { name: "잡곡", amount: "30", unit: "g" },
      { name: "물", amount: "140", unit: "ml" },
    ],
    instructions: "쌀과 잡곡을 씻어 1시간 불린 후 물을 넣고 밥솥에서 취사합니다.",
    nutrition: {
      calories: 320,
      protein: 7.2,
      carbs: 69.0,
      fat: 1.8,
      sodium: 0,
      fiber: 4.0,
    },
    dishType: ["rice"],
    mealType: ["breakfast", "lunch", "dinner"],
    emoji: "🍚",
  },
];

// 반찬류 (나물, 볶음, 조림, 무침)
const SIDE_RECIPES: RecipeDetailForDiet[] = [
  {
    title: "시금치나물",
    description: "건강한 시금치 무침",
    source: "fallback",
    ingredients: [
      { name: "시금치", amount: "200", unit: "g" },
      { name: "참기름", amount: "1", unit: "큰술" },
      { name: "마늘", amount: "1", unit: "쪽" },
      { name: "깨소금", amount: "1", unit: "작은술" },
    ],
    instructions: "시금치를 데쳐서 물기를 짜고 참기름, 마늘, 깨소금으로 무칩니다.",
    nutrition: {
      calories: 45,
      protein: 2.5,
      carbs: 4.0,
      fat: 2.5,
      sodium: 15,
      fiber: 2.0,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "콩나물무침",
    description: "아삭한 콩나물 무침",
    source: "fallback",
    ingredients: [
      { name: "콩나물", amount: "200", unit: "g" },
      { name: "참기름", amount: "1", unit: "작은술" },
      { name: "깨소금", amount: "1", unit: "작은술" },
      { name: "파", amount: "약간", unit: "" },
    ],
    instructions: "콩나물을 삶아 물기를 빼고 참기름, 깨소금, 파로 무칩니다.",
    nutrition: {
      calories: 40,
      protein: 4.0,
      carbs: 5.0,
      fat: 1.5,
      sodium: 10,
      fiber: 1.5,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "고구마줄기볶음",
    description: "구수한 고구마줄기 볶음",
    source: "fallback",
    ingredients: [
      { name: "고구마줄기", amount: "150", unit: "g" },
      { name: "들기름", amount: "1", unit: "큰술" },
      { name: "마늘", amount: "2", unit: "쪽" },
      { name: "양파", amount: "50", unit: "g" },
    ],
    instructions: "고구마줄기를 삶아 들기름에 마늘, 양파와 함께 볶습니다.",
    nutrition: {
      calories: 80,
      protein: 2.0,
      carbs: 8.0,
      fat: 4.5,
      sodium: 20,
      fiber: 2.5,
    },
    dishType: ["side"],
    mealType: ["lunch", "dinner"],
  },
  {
    title: "가지나물",
    description: "부드러운 가지나물",
    source: "fallback",
    ingredients: [
      { name: "가지", amount: "2", unit: "개" },
      { name: "간장", amount: "1", unit: "큰술" },
      { name: "참기름", amount: "1", unit: "작은술" },
      { name: "마늘", amount: "1", unit: "쪽" },
    ],
    instructions: "가지를 쪄서 손으로 찢고 간장, 참기름, 마늘로 무칩니다.",
    nutrition: {
      calories: 50,
      protein: 1.5,
      carbs: 7.0,
      fat: 2.0,
      sodium: 350,
      fiber: 3.0,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "오이무침",
    description: "상큼한 오이무침",
    source: "fallback",
    ingredients: [
      { name: "오이", amount: "2", unit: "개" },
      { name: "고춧가루", amount: "1", unit: "큰술" },
      { name: "식초", amount: "1", unit: "큰술" },
      { name: "설탕", amount: "1", unit: "작은술" },
    ],
    instructions: "오이를 얇게 썰어 고춧가루, 식초, 설탕으로 무칩니다.",
    nutrition: {
      calories: 35,
      protein: 1.0,
      carbs: 7.0,
      fat: 0.3,
      sodium: 5,
      fiber: 1.0,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "감자조림",
    description: "달콤 짭조름한 감자조림",
    source: "fallback",
    ingredients: [
      { name: "감자", amount: "3", unit: "개" },
      { name: "간장", amount: "2", unit: "큰술" },
      { name: "올리고당", amount: "1", unit: "큰술" },
      { name: "참기름", amount: "1", unit: "작은술" },
    ],
    instructions: "감자를 큼직하게 썰어 간장, 올리고당, 참기름으로 조립니다.",
    nutrition: {
      calories: 120,
      protein: 2.5,
      carbs: 25.0,
      fat: 1.5,
      sodium: 450,
      fiber: 2.5,
    },
    dishType: ["side"],
    mealType: ["lunch", "dinner"],
  },
  {
    title: "두부조림",
    description: "고소한 두부조림",
    source: "fallback",
    ingredients: [
      { name: "두부", amount: "1", unit: "모" },
      { name: "간장", amount: "2", unit: "큰술" },
      { name: "마늘", amount: "2", unit: "쪽" },
      { name: "파", amount: "약간", unit: "" },
    ],
    instructions: "두부를 도톰하게 썰어 간장, 마늘과 함께 조립니다.",
    nutrition: {
      calories: 100,
      protein: 8.0,
      carbs: 4.0,
      fat: 5.0,
      sodium: 400,
      fiber: 1.0,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "계란찜",
    description: "부드러운 계란찜",
    source: "fallback",
    ingredients: [
      { name: "계란", amount: "3", unit: "개" },
      { name: "물", amount: "100", unit: "ml" },
      { name: "새우젓", amount: "약간", unit: "" },
      { name: "파", amount: "약간", unit: "" },
    ],
    instructions: "계란을 풀어 물과 섞고 찜기에서 약불로 찝니다.",
    nutrition: {
      calories: 110,
      protein: 9.0,
      carbs: 1.5,
      fat: 7.5,
      sodium: 150,
      fiber: 0,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "애호박볶음",
    description: "담백한 애호박볶음",
    source: "fallback",
    ingredients: [
      { name: "애호박", amount: "1", unit: "개" },
      { name: "양파", amount: "1/2", unit: "개" },
      { name: "마늘", amount: "2", unit: "쪽" },
      { name: "식용유", amount: "1", unit: "큰술" },
    ],
    instructions: "애호박과 양파를 썰어 마늘과 함께 볶습니다.",
    nutrition: {
      calories: 60,
      protein: 2.0,
      carbs: 8.0,
      fat: 2.5,
      sodium: 10,
      fiber: 2.0,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "무생채",
    description: "아삭한 무생채",
    source: "fallback",
    ingredients: [
      { name: "무", amount: "200", unit: "g" },
      { name: "고춧가루", amount: "1", unit: "큰술" },
      { name: "식초", amount: "1", unit: "큰술" },
      { name: "설탕", amount: "1", unit: "작은술" },
    ],
    instructions: "무를 채 썰어 고춧가루, 식초, 설탕으로 무칩니다.",
    nutrition: {
      calories: 40,
      protein: 1.0,
      carbs: 8.5,
      fat: 0.2,
      sodium: 5,
      fiber: 1.5,
    },
    dishType: ["side"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
];

// 국/탕류
const SOUP_RECIPES: RecipeDetailForDiet[] = [
  {
    title: "된장국",
    description: "구수한 된장국",
    source: "fallback",
    ingredients: [
      { name: "된장", amount: "1", unit: "큰술" },
      { name: "애호박", amount: "1/2", unit: "개" },
      { name: "두부", amount: "1/4", unit: "모" },
      { name: "멸치육수", amount: "500", unit: "ml" },
    ],
    instructions: "멸치육수에 된장을 풀고 애호박, 두부를 넣어 끓입니다.",
    nutrition: {
      calories: 60,
      protein: 4.0,
      carbs: 6.0,
      fat: 2.0,
      sodium: 650,
      fiber: 1.5,
    },
    dishType: ["soup"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "미역국",
    description: "영양 가득한 미역국",
    source: "fallback",
    ingredients: [
      { name: "미역", amount: "20", unit: "g" },
      { name: "소고기", amount: "50", unit: "g" },
      { name: "참기름", amount: "1", unit: "작은술" },
      { name: "국간장", amount: "1", unit: "큰술" },
    ],
    instructions: "미역을 불려 소고기와 참기름에 볶다가 물을 넣고 끓입니다.",
    nutrition: {
      calories: 80,
      protein: 8.0,
      carbs: 4.0,
      fat: 3.5,
      sodium: 450,
      fiber: 1.0,
    },
    dishType: ["soup"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "콩나물국",
    description: "시원한 콩나물국",
    source: "fallback",
    ingredients: [
      { name: "콩나물", amount: "200", unit: "g" },
      { name: "멸치육수", amount: "500", unit: "ml" },
      { name: "국간장", amount: "1", unit: "큰술" },
      { name: "마늘", amount: "2", unit: "쪽" },
    ],
    instructions: "멸치육수에 콩나물을 넣고 국간장, 마늘로 간해 끓입니다.",
    nutrition: {
      calories: 45,
      protein: 4.0,
      carbs: 5.0,
      fat: 1.0,
      sodium: 420,
      fiber: 1.5,
    },
    dishType: ["soup"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
  {
    title: "북어국",
    description: "해장에 좋은 북어국",
    source: "fallback",
    ingredients: [
      { name: "북어", amount: "1", unit: "마리" },
      { name: "무", amount: "100", unit: "g" },
      { name: "멸치육수", amount: "500", unit: "ml" },
      { name: "국간장", amount: "1", unit: "큰술" },
    ],
    instructions: "북어와 무를 멸치육수에 넣고 국간장으로 간해 끓입니다.",
    nutrition: {
      calories: 70,
      protein: 12.0,
      carbs: 4.0,
      fat: 0.5,
      sodium: 480,
      fiber: 1.0,
    },
    dishType: ["soup"],
    mealType: ["breakfast", "lunch"],
  },
  {
    title: "무국",
    description: "담백한 무국",
    source: "fallback",
    ingredients: [
      { name: "무", amount: "200", unit: "g" },
      { name: "멸치육수", amount: "500", unit: "ml" },
      { name: "국간장", amount: "1", unit: "큰술" },
      { name: "마늘", amount: "2", unit: "쪽" },
    ],
    instructions: "무를 썰어 멸치육수에 넣고 국간장, 마늘로 간해 끓입니다.",
    nutrition: {
      calories: 40,
      protein: 2.0,
      carbs: 7.0,
      fat: 0.5,
      sodium: 450,
      fiber: 1.5,
    },
    dishType: ["soup"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
];

// 찌개류
const STEW_RECIPES: RecipeDetailForDiet[] = [
  {
    title: "김치찌개",
    description: "얼큰한 김치찌개",
    source: "fallback",
    ingredients: [
      { name: "김치", amount: "200", unit: "g" },
      { name: "돼지고기", amount: "100", unit: "g" },
      { name: "두부", amount: "1/2", unit: "모" },
      { name: "물", amount: "500", unit: "ml" },
    ],
    instructions: "김치와 돼지고기를 볶다가 물을 넣고 두부를 넣어 끓입니다.",
    nutrition: {
      calories: 150,
      protein: 12.0,
      carbs: 8.0,
      fat: 8.0,
      sodium: 900,
      fiber: 2.0,
    },
    dishType: ["stew"],
    mealType: ["lunch", "dinner"],
  },
  {
    title: "된장찌개",
    description: "구수한 된장찌개",
    source: "fallback",
    ingredients: [
      { name: "된장", amount: "2", unit: "큰술" },
      { name: "두부", amount: "1/2", unit: "모" },
      { name: "애호박", amount: "1/2", unit: "개" },
      { name: "멸치육수", amount: "500", unit: "ml" },
    ],
    instructions: "멸치육수에 된장을 풀고 애호박, 두부를 넣어 끓입니다.",
    nutrition: {
      calories: 100,
      protein: 6.0,
      carbs: 10.0,
      fat: 3.5,
      sodium: 850,
      fiber: 2.0,
    },
    dishType: ["stew"],
    mealType: ["lunch", "dinner"],
  },
  {
    title: "순두부찌개",
    description: "부드러운 순두부찌개",
    source: "fallback",
    ingredients: [
      { name: "순두부", amount: "1", unit: "팩" },
      { name: "계란", amount: "1", unit: "개" },
      { name: "고춧가루", amount: "1", unit: "큰술" },
      { name: "멸치육수", amount: "400", unit: "ml" },
    ],
    instructions: "멸치육수에 순두부와 고춧가루를 넣고 끓이다 계란을 넣습니다.",
    nutrition: {
      calories: 120,
      protein: 10.0,
      carbs: 6.0,
      fat: 6.0,
      sodium: 550,
      fiber: 1.0,
    },
    dishType: ["stew"],
    mealType: ["breakfast", "lunch", "dinner"],
  },
];

// 전체 레시피 목록
export const FALLBACK_RECIPES: RecipeDetailForDiet[] = [
  ...RICE_RECIPES,
  ...SIDE_RECIPES,
  ...SOUP_RECIPES,
  ...STEW_RECIPES,
];

/**
 * 폴백 레시피 검색
 */
export function searchFallbackRecipes(options: {
  dishType?: DishType[];
  mealType?: MealType;
  excludeNames?: string[];  // 중복 방지용
  limit?: number;
}): RecipeDetailForDiet[] {
  let recipes = [...FALLBACK_RECIPES];

  // DishType 필터
  if (options.dishType && options.dishType.length > 0) {
    recipes = recipes.filter(r => 
      options.dishType!.some(dt => r.dishType?.includes(dt))
    );
  }

  // MealType 필터
  if (options.mealType) {
    recipes = recipes.filter(r =>
      r.mealType?.includes(options.mealType as string)
    );
  }

  // 중복 제외
  if (options.excludeNames && options.excludeNames.length > 0) {
    recipes = recipes.filter(r => 
      !options.excludeNames!.includes(r.title)
    );
  }

  // 랜덤 셔플
  recipes.sort(() => Math.random() - 0.5);

  // Limit 적용
  if (options.limit) {
    recipes = recipes.slice(0, options.limit);
  }

  return recipes;
}

/**
 * 특정 요리 타입의 폴백 레시피 1개 생성
 */
export function generateFallbackRecipe(
  dishType: DishType,
  mealType: MealType,
  excludeNames: string[] = []
): RecipeDetailForDiet | null {
  const results = searchFallbackRecipes({
    dishType: [dishType],
    mealType,
    excludeNames,
    limit: 1,
  });

  return results[0] || null;
}

