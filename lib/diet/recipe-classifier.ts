/**
 * @file lib/diet/recipe-classifier.ts
 * @description 레시피 분류 모듈
 *
 * 주요 기능:
 * 1. 반찬 유형 분류 (고당류/조미료 포함/저당/채소 요리)
 * 2. 당 함량 평가
 * 3. 채소 요리 감지 (당 함유 음식으로 분류하지 않음)
 */

import type { RecipeDetailForDiet } from "@/types/recipe";

/**
 * 반찬 유형 분류
 */
export type SideDishType = 
  | 'high_sugar'      // 고당류 반찬 (제외)
  | 'moderate_sugar'  // 조미료 포함 반찬 (조건부 허용)
  | 'low_sugar'       // 저당 반찬 (허용)
  | 'vegetable';      // 채소 요리 (당 함유 아님)

/**
 * 반찬 분류 결과
 */
export interface SideDishClassification {
  type: SideDishType;
  sugarContent: number; // 당 함량 (g)
  isSugarMainIngredient: boolean; // 당이 주재료인지 여부
}

/**
 * 채소 요리 키워드 목록 (당 함유 음식으로 분류하지 않음)
 */
const VEGETABLE_KEYWORDS = [
  '당근', 'carrot',
  '시금치', 'spinach',
  '브로콜리', 'broccoli',
  '양배추', 'cabbage',
  '배추', 'napa cabbage',
  '상추', 'lettuce',
  '오이', 'cucumber',
  '호박', 'zucchini', 'pumpkin',
  '애호박', 'zucchini',
  '무', 'radish',
  '양파', 'onion',
  '마늘', 'garlic',
  '파', 'green onion', 'scallion',
  '대파', 'leek',
  '쪽파', 'chive',
  '버섯', 'mushroom',
  '토마토', 'tomato',
  '피망', 'bell pepper',
  '고추', 'pepper',
  '가지', 'eggplant',
  '콩나물', 'bean sprouts',
  '숙주', 'mung bean sprouts',
  '미나리', 'water dropwort',
  '쑥갓', 'crown daisy',
  '부추', 'chives',
  '깻잎', 'perilla leaf',
  '시래기', 'dried radish greens',
  '고사리', 'bracken',
  '취나물', 'aster',
  '두릅', 'aralia',
  '나물', // 일반적인 나물
];

/**
 * 고당류 반찬 키워드 (당이 주재료)
 */
const HIGH_SUGAR_KEYWORDS = [
  '맛탕', 'tangle',
  '당절임', 'sugar pickled',
  '시럽', 'syrup',
  '캔디', 'candy',
  '사탕', 'sweet',
  '젤리', 'jelly',
  '잼', 'jam',
  '마시멜로', 'marshmallow',
  '초콜릿', 'chocolate',
  '케이크', 'cake',
  '쿠키', 'cookie',
  '도넛', 'donut',
  '파이', 'pie',
  '타르트', 'tart',
  '아이스크림', 'ice cream',
  '푸딩', 'pudding',
  '크림', 'cream',
];

/**
 * 당 함유 조미료 키워드
 */
const SUGAR_SEASONING_KEYWORDS = [
  '설탕', 'sugar',
  '물엿', 'corn syrup',
  '올리고당', 'oligosaccharide',
  '꿀', 'honey',
  '조청', 'rice syrup',
  '액상과당', 'fructose syrup',
  '과당', 'fructose',
  '자당', 'sucrose',
  '포도당', 'glucose',
];

/**
 * 반찬 유형 분류 함수
 */
export function classifySideDish(recipe: RecipeDetailForDiet): SideDishClassification {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || '').toLowerCase();
  const ingredients = recipe.ingredients.map(ing => ing.name.toLowerCase()).join(' ');
  const allText = [title, description, ingredients].join(' ');

  console.group(`[RecipeClassifier] 레시피 분류: ${recipe.title}`);

  // 1. 채소 요리 확인 (당 함유 음식으로 분류하지 않음)
  const isVegetableDish = VEGETABLE_KEYWORDS.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return title.includes(keywordLower) || ingredients.includes(keywordLower);
  });

  // 채소 요리이지만 당이 주재료인 경우는 제외 (예: 고구마 맛탕)
  const hasSugarAsMainIngredient = HIGH_SUGAR_KEYWORDS.some(keyword => 
    title.includes(keyword.toLowerCase())
  );

  if (isVegetableDish && !hasSugarAsMainIngredient) {
    // 당근볶음, 시금치나물 등 채소 요리는 당 함유 음식으로 분류하지 않음
    console.log('✅ 채소 요리로 분류 (당 함유 아님)');
    console.groupEnd();
    return {
      type: 'vegetable',
      sugarContent: 0,
      isSugarMainIngredient: false
    };
  }

  // 2. 고당류 반찬 확인 (당이 주재료)
  const isHighSugar = HIGH_SUGAR_KEYWORDS.some(keyword => 
    title.includes(keyword.toLowerCase())
  );

  if (isHighSugar) {
    // 탄수화물의 대부분이 당일 가능성
    const estimatedSugar = (recipe.nutrition.carbs || 0) * 0.8; // 추정치
    console.log(`❌ 고당류 반찬으로 분류 (당 함량: ${estimatedSugar.toFixed(1)}g)`);
    console.groupEnd();
    return {
      type: 'high_sugar',
      sugarContent: estimatedSugar,
      isSugarMainIngredient: true
    };
  }

  // 3. 조미료로 당 포함 여부 확인
  const hasSugarAsSeasoning = SUGAR_SEASONING_KEYWORDS.some(ing => 
    allText.includes(ing.toLowerCase())
  );

  if (hasSugarAsSeasoning) {
    // 조미료로 사용된 당 함량 추정 (탄수화물의 일부)
    // 일반적으로 조미료로 사용되는 당은 전체 탄수화물의 5-15% 정도
    const estimatedSugar = (recipe.nutrition.carbs || 0) * 0.1; // 추정치
    console.log(`⚠️ 조미료 포함 반찬으로 분류 (당 함량: ${estimatedSugar.toFixed(1)}g)`);
    console.groupEnd();
    return {
      type: 'moderate_sugar',
      sugarContent: estimatedSugar,
      isSugarMainIngredient: false
    };
  }

  // 4. 저당 반찬
  console.log('✅ 저당 반찬으로 분류');
  console.groupEnd();
  return {
    type: 'low_sugar',
    sugarContent: 0,
    isSugarMainIngredient: false
  };
}

/**
 * 레시피의 당 함량 추정 (영양 정보 기반)
 */
export function estimateSugarContent(recipe: RecipeDetailForDiet): number {
  // 영양 상세 정보에 당 함량이 있으면 사용
  if (recipe.nutritionDetails?.sugar !== undefined) {
    return recipe.nutritionDetails.sugar;
  }

  // 탄수화물에서 당 함량 추정
  // 일반적으로 탄수화물의 10-20%가 당일 수 있음
  const carbs = recipe.nutrition.carbs || 0;
  
  // 분류에 따라 추정치 조정
  const classification = classifySideDish(recipe);
  
  if (classification.type === 'high_sugar') {
    return carbs * 0.8; // 고당류는 대부분 당
  } else if (classification.type === 'moderate_sugar') {
    return carbs * 0.1; // 조미료 포함은 소량
  }
  
  return 0; // 저당 또는 채소 요리
}

