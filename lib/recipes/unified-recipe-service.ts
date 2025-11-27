/**
 * @file lib/recipes/unified-recipe-service.ts
 * @description 통합 레시피 검색 서비스 - Edamam API + 폴백
 * 
 * 핵심 기능:
 * 1. Edamam API를 통한 레시피 검색
 * 2. EdamamRecipe → RecipeDetailForDiet 변환
 * 3. 에러 처리 및 폴백
 */

import type { RecipeDetailForDiet, Ingredient, RecipeNutrition } from "@/types/recipe";
import { getRecipeImageUrlEnhanced } from "@/lib/utils/recipe-image";

// Edamam API 응답 타입
interface EdamamRecipe {
  recipe: {
    uri: string;
    label: string;
    image?: string;
    source?: string;
    url?: string;
    yield: number;
    ingredients: Array<{
      text: string;
      food: string;
      quantity?: number;
      measure?: string;
    }>;
    calories: number;
    totalNutrients: {
      PROCNT?: { quantity: number };
      CHOCDF?: { quantity: number };
      FAT?: { quantity: number };
      NA?: { quantity: number };
      FIBTG?: { quantity: number };
    };
    cuisineType?: string[];
    mealType?: string[];
    dishType?: string[];
  };
}

/**
 * Edamam API 레시피 검색
 */
/**
 * 검색어 확장 및 최적화
 */
function expandSearchQuery(query: string): string[] {
  const expandedQueries = [query]; // 원본 쿼리 포함
  const lowerQuery = query.toLowerCase();

  // 한글 레시피별 검색어 확장
  const recipeExpansions: Record<string, string[]> = {
    "흰쌀밥": ["흰쌀밥", "white rice", "쌀밥", "밥", "rice bowl", "white rice bowl"],
    "보리밥": ["보리밥", "barley rice", "보리쌀밥", "barley rice bowl"],
    "콩나물 무침": ["콩나물 무침", "bean sprout namul", "콩나물", "bean sprout salad", "kongnamul muchim"],
    "된장찌개": ["된장찌개", "doenjang jjigae", "된장찌게", "doenjang stew", "soybean paste stew"],
    "김치찌개": ["김치찌개", "kimchi jjigae", "kimchi stew", "김치찌게"],
    "된장국": ["된장국", "doenjang soup", "된장 soup", "soybean paste soup"],
    "미역국": ["미역국", "seaweed soup", "miyeok guk"],
    "시금치 나물": ["시금치 나물", "spinach namul", "시금치", "spinach salad"],
    "콩나물 국": ["콩나물 국", "bean sprout soup", "kongnamul guk"],
    "육개장": ["육개장", "yukgaejang", "beef radish soup", "yuk gae jang"],
    "감자탕": ["감자탕", "gamjatang", "pork spine stew"],
    "순두부찌개": ["순두부찌개", "soondubu jjigae", "soft tofu stew"],
    "부대찌개": ["부대찌개", "budae jjigae", "army stew"],
    "청국장찌개": ["청국장찌개", "cheonggukjang jjigae", "fermented soybean stew"],
    "고추장찌개": ["고추장찌개", "gochujang jjigae", "red pepper paste stew"]
  };

  // 검색어 확장 적용
  for (const [key, expansions] of Object.entries(recipeExpansions)) {
    if (lowerQuery.includes(key.toLowerCase())) {
      expandedQueries.push(...expansions);
      break; // 첫 번째 매칭된 것만 사용
    }
  }

  // 일반적인 확장 (한글 음식일 경우 영문 버전도 추가)
  if (/^[가-힣\s]+$/.test(query)) { // 한글만 있는 경우
    // 간단한 영문 번역 시도
    const englishTranslations: Record<string, string> = {
      "밥": "rice",
      "국": "soup",
      "찌개": "stew",
      "무침": "salad",
      "나물": "namul",
      "볶음": "stir fry",
      "조림": "braised",
      "구이": "grilled",
      "튀김": "fried",
      "찐": "steamed",
      "전": "pancake",
      "김치": "kimchi",
      "된장": "doenjang",
      "고추장": "gochujang",
      "청국장": "cheonggukjang",
      "미역": "seaweed",
      "콩나물": "bean sprout",
      "시금치": "spinach",
      "가지": "eggplant",
      "오이": "cucumber",
      "무": "radish",
      "감자": "potato",
      "두부": "tofu",
      "계란": "egg",
      "당근": "carrot",
      "양파": "onion",
      "마늘": "garlic"
    };

    let englishVersion = query;
    for (const [korean, english] of Object.entries(englishTranslations)) {
      englishVersion = englishVersion.replace(new RegExp(korean, 'g'), english);
    }

    if (englishVersion !== query) {
      expandedQueries.push(englishVersion);
    }
  }

  // 중복 제거 및 최대 3개로 제한
  return Array.from(new Set(expandedQueries)).slice(0, 3);
}

export async function searchRecipes(options: {
  query: string;                     // 검색어 (예: "chicken", "korean soup")
  mealType?: string;                 // "Breakfast", "Lunch", "Dinner", "Snack"
  cuisineType?: string;              // "Korean", "American", "Asian"
  maxCalories?: number;              // 최대 칼로리
  excludedIngredients?: string[];    // 제외할 재료
  limit?: number;                    // 결과 수 (기본 10)
}): Promise<RecipeDetailForDiet[]> {
  const { query, mealType, cuisineType, maxCalories, excludedIngredients, limit = 10 } = options;

  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    console.warn("⚠️ Edamam API 키가 없습니다. 폴백 레시피를 사용하세요.");
    return [];
  }

  try {
    console.group("🔍 Edamam API 레시피 검색 (확장 검색)");
    console.log("원본 검색어:", query);

    // 검색어 확장
    const searchQueries = expandSearchQuery(query);
    console.log("확장된 검색어들:", searchQueries);

    const allRecipes: RecipeDetailForDiet[] = [];
    const seenUris = new Set<string>(); // 중복 방지

    // 각 검색어로 검색 수행
    for (const searchQuery of searchQueries) {
      console.log(`🔎 "${searchQuery}" 검색 중...`);

      const params = new URLSearchParams({
        type: "public",
        q: searchQuery,
        app_id: appId,
        app_key: appKey,
        to: Math.ceil(limit / searchQueries.length).toString(), // 각 쿼리당 할당량
      });

      if (mealType) params.append("mealType", mealType);
      if (cuisineType) params.append("cuisineType", cuisineType);
      if (maxCalories) params.append("calories", `0-${maxCalories}`);

      // 제외 재료
      if (excludedIngredients && excludedIngredients.length > 0) {
        for (const ingredient of excludedIngredients) {
          params.append("excluded", ingredient);
        }
      }

      const url = `https://api.edamam.com/api/recipes/v2?${params.toString()}`;
      console.log("API URL:", url);

      try {
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`⚠️ "${searchQuery}" 검색 실패: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const hits: EdamamRecipe[] = data.hits || [];

        console.log(`✅ "${searchQuery}": ${hits.length}개 결과`);

        // 중복 제거하며 결과 추가
        for (const hit of hits) {
          if (!seenUris.has(hit.recipe.uri)) {
            seenUris.add(hit.recipe.uri);
            allRecipes.push(convertEdamamToRecipeDetail(hit));
          }
        }
      } catch (queryError) {
        console.warn(`⚠️ "${searchQuery}" 검색 중 오류:`, queryError);
        continue;
      }
    }

    // 결과 정렬 및 제한
    const finalRecipes = allRecipes
      .sort((a, b) => {
        // 원본 쿼리와 더 관련성 높은 결과 우선
        const aRelevance = calculateQueryRelevance(query, a.title);
        const bRelevance = calculateQueryRelevance(query, b.title);
        return bRelevance - aRelevance;
      })
      .slice(0, limit);

    console.log(`✅ 총 ${finalRecipes.length}개 레시피 검색 성공`);
    console.groupEnd();

    return finalRecipes;
  } catch (error) {
    console.error("❌ Edamam API 호출 실패:", error);
    console.groupEnd();
    return [];
  }
}

/**
 * 쿼리와 레시피 제목의 관련성 점수 계산
 */
function calculateQueryRelevance(query: string, title: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();

  let score = 0;

  // 정확한 일치
  if (titleLower.includes(queryLower)) {
    score += 100;
  }

  // 단어 단위 일치
  const queryWords = queryLower.split(/\s+/);
  const titleWords = titleLower.split(/\s+/);

  for (const queryWord of queryWords) {
    for (const titleWord of titleWords) {
      if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
        score += 50;
      }
    }
  }

  // 한글-영문 변환 고려
  const koreanToEnglish: Record<string, string> = {
    '밥': 'rice', '국': 'soup', '찌개': 'stew', '무침': 'namul',
    '김치': 'kimchi', '된장': 'doenjang', '콩나물': 'bean sprout'
  };

  for (const [korean, english] of Object.entries(koreanToEnglish)) {
    if (queryLower.includes(korean) && titleLower.includes(english)) {
      score += 30;
    }
    if (queryLower.includes(english) && titleLower.includes(korean)) {
      score += 30;
    }
  }

  return score;
}

/**
 * Edamam 레시피 → RecipeDetailForDiet 변환
 */
function convertEdamamToRecipeDetail(hit: EdamamRecipe): RecipeDetailForDiet {
  const { recipe } = hit;
  
  // 재료 변환
  const ingredients: Ingredient[] = recipe.ingredients.map(ing => ({
    name: ing.food,
    amount: ing.quantity?.toString() || "",
    unit: ing.measure || "",
  }));

  // 영양 정보 변환 (1인분 기준)
  const servings = recipe.yield || 1;
  const nutrition: RecipeNutrition = {
    calories: Math.round(recipe.calories / servings),
    protein: Math.round((recipe.totalNutrients.PROCNT?.quantity || 0) / servings),
    carbs: Math.round((recipe.totalNutrients.CHOCDF?.quantity || 0) / servings),
    fat: Math.round((recipe.totalNutrients.FAT?.quantity || 0) / servings),
    sodium: Math.round((recipe.totalNutrients.NA?.quantity || 0) / servings),
    fiber: Math.round((recipe.totalNutrients.FIBTG?.quantity || 0) / servings),
  };

  // 이미지 URL 검증 및 최적화
  const validatedImageUrl = getRecipeImageUrlEnhanced(recipe.label, recipe.image);

  return {
    id: recipe.uri,
    title: recipe.label,
    description: `${recipe.source}에서 제공하는 레시피`,
    image: validatedImageUrl,
    url: recipe.url,
    source: "edamam",
    ingredients,
    instructions: recipe.url ? `레시피 상세: ${recipe.url}` : "",
    nutrition,
    cuisineType: recipe.cuisineType,
    mealType: recipe.mealType,
    dishType: recipe.dishType,
  };
}

